---
tags:
- plant-disease-detection
- image-classification
- vision-transformer
- transfer-learning
license: mit
---

# PlantVillage Disease Detection Models

Multi-phase training pipeline for plant disease detection using the PlantVillage dataset.

## Training Phases
- **Phase 1**: Multiclass classification (38 classes) - full dataset
- **Phase 2**: Balanced multiclass - class imbalance correction
- **Phase 3**: Binary classification (healthy vs diseased)

## Architectures Tested
8 architectures of ViT, total to 24 models in three phases

## Results
See individual phase directories for model weights, plots, and metrics.
