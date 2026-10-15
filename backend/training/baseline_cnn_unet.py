"""
EcoPlate AI: Baseline CNN (U-Net) Architecture and Loss Functions
================================================================
Implements the deep convolutional baseline semantic segmentation network:
- U-Net Encoder-Decoder architecture with skip connections.
- 4-level convolutional feature hierarchy with Conv2D, BatchNorm, and ReLU.
- Spatial bottleneck with dense contextual receptive field.
- Decoder with ConvTranspose2d upsampling and multi-scale skip concatenations.
- Joint Multi-Class Cross-Entropy and Soft Dice Loss.
- Comprehensive metric calculation (mIoU, Dice, Precision, Recall).

Classes (9 total):
  0: background (plate basin, table)
  1: rice
  2: dal_sambar
  3: fryums
  4: curry
  5: poori
  6: curd
  7: chutney_pickle
  8: other_food
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, List, Optional


class DoubleConv(nn.Module):
    """(Conv2D -> BatchNorm -> ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int, mid_channels: Optional[int] = None):
        super().__init__()
        if not mid_channels:
            mid_channels = out_channels
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.double_conv(x)


class DownBlock(nn.Module):
    """Downscaling with MaxPool2D then DoubleConv"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.maxpool_conv(x)


class UpBlock(nn.Module):
    """Upscaling with ConvTranspose2D then DoubleConv with skip connection"""
    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = False):
        super().__init__()
        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        # Input is CHW; handle padding if dimensions differ by 1 due to odd sizes
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]

        x1 = F.pad(x1, [diff_x // 2, diff_x - diff_x // 2,
                        diff_y // 2, diff_y - diff_y // 2])
        # Concatenate skip connection along channel dimension
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class BaselineUNet(nn.Module):
    """
    Standard U-Net Baseline Architecture for Semantic Segmentation.
    Encoder: 3 -> 64 -> 128 -> 256 -> 512
    Bottleneck: 1024
    Decoder: 512 -> 256 -> 128 -> 64
    Output: num_classes channels (default 9)
    """
    def __init__(self, in_channels: int = 3, num_classes: int = 9, bilinear: bool = False):
        super().__init__()
        self.in_channels = in_channels
        self.num_classes = num_classes
        self.bilinear = bilinear

        # Encoder
        self.inc = DoubleConv(in_channels, 64)
        self.down1 = DownBlock(64, 128)
        self.down2 = DownBlock(128, 256)
        self.down3 = DownBlock(256, 512)
        factor = 2 if bilinear else 1
        self.down4 = DownBlock(512, 1024 // factor)

        # Decoder with skip connections
        self.up1 = UpBlock(1024, 512 // factor, bilinear)
        self.up2 = UpBlock(512, 256 // factor, bilinear)
        self.up3 = UpBlock(256, 128 // factor, bilinear)
        self.up4 = UpBlock(128, 64, bilinear)

        # Final 1x1 conv to map features to class logits
        self.outc = nn.Conv2d(64, num_classes, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Encoder forward pass with feature extraction
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        # Decoder forward pass with skip connections
        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)

        logits = self.outc(x)
        return logits


class SoftDiceLoss(nn.Module):
    """
    Multi-Class Soft Dice Loss with Laplace smoothing.
    Dice = 2 * |P * G| / (|P|^2 + |G|^2 + eps)
    """
    def __init__(self, smooth: float = 1.0, ignore_background: bool = False):
        super().__init__()
        self.smooth = smooth
        self.ignore_background = ignore_background

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        num_classes = logits.shape[1]
        probs = F.softmax(logits, dim=1)

        # One-hot encode targets: (B, H, W) -> (B, num_classes, H, W)
        targets_one_hot = F.one_hot(targets.clamp(0, num_classes - 1), num_classes)
        targets_one_hot = targets_one_hot.permute(0, 3, 1, 2).float()

        start_cls = 1 if self.ignore_background else 0
        total_dice_loss = 0.0
        active_classes = 0

        for c in range(start_cls, num_classes):
            p_c = probs[:, c, :, :].contiguous().view(-1)
            t_c = targets_one_hot[:, c, :, :].contiguous().view(-1)

            intersection = (p_c * t_c).sum()
            cardinality = (p_c * p_c).sum() + (t_c * t_c).sum()

            dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
            total_dice_loss += (1.0 - dice)
            active_classes += 1

        return total_dice_loss / max(active_classes, 1)


class CombinedCELossAndDice(nn.Module):
    """
    Joint loss function for Baseline CNN semantic segmentation:
    L_total = L_CE + lambda_dice * L_Dice
    """
    def __init__(self, lambda_dice: float = 1.0, class_weights: Optional[torch.Tensor] = None):
        super().__init__()
        self.lambda_dice = lambda_dice
        self.ce_loss = nn.CrossEntropyLoss(weight=class_weights)
        self.dice_loss = SoftDiceLoss(smooth=1.0, ignore_background=False)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        loss_ce = self.ce_loss(logits, targets)
        loss_dice = self.dice_loss(logits, targets)
        total_loss = loss_ce + self.lambda_dice * loss_dice
        return total_loss, loss_ce, loss_dice


def compute_segmentation_metrics(preds: torch.Tensor, targets: torch.Tensor, num_classes: int = 9) -> Dict[str, float]:
    """
    Computes standard semantic segmentation benchmarks:
    - Overall Pixel Accuracy
    - Precision & Recall
    - Class-wise and Mean Intersection-over-Union (mIoU)
    - Mean Dice / F1 Score
    """
    preds_np = preds.detach().cpu().numpy().flatten()
    targets_np = targets.detach().cpu().numpy().flatten()

    ious = []
    dices = []
    precisions = []
    recalls = []

    for c in range(num_classes):
        pred_c = (preds_np == c)
        true_c = (targets_np == c)

        intersection = (pred_c & true_c).sum()
        union = (pred_c | true_c).sum()
        pred_sum = pred_c.sum()
        true_sum = true_c.sum()

        if union > 0:
            iou = intersection / union
            ious.append(iou)

        if (pred_sum + true_sum) > 0:
            dice = 2.0 * intersection / (pred_sum + true_sum)
            dices.append(dice)

        if pred_sum > 0:
            prec = intersection / pred_sum
            precisions.append(prec)

        if true_sum > 0:
            rec = intersection / true_sum
            recalls.append(rec)

    mean_iou = float(sum(ious) / max(len(ious), 1))
    mean_dice = float(sum(dices) / max(len(dices), 1))
    mean_precision = float(sum(precisions) / max(len(precisions), 1))
    mean_recall = float(sum(recalls) / max(len(recalls), 1))
    pixel_acc = float((preds_np == targets_np).mean())

    return {
        "pixel_accuracy": pixel_acc,
        "mean_iou": mean_iou,
        "mean_dice": mean_dice,
        "mean_precision": mean_precision,
        "mean_recall": mean_recall
    }


if __name__ == "__main__":
    print("Testing BaselineUNet tensor shapes and loss computation...")
    model = BaselineUNet(in_channels=3, num_classes=9)
    dummy_input = torch.randn(2, 3, 512, 512)
    dummy_targets = torch.randint(0, 9, (2, 512, 512), dtype=torch.long)

    logits = model(dummy_input)
    print(f"Input shape:  {dummy_input.shape}")
    print(f"Output shape: {logits.shape} (Expected: [2, 9, 512, 512])")

    criterion = CombinedCELossAndDice(lambda_dice=1.0)
    total_loss, ce, dice = criterion(logits, dummy_targets)
    print(f"Total Loss:   {total_loss.item():.4f} (CE: {ce.item():.4f}, Dice: {dice.item():.4f})")

    preds = torch.argmax(logits, dim=1)
    metrics = compute_segmentation_metrics(preds, dummy_targets, num_classes=9)
    print(f"Metrics:      {metrics}")
    print("BaselineUNet test passed successfully!")
