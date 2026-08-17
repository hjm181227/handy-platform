# 카드 검출 튜닝 — 직접 반복하는 법

모델(ONNX)·Lambda 없이, **cv2만으로** 카드 검출(`detect_card`)을 로컬에서 반복
튜닝하는 워크플로. 실제 촬영 사진에 대해 몇 초 만에 결과를 본다.

## 1. 환경 (최초 1회, 이미 구축됨)

Windows에 Python 3.11 + `packages/ml/venv-cardtune`(cv2 4.9, numpy 1.26) 설치 완료.
새로 만들 일이 생기면:

```powershell
# packages/ml 에서
py -3.11 -m venv venv-cardtune        # 또는 python 3.11 경로
venv-cardtune\Scripts\python -m pip install numpy==1.26.4 opencv-python==4.9.0.80
```

## 2. 합성 자가진단 (로직이 도는지)

```powershell
venv-cardtune\Scripts\python scripts\test_card_detection.py
```
5개 합성 케이스가 오차 6% 미만으로 통과하면 로직 정상.

## 3. 실제 사진 가져오기

**방법 A — 기기에서 (앱으로 촬영 후):**
앱에서 손톱 측정 촬영을 한 뒤:
```bash
bash scripts/pull_device_captures.sh    # test_images/ 로 복사됨
```

**방법 B — 파일 직접:** 사진을 `packages/ml/test_images/`에 넣는다.

## 4. 실제 사진으로 검출 + 퍼널 진단

```powershell
venv-cardtune\Scripts\python scripts\test_card_detection.py --image test_images\사진.jpg
```
출력의 `[detect_card] funnel {...}`가 어느 관문에서 막혔는지 알려준다:

| funnel 값 | 의미 | 조정 지점 (lambda/handler.py) |
|---|---|---|
| `area_pass=0` | 카드 외곽이 큰 컨투어를 못 이룸(저대비/끊긴 엣지) | `_build_edge_maps`에 엣지 소스 추가, close 커널/iterations ↑, `CARD_MIN_AREA_RATIO` ↓ |
| `shape_pass=0` (area>0) | 컨투어는 크지만 사각형이 안 됨 | minAreaRect 경로 확인, approxPolyDP epsilon 조정 |
| `gate_pass=0` (shape>0) | 사각형인데 종횡비/가이드 게이트에 걸림 | `CARD_ASPECT_ERROR_GATE`(현재 0.12), 가이드 ±45% |
| `HIT` | 검출 성공 | long_side px로 스케일(85.6/long_side mm/px) 계산됨 |

검출 성공 시 `test_images\사진.card_detected.png`에 초록 사각형 오버레이가 저장된다.

## 5. 파라미터를 바꿔가며 반복

`lambda/handler.py`의 `detect_card` / `_build_edge_maps` / 게이트 상수를 고치고
4번을 다시 실행. Lambda 배포·모델 로드가 전혀 없으므로 즉시 결과가 나온다.
여러 사진에서 검출률이 오르면 그때 Lambda 재배포(deploy_lambda.sh)로 반영한다.

## ⚠️ 구조적 한계 (알고 시작하기)

촬영 자세가 **손을 카드 위에 올림**이면, 카드의 상당 부분이 손에 가려져
4모서리(또는 회전 사각형) 검출이 **원리적으로 어렵다**. 이 워크플로로
개선할 수 있는 건 주로 "카드가 온전히 보이는데 저대비로 실패"하는 경우다.
손 가림 자세에서 정확도를 근본적으로 올리려면 **카드를 세그멘테이션 클래스로
학습**(재라벨+재학습)하는 편이 맞다. 퍼널 진단으로 실제 촬영본의 검출률을
먼저 재보고, CV로 어디까지 가는지 확인한 뒤 판단하면 된다.
