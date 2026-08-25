# -*- coding: utf-8 -*-
"""Google Play Console AAB 업로드 스크립트.

사용 전 1회 설정(문서: packages/mobile/IOS_RELEASE_GUIDE.md와 별개, Android 전용):
  1) Google Cloud 콘솔에서 서비스 계정 JSON 키 확보 (기본: Firebase admin 키 재사용)
  2) 해당 GCP 프로젝트에서 "Google Play Android Developer API" 사용 설정
  3) Play Console > 사용자 및 권한 > 서비스 계정 이메일 초대 + 출시 권한 부여

사용법:
  python scripts/play-upload.py --aab <경로.aab> [--track internal|alpha|beta|production]
                                [--key <서비스계정.json>] [--check] [--status]

  --check  : 업로드 없이 API 접근만 검증 (edit 생성 후 폐기)
  --status : 각 트랙의 현재 릴리즈 상태 출력
  기본 track: internal (프로덕션은 --track production 명시)

동작: edits.insert -> bundles.upload -> tracks.update(completed) -> edits.commit
"""
import argparse
import json
import os
import sys

# Windows cp949 콘솔에서도 한글·대시 출력이 깨지지 않도록
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import google.auth.transport.requests
import requests
from google.oauth2 import service_account

PACKAGE_NAME = "com.handyapp"
DEFAULT_KEY = os.path.expanduser(r"~\.handy-secrets\firebase-admin-handy-1fb15.json")
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE_NAME}"
UPLOAD_BASE = f"https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{PACKAGE_NAME}"


def get_session(key_path: str) -> requests.Session:
    creds = service_account.Credentials.from_service_account_file(key_path, scopes=[SCOPE])
    creds.refresh(google.auth.transport.requests.Request())
    s = requests.Session()
    s.headers["Authorization"] = f"Bearer {creds.token}"
    return s


def api(s: requests.Session, method: str, url: str, **kw):
    r = s.request(method, url, **kw)
    if not r.ok:
        print(f"API 오류 {r.status_code}: {r.text[:500]}", file=sys.stderr)
        sys.exit(1)
    return r.json() if r.text else {}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--aab")
    p.add_argument("--track", default="internal",
                   choices=["internal", "alpha", "beta", "production"])
    p.add_argument("--key", default=DEFAULT_KEY)
    p.add_argument("--check", action="store_true")
    p.add_argument("--status", action="store_true")
    p.add_argument("--release-name", default=None)
    args = p.parse_args()

    if not os.path.exists(args.key):
        sys.exit(f"서비스 계정 키가 없습니다: {args.key}")

    s = get_session(args.key)

    # edit은 트랜잭션 — commit 전에는 아무것도 반영되지 않는다
    edit = api(s, "POST", f"{BASE}/edits")
    edit_id = edit["id"]

    try:
        if args.check or args.status:
            tracks = api(s, "GET", f"{BASE}/edits/{edit_id}/tracks")
            print("API 접근 OK — Play Console 권한 정상")
            for t in tracks.get("tracks", []):
                for r in t.get("releases", []):
                    vcs = ",".join(str(v) for v in r.get("versionCodes", []))
                    print(f"  track={t['track']:<10} status={r.get('status'):<10} "
                          f"name={r.get('name')} versionCodes=[{vcs}]")
            return

        if not args.aab:
            sys.exit("--aab <경로> 를 지정하세요 (또는 --check / --status)")
        if not os.path.exists(args.aab):
            sys.exit(f"AAB 파일이 없습니다: {args.aab}")

        size_mb = os.path.getsize(args.aab) / 1e6
        print(f"업로드 중: {args.aab} ({size_mb:.1f}MB) → track={args.track}")
        with open(args.aab, "rb") as f:
            bundle = api(
                s, "POST",
                f"{UPLOAD_BASE}/edits/{edit_id}/bundles?uploadType=media",
                headers={"Content-Type": "application/octet-stream"},
                data=f, timeout=600,
            )
        vc = bundle["versionCode"]
        print(f"번들 업로드 완료: versionCode={vc}")

        release = {
            "name": args.release_name or str(vc),
            "status": "completed",
            "versionCodes": [str(vc)],
        }
        api(s, "PUT", f"{BASE}/edits/{edit_id}/tracks/{args.track}",
            json={"track": args.track, "releases": [release]})

        api(s, "POST", f"{BASE}/edits/{edit_id}:commit")
        print(f"커밋 완료 — {args.track} 트랙에 versionCode {vc} 출시 처리됨")
        print("(production은 Play 심사 통과 후 게시됩니다)")
    except SystemExit:
        raise
    finally:
        # check/status 또는 실패 시 edit 폐기 (commit 성공 후 delete는 404 — 무시)
        try:
            s.delete(f"{BASE}/edits/{edit_id}", timeout=30)
        except Exception:
            pass


if __name__ == "__main__":
    main()
