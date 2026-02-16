#!/usr/bin/env python3
"""Recolor a reference nail polish image to different colors while preserving shape and highlights."""

import numpy as np
from PIL import Image
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
REFERENCE = os.path.join(IMAGES_DIR, "generated-1770958925782.png")  # Red nail polish

# Target colors: (target_hue_degrees, saturation_mult, value_mult, name)
# HSV hue: 0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta
COLORS = {
    "red":    (0, 1.0, 1.0),
    "pink":   (340, 0.6, 1.1),
    "blue":   (220, 1.0, 0.9),
    "green":  (145, 0.9, 0.85),
    "black":  (0, 0.0, 0.25),
    "white":  (0, 0.0, 1.4),
    "brown":  (25, 0.8, 0.55),
    "yellow": (50, 0.95, 1.15),
    "neutral": (28, 0.35, 1.0),
}


def rgb_to_hsv(rgb):
    """Convert RGB array (0-255) to HSV array (H: 0-360, S: 0-1, V: 0-1)."""
    rgb_norm = rgb.astype(np.float64) / 255.0
    r, g, b = rgb_norm[..., 0], rgb_norm[..., 1], rgb_norm[..., 2]

    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    diff = maxc - minc

    # Hue
    h = np.zeros_like(maxc)
    mask = diff > 0

    rm = mask & (maxc == r)
    gm = mask & (maxc == g) & ~rm
    bm = mask & (maxc == b) & ~rm & ~gm

    h[rm] = (60.0 * ((g[rm] - b[rm]) / diff[rm])) % 360
    h[gm] = (60.0 * ((b[gm] - r[gm]) / diff[gm]) + 120.0) % 360
    h[bm] = (60.0 * ((r[bm] - g[bm]) / diff[bm]) + 240.0) % 360

    # Saturation
    s = np.where(maxc > 0, diff / maxc, 0)

    # Value
    v = maxc

    return np.stack([h, s, v], axis=-1)


def hsv_to_rgb(hsv):
    """Convert HSV array (H: 0-360, S: 0-1, V: 0-1) to RGB array (0-255)."""
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    h = h / 60.0
    i = np.floor(h).astype(int) % 6
    f = h - np.floor(h)

    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))

    rgb = np.zeros((*hsv.shape[:-1], 3), dtype=np.float64)

    for idx, (r_val, g_val, b_val) in enumerate([
        (v, t, p), (q, v, p), (p, v, t),
        (p, q, v), (t, p, v), (v, p, q)
    ]):
        mask = (i == idx)
        rgb[mask, 0] = r_val[mask]
        rgb[mask, 1] = g_val[mask]
        rgb[mask, 2] = b_val[mask]

    return np.clip(rgb * 255, 0, 255).astype(np.uint8)


def recolor_image(img_array, alpha, target_hue, sat_mult, val_mult):
    """Recolor the nail polish area while preserving shape, highlights, and background."""
    hsv = rgb_to_hsv(img_array)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    # Detect the nail polish area: has saturation > threshold and is not pure white/grey background
    nail_mask = s > 0.15

    # Also include dark areas that might be part of the nail but desaturated (shadows)
    # But exclude the white background
    is_background = (v > 0.92) & (s < 0.1)

    # Create a working mask: nail area OR (dark shadowy area near the nail)
    working_mask = nail_mask & ~is_background

    # Set new hue
    new_h = np.full_like(h, target_hue)

    # Adjust saturation and value
    new_s = np.clip(s * sat_mult, 0, 1)
    new_v = np.clip(v * val_mult, 0, 1)

    # Apply only to the nail area
    result_hsv = hsv.copy()
    result_hsv[working_mask, 0] = new_h[working_mask]
    result_hsv[working_mask, 1] = new_s[working_mask]
    result_hsv[working_mask, 2] = new_v[working_mask]

    # For semi-saturated border pixels (anti-aliasing), blend
    border_mask = (s > 0.05) & (s <= 0.15) & ~is_background
    blend_factor = (s[border_mask] - 0.05) / 0.10
    result_hsv[border_mask, 0] = target_hue
    result_hsv[border_mask, 1] = new_s[border_mask] * blend_factor
    result_hsv[border_mask, 2] = v[border_mask] * (1 - blend_factor) + new_v[border_mask] * blend_factor

    result_rgb = hsv_to_rgb(result_hsv)

    # Combine with alpha
    result = np.dstack([result_rgb, alpha])
    return result


def main():
    img = Image.open(REFERENCE).convert("RGBA")
    img_array = np.array(img)
    rgb = img_array[..., :3]
    alpha = img_array[..., 3]

    os.makedirs(IMAGES_DIR, exist_ok=True)

    for name, (hue, sat_m, val_m) in COLORS.items():
        print(f"Generating {name} (hue={hue}, sat={sat_m}, val={val_m})...")
        result = recolor_image(rgb, alpha, hue, sat_m, val_m)
        result_img = Image.fromarray(result, "RGBA")
        output_path = os.path.join(IMAGES_DIR, f"color-{name}.png")
        result_img.save(output_path, "PNG")
        print(f"  Saved: {output_path}")

    print("\nDone! All color variants generated.")


if __name__ == "__main__":
    main()
