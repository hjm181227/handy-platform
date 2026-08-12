#!/usr/bin/env python3
"""
카드 검출(detect_card) 단위 테스트 — 모델 없이 OpenCV만으로 실행.

목적: handler.py의 detect_card 기하 로직이 맞는지, 모델·Lambda 배포 없이
합성 이미지로 먼저 검증한다.

사용법:
    # 합성 이미지 자동 테스트
    python scripts/test_card_detection.py

    # 실제 촬영 이미지로 테스트 (검출 결과와 오버레이 저장)
    python scripts/test_card_detection.py --image path/to/photo.jpg

의존성: numpy, opencv-python  (Lambda requirements와 동일)
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

# handler.py의 detect_card / center_crop_and_resize 재사용
sys.path.insert(0, str(Path(__file__).parent.parent / "lambda"))
from handler import detect_card, center_crop_and_resize, INPUT_SIZE, CARD_ASPECT_RATIO  # noqa: E402


def make_synthetic(card_long_px: int, angle_deg: float = 0.0,
                   perspective: float = 0.0, size: int = INPUT_SIZE) -> np.ndarray:
    """중앙에 카드 종횡비(1.586) 사각형을 그린 합성 RGB 이미지."""
    img = np.full((size, size, 3), 200, dtype=np.uint8)  # 밝은 배경
    # 약간의 배경 텍스처 (엣지 검출이 배경에 낚이지 않는지 확인)
    cv2.circle(img, (80, 80), 40, (170, 175, 180), -1)

    long_side = card_long_px
    short_side = card_long_px / CARD_ASPECT_RATIO
    cx, cy = size / 2, size / 2
    hw, hh = long_side / 2, short_side / 2
    corners = np.array([
        [cx - hw, cy - hh], [cx + hw, cy - hh],
        [cx + hw, cy + hh], [cx - hw, cy + hh],
    ], dtype=np.float32)

    # 회전
    if angle_deg:
        M = cv2.getRotationMatrix2D((cx, cy), angle_deg, 1.0)
        corners = cv2.transform(corners[None, :, :], M)[0]

    # 원근 왜곡 (윗변을 좁힘)
    if perspective:
        shift = long_side * perspective
        corners[0][0] += shift
        corners[1][0] -= shift

    cv2.fillConvexPoly(img, corners.astype(np.int32), (60, 60, 70))  # 어두운 카드
    return img, long_side


def run_synthetic_suite() -> int:
    cases = [
        ("정면 큰 카드", 360, 0.0, 0.0),
        ("정면 작은 카드", 240, 0.0, 0.0),
        ("15도 회전", 320, 15.0, 0.0),
        ("-10도 회전", 300, -10.0, 0.0),
        ("약한 원근", 340, 5.0, 0.08),
    ]
    failures = 0
    for name, long_px, angle, persp in cases:
        img, true_long = make_synthetic(long_px, angle, persp)
        # 가이드 추정치는 실제와 12% 어긋난 값으로 준다 (검출이 이를 교정해야 함)
        guide = true_long * 1.12
        result = detect_card(img, guide, INPUT_SIZE)
        if result is None:
            print(f"  [FAIL] {name}: 검출 실패")
            failures += 1
            continue
        err = abs(result["long_side"] - true_long) / true_long * 100
        status = "OK" if err < 6.0 else "FAIL"
        if status == "FAIL":
            failures += 1
        print(f"  [{status}] {name}: 검출={result['long_side']:.1f}px "
              f"실제={true_long:.1f}px 오차={err:.1f}% "
              f"(가이드추정={guide:.1f}px, 종횡비오차={result['aspect_error']:.3f})")
    print(f"\n합성 테스트: {len(cases) - failures}/{len(cases)} 통과")
    return failures


def run_on_image(path: str) -> int:
    img = cv2.imread(path)
    if img is None:
        print(f"이미지를 열 수 없습니다: {path}")
        return 1
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    cropped = center_crop_and_resize(img_rgb, INPUT_SIZE)
    # 가이드 추정치 없이(0) 순수 검출 + 퍼널 진단 출력
    result = detect_card(cropped, 0, INPUT_SIZE, debug=True)
    if result is None:
        print("카드 미검출. 위 funnel에서 어느 관문(area/shape/gate)에서 막혔는지 확인.")
        return 1
    print(f"검출 성공: long={result['long_side']:.1f}px short={result['short_side']:.1f}px "
          f"aspect={result['aspect_ratio']:.3f} (기준 1.586, 오차 {result['aspect_error']:.3f})")
    mm_per_px = 85.6 / result["long_side"]
    print(f"→ 스케일: {mm_per_px:.4f} mm/px (이 값 × 손톱 픽셀폭 = 손톱 mm)")

    # 시각화 저장
    vis = cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR)
    corners = np.array(result["corners"], dtype=np.int32)
    cv2.polylines(vis, [corners], True, (0, 255, 0), 3)
    out = Path(path).with_suffix(".card_detected.png")
    cv2.imwrite(str(out), vis)
    print(f"오버레이 저장: {out}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", help="실제 촬영 이미지 경로 (생략 시 합성 테스트)")
    args = ap.parse_args()
    sys.exit(run_on_image(args.image) if args.image else (1 if run_synthetic_suite() else 0))
