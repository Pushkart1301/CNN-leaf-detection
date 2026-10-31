import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageEnhance, ImageOps
from torch.utils.data import DataLoader, Dataset, TensorDataset, WeightedRandomSampler
from transformers import AutoImageProcessor, AutoModelForImageClassification


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class LeafImageDataset(Dataset):
    def __init__(self, root: Path, class_to_id: dict[str, int], processor, training: bool):
        self.root = root
        self.class_to_id = class_to_id
        self.processor = processor
        self.training = training
        self.samples = [
            (image_path, class_to_id[class_name])
            for class_name in sorted(class_to_id)
            for image_path in sorted((root / class_name).rglob("*"))
            if image_path.is_file() and image_path.suffix.lower() in IMAGE_SUFFIXES
        ]
        if not self.samples:
            raise ValueError(f"No supported image files found under {root}")
        counts = {class_id: 0 for class_id in class_to_id.values()}
        for _, label in self.samples:
            counts[label] += 1
        empty_classes = [
            name for name, class_id in class_to_id.items() if counts[class_id] == 0
        ]
        if empty_classes:
            raise ValueError(f"Missing images for classes under {root}: {empty_classes}")

        size = processor.size
        if hasattr(size, "get"):
            self.height = size.get("height", size.get("shortest_edge", 224))
            self.width = size.get("width", size.get("shortest_edge", 224))
        else:
            self.height = self.width = size
        self.mean = torch.tensor(processor.image_mean, dtype=torch.float32).view(3, 1, 1)
        self.std = torch.tensor(processor.image_std, dtype=torch.float32).view(3, 1, 1)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        image_path, label = self.samples[index]
        with Image.open(image_path) as source:
            image = source.convert("RGB")

        if self.training:
            if random.random() < 0.5:
                image = ImageOps.mirror(image)
            if random.random() < 0.5:
                image = image.rotate(random.uniform(-12, 12))
            if random.random() < 0.5:
                image = ImageEnhance.Brightness(image).enhance(random.uniform(0.85, 1.15))
            if random.random() < 0.5:
                image = ImageEnhance.Color(image).enhance(random.uniform(0.85, 1.15))

        image = image.resize((self.width, self.height), Image.Resampling.BICUBIC)
        pixels = torch.from_numpy(np.asarray(image, dtype=np.float32).copy() / 255.0)
        pixels = pixels.permute(2, 0, 1)
        pixels = (pixels - self.mean) / self.std
        return pixels, label


def evaluate(model, loader, device, class_count):
    model.eval()
    confusion = torch.zeros((class_count, class_count), dtype=torch.int64)
    total_loss = 0.0
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            output = model(pixel_values=images, labels=labels)
            total_loss += output.loss.item() * labels.size(0)
            predictions = output.logits.argmax(dim=1)
            for actual, predicted in zip(labels.cpu(), predictions.cpu()):
                confusion[actual, predicted] += 1
    accuracy = confusion.diag().sum().item() / confusion.sum().item()
    return total_loss / len(loader.dataset), accuracy, confusion


def extract_backbone_features(model, dataset, batch_size, device):
    if not hasattr(model, "swin"):
        raise ValueError("--freeze-backbone currently requires a Swin image-classification model.")
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    features = []
    labels = []
    model.eval()
    with torch.no_grad():
        for images, batch_labels in loader:
            output = model.swin(pixel_values=images.to(device))
            features.append(output.pooler_output.cpu())
            labels.append(batch_labels)
    return torch.cat(features), torch.cat(labels)


def evaluate_classifier_head(classifier, features, labels, device, class_count):
    classifier.eval()
    with torch.no_grad():
        logits = classifier(features.to(device))
        loss = torch.nn.functional.cross_entropy(logits, labels.to(device)).item()
        predictions = logits.argmax(dim=1).cpu()
    confusion = torch.zeros((class_count, class_count), dtype=torch.int64)
    for actual, predicted in zip(labels, predictions):
        confusion[actual, predicted] += 1
    accuracy = confusion.diag().sum().item() / confusion.sum().item()
    return loss, accuracy, confusion


def main():
    parser = argparse.ArgumentParser(
        description="Fine-tune a Hugging Face leaf classifier using labeled image folders."
    )
    parser.add_argument("--data", type=Path, default=Path("data/leaf_disease"))
    parser.add_argument("--output", type=Path, default=Path("models/leaf_disease_classifier"))
    parser.add_argument("--base-model", default="surgeonwz/plant-village")
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument(
        "--freeze-backbone",
        action="store_true",
        help="Train only the classification head; faster and less memory-intensive on CPU.",
    )
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if args.epochs < 1 or args.batch_size < 1 or args.learning_rate <= 0:
        parser.error("epochs, batch-size, and learning-rate must be positive")

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    train_root = args.data / "train"
    train_classes = sorted(path.name for path in train_root.iterdir() if path.is_dir())
    if len(train_classes) < 2:
        raise ValueError(f"Expected at least two class folders under {train_root}")

    class_to_id = {class_name: index for index, class_name in enumerate(train_classes)}
    for split in ("validation", "test"):
        split_root = args.data / split
        if not split_root.is_dir():
            raise ValueError(f"Missing required dataset split directory: {split_root}")
        split_classes = sorted(path.name for path in split_root.iterdir() if path.is_dir())
        if split_classes != train_classes:
            raise ValueError(
                f"{split_root} must contain exactly the same class folders as {train_root}."
            )

    processor = AutoImageProcessor.from_pretrained(args.base_model)
    model = AutoModelForImageClassification.from_pretrained(
        args.base_model,
        num_labels=len(train_classes),
        id2label={index: name for name, index in class_to_id.items()},
        label2id=class_to_id,
        ignore_mismatched_sizes=True,
    )
    if args.freeze_backbone:
        for parameter in model.parameters():
            parameter.requires_grad = False
        classifier = getattr(model, "classifier", None)
        if classifier is None:
            raise ValueError(
                f"Model {args.base_model} does not expose a classifier module to train."
            )
        for parameter in classifier.parameters():
            parameter.requires_grad = True

    train_data = LeafImageDataset(train_root, class_to_id, processor, training=True)
    validation_data = LeafImageDataset(args.data / "validation", class_to_id, processor, training=False)
    test_data = LeafImageDataset(args.data / "test", class_to_id, processor, training=False)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_label_counts = torch.bincount(
        torch.tensor([label for _, label in train_data.samples]),
        minlength=len(train_classes),
    ).float()
    class_weights = train_label_counts.sum() / (len(train_classes) * train_label_counts)
    sample_weights = torch.tensor(
        [class_weights[label].item() for _, label in train_data.samples],
        dtype=torch.double,
    )
    validation_loader = DataLoader(validation_data, batch_size=args.batch_size, num_workers=0)
    test_loader = DataLoader(test_data, batch_size=args.batch_size, num_workers=0)

    print(f"Device: {device}")
    print(f"Classes: {train_classes}")
    print(
        f"Images: train={len(train_data)}, "
        f"validation={len(validation_data)}, test={len(test_data)}"
    )
    if args.freeze_backbone:
        print("Caching frozen Swin features once; subsequent epochs train only the classification head.")
        train_features, train_labels = extract_backbone_features(
            model, train_data, args.batch_size, device
        )
        validation_features, validation_labels = extract_backbone_features(
            model, validation_data, args.batch_size, device
        )
        test_features, test_labels = extract_backbone_features(
            model, test_data, args.batch_size, device
        )
        sampler = WeightedRandomSampler(
            sample_weights, num_samples=len(train_data), replacement=True
        )
        train_loader = DataLoader(
            TensorDataset(train_features, train_labels),
            batch_size=args.batch_size,
            sampler=sampler,
            num_workers=0,
        )
    else:
        train_loader = DataLoader(
            train_data, batch_size=args.batch_size, shuffle=True, num_workers=0
        )

    trainable_parameters = [parameter for parameter in model.parameters() if parameter.requires_grad]
    optimizer = torch.optim.AdamW(trainable_parameters, lr=args.learning_rate)
    model.to(device)
    best_validation_accuracy = -1.0

    for epoch in range(args.epochs):
        if args.freeze_backbone:
            model.eval()
            model.classifier.train()
        else:
            model.train()
        total_loss = 0.0
        for images_or_features, labels in train_loader:
            images_or_features = images_or_features.to(device)
            labels = labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            if args.freeze_backbone:
                loss = torch.nn.functional.cross_entropy(
                    model.classifier(images_or_features), labels
                )
            else:
                loss = model(pixel_values=images_or_features, labels=labels).loss
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * labels.size(0)

        if args.freeze_backbone:
            validation_loss, validation_accuracy, _ = evaluate_classifier_head(
                model.classifier,
                validation_features,
                validation_labels,
                device,
                len(train_classes),
            )
        else:
            validation_loss, validation_accuracy, _ = evaluate(
                model, validation_loader, device, len(train_classes)
            )
        print(
            f"Epoch {epoch + 1}/{args.epochs}: "
            f"train_loss={total_loss / len(train_data):.4f}, "
            f"validation_loss={validation_loss:.4f}, "
            f"validation_accuracy={validation_accuracy:.4f}"
        )

        if validation_accuracy > best_validation_accuracy:
            best_validation_accuracy = validation_accuracy
            args.output.mkdir(parents=True, exist_ok=True)
            model.save_pretrained(args.output)
            processor.save_pretrained(args.output)
            (args.output / "class_labels.json").write_text(
                json.dumps(train_classes, indent=2), encoding="utf-8"
            )

    best_model = AutoModelForImageClassification.from_pretrained(args.output).to(device)
    if args.freeze_backbone:
        test_loss, test_accuracy, confusion = evaluate_classifier_head(
            best_model.classifier,
            test_features,
            test_labels,
            device,
            len(train_classes),
        )
    else:
        test_loss, test_accuracy, confusion = evaluate(
            best_model, test_loader, device, len(train_classes)
        )
    print(f"Test loss: {test_loss:.4f}")
    print(f"Test accuracy: {test_accuracy:.4f}")
    print("Per-class test recall:")
    for class_name, class_id in class_to_id.items():
        count = confusion[class_id].sum().item()
        recall = confusion[class_id, class_id].item() / count if count else 0.0
        print(f"  {class_name}: {recall:.4f} ({int(count)} test images)")
    print(f"Best model saved to: {args.output.resolve()}")


if __name__ == "__main__":
    main()
