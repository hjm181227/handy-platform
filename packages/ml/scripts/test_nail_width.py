#!/usr/bin/env python3
"""
손톱 폭 측정(measure_nail_width) 회전 불변성 테스트 — 모델 없이 cv2만으로.

기존 축 정렬 bbox 폭은 손가락이 기울면 과대측정된다. 회전 불변 폭은
기울기와 무관하게 안정적이어야 한다. 손톱 모양(타원)을 여러 각도로 회전시켜
두 방식을 비교한다.

사용법:  venv-cardtune\\Scripts\\python scripts\\test_nail_width.py
"""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent / "lambda"))
from handler import measure_nail_width  # noqa: E402


def make_nail_mask(true_width: int, true_length: int, angle_deg: float, size: int = 400):
    """중앙에 타원(손톱)을 그린 이진 마스크. 반지름 = 폭/2, 길이/2."""
    mask = np.zeros((size, size), dtype=np.uint8)
    cv2.ellipse(
        mask, (size // 2, size // 2),
        (true_width // 2, true_length // 2),  # (가로반경=폭/2, 세로반경=길이/2)
        angle_deg, 0, 360, 255, -1,
    )
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours[0]


def main() -> int:
    TRUE_WIDTH = 120   # 손톱 폭(px) — 세로 손가락 기준 가로
    TRUE_LENGTH = 90   # 손톱 길이(px) — 폭보다 작게(넓적한 손톱)도, 크게도 테스트
    print(f"실제 손톱 폭={TRUE_WIDTH}px, 길이={TRUE_LENGTH}px\n")
    print(f"{'각도':>4} | {'bbox폭':>8} {'bbox오차':>8} | {'회전불변폭':>10} {'오차':>7}")
    print("-" * 52)

    rot_errors, bbox_errors = [], []
    for angle in (0, 10, 20, 30, 40):
        contour = make_nail_mask(TRUE_WIDTH, TRUE_LENGTH, angle)
        _, _, bbox_w, _ = cv2.boundingRect(contour)
        rot_w = measure_nail_width(contour)
        bbox_err = (bbox_w - TRUE_WIDTH) / TRUE_WIDTH * 100
        rot_err = (rot_w - TRUE_WIDTH) / TRUE_WIDTH * 100
        bbox_errors.append(abs(bbox_err))
        rot_errors.append(abs(rot_err))
        print(f"{angle:>3}° | {bbox_w:>7}px {bbox_err:>+7.1f}% | {rot_w:>9.1f}px {rot_err:>+6.1f}%")

    print("-" * 52)
    print(f"평균 절대오차:  bbox={np.mean(bbox_errors):.1f}%   회전불변={np.mean(rot_errors):.1f}%")

    # 회전 불변 폭은 각도 전반에서 오차가 작아야 한다 (여기선 6% 이내 기대)
    ok = np.mean(rot_errors) < 6.0 and np.max(rot_errors) < 8.0
    print("\n결과:", "PASS (회전 불변성 확인)" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
