#!/usr/bin/env python3
"""
손톱 세그멘테이션 모델 결과 시각화 스크립트

사용법:
    # 단일 이미지 테스트
    python visualize_segmentation.py --image path/to/image.jpg

    # 폴더 내 모든 이미지 테스트
    python visualize_segmentation.py --input-dir path/to/images/ --output-dir results/

    # 모바일에서 촬영한 이미지 테스트 (정사각형 크롭 적용)
    python visualize_segmentation.py --image photo.jpg --crop-square

필요 패키지:
    pip install tensorflow opencv-python numpy pillow matplotlib
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

import numpy as np
import cv2
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# TFLite 인터프리터 import
try:
    import tensorflow as tf
except ImportError:
    print("TensorFlow가 설치되어 있지 않습니다. 'pip install tensorflow' 를 실행하세요.")
    sys.exit(1)


# 모델 설정
MODEL_INPUT_SIZE = 256
SEGMENTATION_THRESHOLD = 0.5
CREDIT_CARD_WIDTH_MM = 85.6

# 기본 모델 경로
DEFAULT_MODEL_PATH = str(Path(__file__).parent.parent.parent / "mobile" / "src" / "assets" / "models" / "nail_segmentation.tflite")


class NailSegmentationVisualizer:
    """손톱 세그멘테이션 결과 시각화 클래스"""

    def __init__(self, model_path: str):
        """
        Args:
            model_path: TFLite 모델 파일 경로
        """
        self.model_path = model_path
        self.interpreter = None
        self.input_details = None
        self.output_details = None

    def load_model(self):
        """모델 로드"""
        print(f"[Stage 1] Loading model: {self.model_path}")

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {self.model_path}")

        self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
        self.interpreter.allocate_tensors()

        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        # 모델 정보 출력
        input_shape = self.input_details[0]['shape']
        output_shape = self.output_details[0]['shape']
        input_dtype = self.input_details[0]['dtype']
        output_dtype = self.output_details[0]['dtype']

        print(f"[Stage 1] Model loaded successfully")
        print(f"[Stage 1] Input shape: {input_shape}, dtype: {input_dtype}")
        print(f"[Stage 1] Output shape: {output_shape}, dtype: {output_dtype}")
        print(f"[Stage 1] ========================================")

    def preprocess_image(self, image_path: str, crop_square: bool = True) -> tuple:
        """
        이미지 전처리

        Args:
            image_path: 이미지 파일 경로
            crop_square: 정사각형 크롭 적용 여부

        Returns:
            (input_tensor, original_image, crop_info)
        """
        print(f"[Stage 2] Preprocessing image: {image_path}")

        # 이미지 로드
        img = Image.open(image_path)
        img = img.convert('RGB')
        original_size = img.size  # (width, height)

        # EXIF 회전 적용
        try:
            from PIL import ExifTags
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = img._getexif()
            if exif is not None:
                orientation_value = exif.get(orientation)
                if orientation_value == 3:
                    img = img.rotate(180, expand=True)
                elif orientation_value == 6:
                    img = img.rotate(270, expand=True)
                elif orientation_value == 8:
                    img = img.rotate(90, expand=True)
        except (AttributeError, KeyError, IndexError):
            pass

        img_array = np.array(img)
        height, width = img_array.shape[:2]

        crop_info = {
            'original_width': width,
            'original_height': height,
            'crop_x': 0,
            'crop_y': 0,
            'crop_size': min(width, height),
        }

        # 정사각형 크롭 (중앙 기준)
        if crop_square:
            crop_size = min(width, height)
            crop_x = (width - crop_size) // 2
            crop_y = (height - crop_size) // 2
            img_array = img_array[crop_y:crop_y+crop_size, crop_x:crop_x+crop_size]

            crop_info['crop_x'] = crop_x
            crop_info['crop_y'] = crop_y
            crop_info['crop_size'] = crop_size

            print(f"[Stage 2] Cropped to square: {crop_size}x{crop_size} at ({crop_x}, {crop_y})")

        # 리사이즈 (256x256)
        img_resized = cv2.resize(img_array, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE),
                                  interpolation=cv2.INTER_LINEAR)

        # 텐서 형태로 변환
        input_dtype = self.input_details[0]['dtype']
        if input_dtype == np.float32:
            # 0-255 범위 유지 (MobileNetV3 스타일)
            input_tensor = img_resized.astype(np.float32)
        else:
            input_tensor = img_resized.astype(input_dtype)

        input_tensor = np.expand_dims(input_tensor, axis=0)  # 배치 차원 추가

        print(f"[Stage 2] Input tensor shape: {input_tensor.shape}")

        return input_tensor, img_array, crop_info

    def run_inference(self, input_tensor: np.ndarray) -> np.ndarray:
        """
        모델 추론 실행

        Args:
            input_tensor: 전처리된 입력 텐서

        Returns:
            출력 마스크 (256x256)
        """
        import time

        print(f"[Stage 2] Running inference...")
        start_time = time.time()

        self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
        self.interpreter.invoke()

        output = self.interpreter.get_tensor(self.output_details[0]['index'])

        inference_time = (time.time() - start_time) * 1000
        print(f"[Stage 2] Inference time: {inference_time:.1f}ms")

        # 마스크 추출 (배치 차원 제거)
        mask = output[0]
        if len(mask.shape) == 3:
            mask = mask[:, :, 0]  # (256, 256, 1) -> (256, 256)

        # 마스크 통계
        print(f"[Stage 2] Mask stats: min={mask.min():.3f}, max={mask.max():.3f}, "
              f"mean={mask.mean():.3f}, positive_ratio={(mask >= SEGMENTATION_THRESHOLD).mean()*100:.1f}%")
        print(f"[Stage 2] ========================================")

        return mask

    def find_connected_components(self, mask: np.ndarray) -> list:
        """
        연결된 컴포넌트 찾기 (손톱 영역)

        Args:
            mask: 이진 마스크 (256x256)

        Returns:
            영역 리스트 [{id, area, center, bbox}, ...]
        """
        # 이진화
        binary_mask = (mask >= SEGMENTATION_THRESHOLD).astype(np.uint8)

        # 연결된 컴포넌트 찾기
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask)

        regions = []
        for i in range(1, num_labels):  # 0은 배경
            area = stats[i, cv2.CC_STAT_AREA]
            if area < 100:  # 노이즈 제거
                continue

            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            w = stats[i, cv2.CC_STAT_WIDTH]
            h = stats[i, cv2.CC_STAT_HEIGHT]
            cx, cy = centroids[i]

            regions.append({
                'id': i,
                'area': area,
                'center': (cx, cy),
                'bbox': (x, y, w, h),
            })

        # 면적 기준 정렬 (큰 것부터)
        regions.sort(key=lambda r: r['area'], reverse=True)

        print(f"[Stage 3] Found {len(regions)} region(s)")
        for i, r in enumerate(regions):
            print(f"[Stage 3] Region {i}: area={r['area']}px, center=({r['center'][0]:.1f}, {r['center'][1]:.1f}), "
                  f"bbox=({r['bbox'][0]}, {r['bbox'][1]}, {r['bbox'][2]}x{r['bbox'][3]})")
        print(f"[Stage 3] ========================================")

        return regions

    def visualize_result(self, original_image: np.ndarray, mask: np.ndarray,
                         regions: list, output_path: str = None, title: str = None):
        """
        결과 시각화

        Args:
            original_image: 원본 이미지 (크롭된 정사각형)
            mask: 세그멘테이션 마스크 (256x256)
            regions: 감지된 영역 리스트
            output_path: 저장 경로 (None이면 화면에 표시)
            title: 이미지 제목
        """
        fig, axes = plt.subplots(2, 3, figsize=(15, 10))

        # 1. 원본 이미지
        ax1 = axes[0, 0]
        ax1.imshow(original_image)
        ax1.set_title('Original Image (cropped)')
        ax1.axis('off')

        # 2. 마스크 (grayscale)
        ax2 = axes[0, 1]
        im = ax2.imshow(mask, cmap='gray', vmin=0, vmax=1)
        ax2.set_title(f'Segmentation Mask (threshold={SEGMENTATION_THRESHOLD})')
        ax2.axis('off')
        plt.colorbar(im, ax=ax2, fraction=0.046)

        # 3. 이진 마스크
        ax3 = axes[0, 2]
        binary_mask = (mask >= SEGMENTATION_THRESHOLD).astype(np.uint8)
        ax3.imshow(binary_mask, cmap='gray')
        ax3.set_title(f'Binary Mask (positive: {binary_mask.mean()*100:.1f}%)')
        ax3.axis('off')

        # 4. 마스크 오버레이 (녹색 반투명)
        ax4 = axes[1, 0]
        overlay = original_image.copy()
        if overlay.shape[:2] != (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE):
            overlay = cv2.resize(overlay, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE))

        # 녹색 마스크 오버레이
        green_mask = np.zeros_like(overlay)
        green_mask[:, :, 1] = (mask * 255).astype(np.uint8)
        overlay = cv2.addWeighted(overlay, 0.7, green_mask, 0.3, 0)

        ax4.imshow(overlay)
        ax4.set_title('Mask Overlay (green)')
        ax4.axis('off')

        # 5. 바운딩 박스 표시
        ax5 = axes[1, 1]
        resized_original = cv2.resize(original_image, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE))
        ax5.imshow(resized_original)

        colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
        for i, region in enumerate(regions):
            x, y, w, h = region['bbox']
            color = colors[i % len(colors)]
            rect = patches.Rectangle((x, y), w, h, linewidth=2,
                                      edgecolor=color, facecolor='none')
            ax5.add_patch(rect)
            ax5.plot(region['center'][0], region['center'][1], 'o',
                    color=color, markersize=8)
            ax5.text(x, y-5, f"R{i}: {region['area']}px",
                    color=color, fontsize=10, fontweight='bold')

        ax5.set_title(f'Detected Regions ({len(regions)})')
        ax5.axis('off')

        # 6. 히스토그램
        ax6 = axes[1, 2]
        ax6.hist(mask.flatten(), bins=50, color='blue', alpha=0.7)
        ax6.axvline(x=SEGMENTATION_THRESHOLD, color='red', linestyle='--',
                   label=f'Threshold={SEGMENTATION_THRESHOLD}')
        ax6.set_xlabel('Mask Value')
        ax6.set_ylabel('Frequency')
        ax6.set_title('Mask Value Distribution')
        ax6.legend()

        if title:
            fig.suptitle(title, fontsize=14, fontweight='bold')

        plt.tight_layout()

        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            print(f"[Output] Saved to: {output_path}")
            plt.close()
        else:
            plt.show()

    def process_image(self, image_path: str, output_path: str = None,
                      crop_square: bool = True) -> dict:
        """
        단일 이미지 처리

        Args:
            image_path: 입력 이미지 경로
            output_path: 출력 이미지 경로 (None이면 화면에 표시)
            crop_square: 정사각형 크롭 적용 여부

        Returns:
            처리 결과 딕셔너리
        """
        # 전처리
        input_tensor, original_image, crop_info = self.preprocess_image(
            image_path, crop_square=crop_square
        )

        # 추론
        mask = self.run_inference(input_tensor)

        # 영역 감지
        regions = self.find_connected_components(mask)

        # 시각화
        title = f"File: {os.path.basename(image_path)}"
        self.visualize_result(original_image, mask, regions, output_path, title)

        return {
            'image_path': image_path,
            'mask': mask,
            'regions': regions,
            'crop_info': crop_info,
        }

    def process_directory(self, input_dir: str, output_dir: str,
                          crop_square: bool = True):
        """
        디렉토리 내 모든 이미지 처리

        Args:
            input_dir: 입력 디렉토리 경로
            output_dir: 출력 디렉토리 경로
            crop_square: 정사각형 크롭 적용 여부
        """
        # 출력 디렉토리 생성
        os.makedirs(output_dir, exist_ok=True)

        # 이미지 파일 찾기
        extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        image_files = [f for f in os.listdir(input_dir)
                       if Path(f).suffix.lower() in extensions]

        print(f"Found {len(image_files)} image(s) in {input_dir}")
        print("=" * 50)

        results = []
        for i, filename in enumerate(image_files):
            print(f"\n[{i+1}/{len(image_files)}] Processing: {filename}")
            print("-" * 50)

            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, f"result_{Path(filename).stem}.png")

            try:
                result = self.process_image(input_path, output_path, crop_square)
                results.append(result)
            except Exception as e:
                print(f"[ERROR] Failed to process {filename}: {e}")

        # 요약 리포트
        print("\n" + "=" * 50)
        print("SUMMARY")
        print("=" * 50)
        print(f"Total images: {len(image_files)}")
        print(f"Successful: {len(results)}")
        print(f"Output directory: {output_dir}")

        # 영역 감지 통계
        total_regions = sum(len(r['regions']) for r in results)
        avg_regions = total_regions / len(results) if results else 0
        print(f"Average regions per image: {avg_regions:.1f}")


def main():
    parser = argparse.ArgumentParser(
        description='손톱 세그멘테이션 모델 결과 시각화',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  # 단일 이미지 테스트 (화면에 표시)
  python visualize_segmentation.py --image test.jpg

  # 단일 이미지 테스트 (파일로 저장)
  python visualize_segmentation.py --image test.jpg --output result.png

  # 폴더 내 모든 이미지 처리
  python visualize_segmentation.py --input-dir ./test_images/ --output-dir ./results/

  # 크롭 없이 처리 (전체 이미지)
  python visualize_segmentation.py --image test.jpg --no-crop
        """
    )

    parser.add_argument('--model', type=str, default=DEFAULT_MODEL_PATH,
                        help=f'TFLite 모델 파일 경로 (기본값: {DEFAULT_MODEL_PATH})')
    parser.add_argument('--image', type=str,
                        help='단일 이미지 파일 경로')
    parser.add_argument('--input-dir', type=str,
                        help='입력 이미지 디렉토리')
    parser.add_argument('--output', type=str,
                        help='단일 이미지 출력 경로')
    parser.add_argument('--output-dir', type=str,
                        help='출력 디렉토리 (--input-dir와 함께 사용)')
    parser.add_argument('--no-crop', action='store_true',
                        help='정사각형 크롭 비활성화')

    args = parser.parse_args()

    # 입력 검증
    if not args.image and not args.input_dir:
        parser.print_help()
        print("\n[ERROR] --image 또는 --input-dir 중 하나를 지정해야 합니다.")
        sys.exit(1)

    if args.input_dir and not args.output_dir:
        # 기본 출력 디렉토리 설정
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        args.output_dir = f"./model_test_results_{timestamp}"
        print(f"[INFO] Output directory: {args.output_dir}")

    # 시각화 실행
    visualizer = NailSegmentationVisualizer(args.model)
    visualizer.load_model()

    crop_square = not args.no_crop

    if args.image:
        visualizer.process_image(args.image, args.output, crop_square=crop_square)
    elif args.input_dir:
        visualizer.process_directory(args.input_dir, args.output_dir, crop_square=crop_square)


if __name__ == '__main__':
    main()
