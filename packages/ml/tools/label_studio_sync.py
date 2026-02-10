#!/usr/bin/env python3
"""
Label Studio 동기화 도구

기능:
1. S3에서 Label Studio로 이미지 가져오기
2. Label Studio에서 완료된 라벨 내보내기
3. YOLO 형식으로 변환하여 데이터셋 업데이트

사용법:
    # 이미지 업로드
    python label_studio_sync.py upload --images datasets/nail_v1/images/

    # 라벨 다운로드
    python label_studio_sync.py download --output datasets/nail_v1/

    # 전체 동기화
    python label_studio_sync.py sync --dataset datasets/nail_v1/
"""

import argparse
import json
import os
from pathlib import Path
from typing import Dict, List, Optional

import requests


class LabelStudioClient:
    """Label Studio API 클라이언트."""

    def __init__(
        self,
        url: str = "http://localhost:8080",
        api_key: Optional[str] = None
    ):
        self.url = url.rstrip('/')
        self.api_key = api_key or os.environ.get('LABEL_STUDIO_API_KEY')

        if not self.api_key:
            raise ValueError(
                "API 키가 필요합니다. "
                "LABEL_STUDIO_API_KEY 환경변수를 설정하거나 --api-key 옵션을 사용하세요."
            )

        self.headers = {
            'Authorization': f'Token {self.api_key}',
            'Content-Type': 'application/json'
        }

    def get_projects(self) -> List[Dict]:
        """프로젝트 목록 조회."""
        response = requests.get(
            f'{self.url}/api/projects/',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json().get('results', [])

    def get_project(self, project_id: int) -> Dict:
        """프로젝트 상세 조회."""
        response = requests.get(
            f'{self.url}/api/projects/{project_id}/',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def create_project(self, title: str, label_config: str) -> Dict:
        """프로젝트 생성."""
        data = {
            'title': title,
            'label_config': label_config
        }
        response = requests.post(
            f'{self.url}/api/projects/',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def import_tasks(
        self,
        project_id: int,
        tasks: List[Dict]
    ) -> Dict:
        """태스크(이미지) 가져오기."""
        response = requests.post(
            f'{self.url}/api/projects/{project_id}/import',
            headers=self.headers,
            json=tasks
        )
        response.raise_for_status()
        return response.json()

    def export_annotations(
        self,
        project_id: int,
        export_format: str = 'JSON'
    ) -> List[Dict]:
        """어노테이션 내보내기."""
        params = {'exportType': export_format}
        response = requests.get(
            f'{self.url}/api/projects/{project_id}/export',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_tasks(
        self,
        project_id: int,
        page_size: int = 100
    ) -> List[Dict]:
        """태스크 목록 조회."""
        tasks = []
        page = 1

        while True:
            response = requests.get(
                f'{self.url}/api/projects/{project_id}/tasks/',
                headers=self.headers,
                params={'page': page, 'page_size': page_size}
            )
            response.raise_for_status()
            data = response.json()

            tasks.extend(data.get('tasks', data))

            if 'next' not in data or not data['next']:
                break
            page += 1

        return tasks


def get_label_config() -> str:
    """손톱 라벨링용 Label Studio 설정 반환."""
    return '''
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
'''


def upload_images(
    client: LabelStudioClient,
    project_id: int,
    images_dir: str,
    base_url: str = None
):
    """이미지를 Label Studio에 업로드."""
    images_path = Path(images_dir)

    tasks = []
    for img_file in images_path.glob('*.jpg'):
        if base_url:
            # S3/CDN URL 사용
            image_url = f"{base_url}/{img_file.name}"
        else:
            # 로컬 파일 경로
            image_url = f"/data/local-files/?d={img_file.absolute()}"

        tasks.append({
            'data': {
                'image': image_url
            },
            'meta': {
                'filename': img_file.name
            }
        })

    if tasks:
        result = client.import_tasks(project_id, tasks)
        print(f"업로드됨: {len(tasks)}개 이미지")
        return result

    print("업로드할 이미지가 없습니다.")
    return None


def download_annotations(
    client: LabelStudioClient,
    project_id: int,
    output_dir: str
):
    """어노테이션 다운로드 및 YOLO 변환."""
    from prepare_dataset import convert_label_studio_to_yolo

    # JSON 내보내기
    annotations = client.export_annotations(project_id, 'JSON')

    # 임시 JSON 파일 저장
    temp_json = Path(output_dir) / 'temp_export.json'
    with open(temp_json, 'w') as f:
        json.dump(annotations, f)

    # YOLO 변환
    stats = convert_label_studio_to_yolo(str(temp_json), output_dir)

    # 임시 파일 삭제
    temp_json.unlink()

    print(f"다운로드됨: {stats['total_images']}개 이미지")
    print(f"어노테이션: {stats['total_annotations']}개")

    return stats


def sync_dataset(
    client: LabelStudioClient,
    project_id: int,
    dataset_dir: str
):
    """데이터셋 전체 동기화."""

    # 1. 새 이미지 업로드 확인
    images_dir = Path(dataset_dir) / 'images' / 'all'
    if images_dir.exists():
        existing_tasks = client.get_tasks(project_id)
        existing_names = {
            Path(t['data']['image']).stem
            for t in existing_tasks
        }

        new_images = [
            img for img in images_dir.glob('*.jpg')
            if img.stem not in existing_names
        ]

        if new_images:
            print(f"새 이미지 발견: {len(new_images)}개")
            # 업로드 로직...

    # 2. 완료된 라벨 다운로드
    stats = download_annotations(client, project_id, dataset_dir)

    return stats


def main():
    parser = argparse.ArgumentParser(description='Label Studio 동기화')

    parser.add_argument('action', choices=['upload', 'download', 'sync', 'setup'],
                        help='실행할 작업')
    parser.add_argument('--url', type=str, default='http://localhost:8080',
                        help='Label Studio URL')
    parser.add_argument('--api-key', type=str,
                        help='Label Studio API 키')
    parser.add_argument('--project-id', type=int,
                        help='프로젝트 ID')
    parser.add_argument('--project-name', type=str, default='nail-detection-v1',
                        help='새 프로젝트 이름 (setup 시)')
    parser.add_argument('--images', type=str,
                        help='이미지 디렉토리 (upload 시)')
    parser.add_argument('--output', type=str,
                        help='출력 디렉토리 (download 시)')
    parser.add_argument('--dataset', type=str,
                        help='데이터셋 디렉토리 (sync 시)')
    parser.add_argument('--base-url', type=str,
                        help='이미지 기본 URL (S3/CDN)')

    args = parser.parse_args()

    try:
        client = LabelStudioClient(args.url, args.api_key)
    except ValueError as e:
        print(f"오류: {e}")
        return

    if args.action == 'setup':
        # 프로젝트 생성
        label_config = get_label_config()
        project = client.create_project(args.project_name, label_config)
        print(f"프로젝트 생성됨: {project['id']} - {project['title']}")
        print(f"접속: {args.url}/projects/{project['id']}/")

    elif args.action == 'upload':
        if not args.project_id or not args.images:
            print("--project-id와 --images 옵션이 필요합니다.")
            return
        upload_images(client, args.project_id, args.images, args.base_url)

    elif args.action == 'download':
        if not args.project_id or not args.output:
            print("--project-id와 --output 옵션이 필요합니다.")
            return
        download_annotations(client, args.project_id, args.output)

    elif args.action == 'sync':
        if not args.project_id or not args.dataset:
            print("--project-id와 --dataset 옵션이 필요합니다.")
            return
        sync_dataset(client, args.project_id, args.dataset)


if __name__ == '__main__':
    main()
