import json
import random
import zipfile
from collections import defaultdict
from pathlib import Path

from huggingface_hub import hf_hub_download
from PIL import Image


REPOSITORY = "mohanty/PlantVillage"
DATASET_LICENSE = (
    "PlantVillage dataset by Mohanty et al., licensed CC BY-SA 3.0. "
    "Source: https://huggingface.co/datasets/mohanty/PlantVillage "
    "Paper: https://doi.org/10.3389/fpls.2016.01419"
)
OUTPUT = Path("data/leaf_disease")
SEED = 42
VALIDATION_RATIO = 0.1
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def get_leaf_id(image_path: str, leaf_map: dict) -> str:
    parts = image_path.split("/")
    class_name, filename = parts[2], parts[3]
    image_identifier = filename.replace("_final_masked", "")
    if "___" in image_identifier:
        image_identifier = image_identifier.split("___")[-1]
    image_identifier = image_identifier.split("copy")[0]
    for suffix in IMAGE_SUFFIXES:
        image_identifier = image_identifier.replace(suffix, "")
        image_identifier = image_identifier.replace(suffix.upper(), "")
    image_identifier = image_identifier.strip()

    suggestions = leaf_map.get(image_identifier.lower().strip())
    if not suggestions:
        return f"fallback_{image_identifier}"
    if len(suggestions) == 1:
        return suggestions[0]
    return next(
        (suggestion for suggestion in suggestions if class_name in suggestion),
        f"fallback_{image_identifier}",
    )


def read_split(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def build_splits(train_paths: list[str], test_paths: list[str], leaf_map: dict):
    class_groups = defaultdict(lambda: defaultdict(list))
    test_by_class = defaultdict(list)

    for image_path in train_paths:
        if "/Tomato___" not in image_path:
            continue
        class_name = image_path.split("/")[2]
        class_groups[class_name][get_leaf_id(image_path, leaf_map)].append(image_path)

    for image_path in test_paths:
        if "/Tomato___" not in image_path:
            continue
        class_name = image_path.split("/")[2]
        test_by_class[class_name].append(image_path)

    classes = sorted(class_groups)
    if len(classes) != 10:
        raise ValueError(f"Expected all 10 PlantVillage tomato classes, found {len(classes)}: {classes}")
    if set(classes) != set(test_by_class):
        raise ValueError("Official test split does not contain the same tomato classes as train.")

    rng = random.Random(SEED)
    output_paths = {"train": [], "validation": [], "test": []}
    for class_name in classes:
        groups = list(class_groups[class_name].items())
        rng.shuffle(groups)
        target_validation_count = max(
            1, round(sum(len(paths) for _, paths in groups) * VALIDATION_RATIO)
        )
        validation_groups = set()
        selected_count = 0
        for leaf_id, paths in groups:
            if selected_count >= target_validation_count:
                break
            validation_groups.add(leaf_id)
            selected_count += len(paths)

        for leaf_id, paths in groups:
            split = "validation" if leaf_id in validation_groups else "train"
            output_paths[split].extend((class_name, path) for path in paths)
        output_paths["test"].extend((class_name, path) for path in test_by_class[class_name])

    return classes, output_paths


def main():
    if OUTPUT.exists():
        raise FileExistsError(
            f"{OUTPUT} already exists; move or rename it before preparing a fresh dataset."
        )
    archive_path = Path(
        hf_hub_download(REPOSITORY, "data.zip", repo_type="dataset")
    )
    train_file = Path(
        hf_hub_download(REPOSITORY, "splits/color_train.txt", repo_type="dataset")
    )
    test_file = Path(
        hf_hub_download(REPOSITORY, "splits/color_test.txt", repo_type="dataset")
    )
    leaf_map_file = Path(
        hf_hub_download(REPOSITORY, "leaf_grouping/leaf-map.json", repo_type="dataset")
    )

    train_paths = read_split(train_file)
    test_paths = read_split(test_file)
    leaf_map = json.loads(leaf_map_file.read_text(encoding="utf-8"))
    classes, splits = build_splits(train_paths, test_paths, leaf_map)

    for split in splits:
        for class_name in classes:
            (OUTPUT / split / class_name).mkdir(parents=True, exist_ok=True)

    required_archive_paths = {
        image_path for split_paths in splits.values() for _, image_path in split_paths
    }
    path_to_destination = {
        image_path: (split, class_name)
        for split, split_paths in splits.items()
        for class_name, image_path in split_paths
    }
    written = set()
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            member_path = member.filename.replace("\\", "/").lstrip("./")
            if member_path not in required_archive_paths:
                continue
            split, class_name = path_to_destination[member_path]
            destination = OUTPUT / split / class_name / Path(member_path).name
            with archive.open(member) as source, Image.open(source) as image:
                image.convert("RGB").save(destination, format="JPEG", quality=95)
            written.add((split, class_name, member_path))

    expected = {
        (split, class_name, image_path)
        for split, split_paths in splits.items()
        for class_name, image_path in split_paths
    }
    if written != expected:
        missing = sorted(expected - written)
        raise RuntimeError(
            f"Dataset archive did not contain all selected images; "
            f"missing {len(missing)}. First missing entries: {missing[:5]}"
        )

    counts = {
        split: sum(len(list((OUTPUT / split / class_name).glob("*"))) for class_name in classes)
        for split in splits
    }
    (OUTPUT / "DATASET_ATTRIBUTION.txt").write_text(DATASET_LICENSE + "\n", encoding="utf-8")
    print(f"Prepared all 10 tomato classes in {OUTPUT.resolve()}")
    print(f"Images by split: {counts}")
    print("Split policy: official leaf-grouped test split; 10% of training leaf groups reserved for validation.")
    print(DATASET_LICENSE)


if __name__ == "__main__":
    main()
