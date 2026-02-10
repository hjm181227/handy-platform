# Label Studio 설정 가이드

## 개요

Label Studio는 오픈소스 데이터 라벨링 도구입니다. 손톱 감지 데이터셋 라벨링에 사용합니다.

## 설치 방법

### 방법 1: Docker (권장)

```bash
# Docker 실행
docker run -it -p 8080:8080 \
  -v $(pwd)/label-studio-data:/label-studio/data \
  heartexlabs/label-studio:latest

# 접속: http://localhost:8080
```

### 방법 2: pip 설치

```bash
# 가상환경 생성 (Label Studio 전용)
python -m venv label-studio-env
source label-studio-env/bin/activate

# 설치
pip install label-studio

# 실행
label-studio start --port 8080
```

### 방법 3: Docker Compose (영구 설정)

```yaml
# docker-compose.yml
version: '3.8'
services:
  label-studio:
    image: heartexlabs/label-studio:latest
    ports:
      - "8080:8080"
    volumes:
      - ./label-studio-data:/label-studio/data
      - ./datasets:/label-studio/datasets
    environment:
      - LABEL_STUDIO_LOCAL_FILES_SERVING_ENABLED=true
      - LABEL_STUDIO_LOCAL_FILES_DOCUMENT_ROOT=/label-studio/datasets
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## 초기 설정

### 1. 계정 생성

1. `http://localhost:8080` 접속
2. 이메일/비밀번호로 계정 생성
3. 로그인

### 2. 프로젝트 생성

1. **Create Project** 클릭
2. 프로젝트 이름: `nail-detection-v1`
3. 설명: `손톱 감지 데이터셋 v1`

### 3. 라벨링 인터페이스 설정

**Labeling Setup** → **Custom template** 선택 후 아래 XML 입력:

```xml
<View>
  <Header value="손톱 라벨링 - 바운딩 박스를 정확히 그려주세요"/>

  <Image name="image" value="$image" zoom="true" zoomControl="true"/>

  <RectangleLabels name="label" toName="image" strokeWidth="2">
    <Label value="credit_card" background="#3498db" hotkey="1"/>
    <Label value="nail_thumb" background="#e74c3c" hotkey="2"/>
    <Label value="nail_index" background="#2ecc71" hotkey="3"/>
    <Label value="nail_middle" background="#f1c40f" hotkey="4"/>
    <Label value="nail_ring" background="#9b59b6" hotkey="5"/>
    <Label value="nail_little" background="#e67e22" hotkey="6"/>
  </RectangleLabels>

  <Choices name="hand" toName="image" choice="single" showInLine="true">
    <Header value="촬영된 손"/>
    <Choice value="left" hotkey="l"/>
    <Choice value="right" hotkey="r"/>
  </Choices>

  <Choices name="scenario" toName="image" choice="single" showInLine="true">
    <Header value="촬영 시나리오"/>
    <Choice value="thumb_only" hotkey="t"/>
    <Choice value="four_fingers" hotkey="f"/>
  </Choices>
</View>
```

### 4. 단축키 요약

| 키 | 기능 |
|----|------|
| 1 | credit_card 선택 |
| 2 | nail_thumb 선택 |
| 3 | nail_index 선택 |
| 4 | nail_middle 선택 |
| 5 | nail_ring 선택 |
| 6 | nail_little 선택 |
| l | 왼손 |
| r | 오른손 |
| t | 엄지 촬영 |
| f | 4손가락 촬영 |
| Ctrl+Enter | 제출 |
| u | 실행 취소 |

---

## 데이터 가져오기

### 방법 1: 로컬 파일

1. **Settings** → **Cloud Storage** → **Add Source Storage**
2. **Storage Type**: `Local files`
3. **Path**: `/label-studio/datasets/nail_v1/images`
4. **Sync Storage** 클릭

### 방법 2: S3에서 가져오기

1. **Settings** → **Cloud Storage** → **Add Source Storage**
2. **Storage Type**: `Amazon S3`
3. 설정:
   ```
   Bucket: handy-platform-ml
   Prefix: datasets/nail_v1/images/
   Region: ap-northeast-2
   Access Key ID: (입력)
   Secret Access Key: (입력)
   ```
4. **Check Connection** → **Add Storage**

### 방법 3: 직접 업로드

1. **Import** 버튼 클릭
2. 이미지 파일 드래그 앤 드롭
3. 또는 폴더 선택

---

## 라벨링 진행

### 워크플로우

```
1. 작업 할당 (Tasks → 이미지 선택)
      ↓
2. 바운딩 박스 그리기
   - 신용카드 (1) → 손톱들 (2-6)
      ↓
3. 메타데이터 선택
   - 왼손/오른손
   - 엄지/4손가락
      ↓
4. Submit (Ctrl+Enter)
      ↓
5. 다음 이미지
```

### 라벨링 팁

1. **줌 사용**: 마우스 휠로 확대하여 정밀 라벨링
2. **박스 수정**: 박스 클릭 후 모서리 드래그
3. **삭제**: 박스 선택 후 Delete 또는 Backspace
4. **복사**: Ctrl+C / Ctrl+V (비슷한 위치에 여러 박스)

---

## 내보내기

### YOLO 형식으로 내보내기

1. **Export** 버튼 클릭
2. **Format**: `YOLO` 선택
3. 다운로드

### 내보내기 후 파일 구조

```
export/
├── images/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── ...
├── labels/
│   ├── image001.txt
│   ├── image002.txt
│   └── ...
├── classes.txt
└── notes.json
```

### 자동 내보내기 스크립트

```python
#!/usr/bin/env python3
"""
Label Studio에서 YOLO 형식으로 내보내기
"""

import os
import json
import requests
from pathlib import Path


LABEL_STUDIO_URL = "http://localhost:8080"
API_TOKEN = "your-api-token"  # Settings > Account에서 확인
PROJECT_ID = 1


def export_yolo(output_dir: str):
    headers = {"Authorization": f"Token {API_TOKEN}"}

    # 프로젝트 내보내기
    export_url = f"{LABEL_STUDIO_URL}/api/projects/{PROJECT_ID}/export"
    params = {"exportType": "YOLO"}

    response = requests.get(export_url, headers=headers, params=params)

    if response.status_code == 200:
        # ZIP 파일 저장
        output_path = Path(output_dir) / "export.zip"
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"Exported to {output_path}")
    else:
        print(f"Export failed: {response.status_code}")


if __name__ == "__main__":
    export_yolo("./exports")
```

---

## 품질 관리

### 리뷰 워크플로우 설정

1. **Settings** → **Quality**
2. **Enable Review** 활성화
3. **Overlap**: 10% (동일 이미지 중복 라벨링)

### 일치율 확인

```
Dashboard → Agreement score 확인
- 80% 이상: 양호
- 60-80%: 가이드라인 재교육 필요
- 60% 미만: 가이드라인 재검토
```

---

## 팀 협업 설정

### 사용자 추가

1. **Organization** → **Members** → **Invite**
2. 이메일로 초대
3. 역할 지정:
   - **Annotator**: 라벨링만
   - **Reviewer**: 라벨링 + 검수
   - **Manager**: 프로젝트 관리

### 작업 할당

1. **Data Manager** → 이미지 선택
2. **Assign** → 사용자 선택
3. 또는 자동 할당 설정

---

## 트러블슈팅

### 이미지가 안 보일 때

```bash
# Docker 환경변수 확인
LABEL_STUDIO_LOCAL_FILES_SERVING_ENABLED=true
LABEL_STUDIO_LOCAL_FILES_DOCUMENT_ROOT=/label-studio/datasets
```

### 느린 로딩

```bash
# PostgreSQL 사용 (대용량 데이터셋)
docker run -it -p 8080:8080 \
  -e DJANGO_DB=default \
  -e POSTGRE_HOST=your-postgres-host \
  -e POSTGRE_PORT=5432 \
  -e POSTGRE_NAME=labelstudio \
  -e POSTGRE_USER=user \
  -e POSTGRE_PASSWORD=password \
  heartexlabs/label-studio:latest
```

### 내보내기 오류

- 모든 라벨이 Submit 되었는지 확인
- 빈 라벨 있는지 확인 (Filter → Empty)
