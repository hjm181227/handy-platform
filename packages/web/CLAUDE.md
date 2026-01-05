# Web Package - CLAUDE.md

> **전체 프로젝트 가이드**: 루트 [CLAUDE.md](../../CLAUDE.md) 참조
> **공통 API 서비스**: [packages/shared/CLAUDE.md](../shared/CLAUDE.md) 참조

React 웹 앱 (Vite) 및 Vercel 배포 관련 가이드입니다.

## 웹 버전 실행

```bash
# 개발 환경 (로컬 서버 연동) - http://localhost:3001
npm run web:dev

# 스테이지 환경 (개발 서버 연동, 스테이지 DB) - http://localhost:3001
npm run web:stage

# 프로덕션 환경 (실제 서버 연동) - http://localhost:3001
npm run web:prod

# 기본 실행 (개발 환경과 동일)
npm run web
```

## 빌드 & 정리

```bash
# 웹 빌드
npm run web:build        # 기본 빌드
npm run web:build:dev    # 개발 환경용 빌드
npm run web:build:stage  # 스테이지 환경용 빌드
npm run web:build:prod   # 프로덕션 환경용 빌드

# 프로젝트 클린업
npm run clean
```

---

## Vercel Edge Config - 동적 API 라우팅

### 개요
Vercel Edge Config를 사용하여 **재배포 없이** API 엔드포인트를 동적으로 전환할 수 있습니다. 이는 서버 배포 시 Blue-Green 배포나 카나리 배포를 위한 트래픽 전환에 유용합니다.

### 아키텍처
- `packages/web/middleware.ts`: Edge Middleware가 `/api/*` 요청을 Edge Config에 설정된 백엔드로 프록시
- `packages/web/vercel.json`: 기존 하드코딩된 API rewrite 제거 (middleware로 이관)
- Vercel Dashboard: Edge Config 값 변경으로 즉시 트래픽 전환

### Edge Config 설정 방법

#### 1. Edge Config 생성 (Vercel Dashboard)
1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택: `web`
3. **Storage** 탭 → **Edge Config** → **Create Edge Config**
4. Edge Config 이름: `handy-api-config` (예시)
5. 생성 완료

#### 2. Edge Config 초기 데이터 입력

**스테이징 환경 (현재 설정):**
```json
{
  "api_target": "http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080",
  "environment": "staging",
  "updated_at": "2025-01-15T12:00:00Z",
  "updated_by": "manual"
}
```

**프로덕션 환경 (향후 전환 시):**
```json
{
  "api_target": "http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:80",
  "environment": "production",
  "updated_at": "2025-01-15T12:00:00Z",
  "updated_by": "ci"
}
```

**주요 필드 설명:**
- `api_target`: 백엔드 서버 베이스 URL (포트 포함)
  - 스테이징: `:8080`
  - 프로덕션: `:80`
- `environment`: 환경 식별자 (`staging` / `production`)
- `updated_at`: 마지막 업데이트 시각 (ISO 8601 형식)
- `updated_by`: 업데이트 주체 (`manual` / `ci` / `rollback`)

#### 3. 프로젝트에 Edge Config 연결
1. Vercel Dashboard → 프로젝트 `web` → **Settings** → **Environment Variables**
2. 환경변수 추가:
   - **Key**: `EDGE_CONFIG`
   - **Value**: Edge Config connection string (자동 생성됨)
   - **Environments**: Production, Preview, Development 모두 선택
3. 저장

#### 4. 배포 및 검증
```bash
# 코드 배포
cd packages/web
npm run deploy:prod  # 또는 deploy:stage

# 배포 후 검증
curl https://stage-handy.com/api/health
# 정상 응답: {"status":"ok", ...}
```

**검증 체크리스트:**
- [ ] `/api/health` 엔드포인트 정상 응답
- [ ] 브라우저 Network 탭에서 실제 백엔드 URL 확인
- [ ] Vercel Functions 로그에서 Middleware 로그 확인
- [ ] Edge Config 값 변경 시 즉시 반영 확인

### 트래픽 전환 절차

#### Blue-Green 배포 시나리오
1. **Blue 환경 (기존)**: `:8080` 포트
2. **Green 환경 (신규)**: `:80` 포트 (또는 다른 서버)
3. **전환**: Vercel Dashboard에서 `api_target` 값만 변경
4. **롤백**: 이전 값으로 즉시 되돌림

**전환 방법:**
1. Vercel Dashboard → Storage → Edge Config → `handy-api-config`
2. `api_target` 값 수정:
   ```json
   {
     "api_target": "http://new-backend-server.com:80",
     "environment": "production",
     "updated_at": "2025-01-15T14:30:00Z",
     "updated_by": "manual"
   }
   ```
3. **Save** 클릭 → 즉시 반영 (재배포 불필요)
4. 검증: `curl https://stage-handy.com/api/health`

**롤백 방법:**
1. Edge Config → `api_target` 값을 이전 서버로 되돌림
2. 즉시 반영 (수초 내)

### 로컬 개발 환경

로컬 개발 시에는 Edge Config 없이도 정상 작동합니다:
- `middleware.ts`가 `NODE_ENV=development` 체크
- 자동으로 `localhost:11000`로 프록시
- Edge Config 설정 불필요

```bash
# 로컬 개발
npm run web:dev
# → middleware가 자동으로 localhost:11000 사용
```

### Fallback 전략

Edge Config 장애 시에도 서비스가 중단되지 않도록 Fallback이 구현되어 있습니다:

```typescript
// packages/web/middleware.ts
async function getApiTarget(): Promise<string> {
  try {
    const apiTarget = await get<string>('api_target');
    return apiTarget || FALLBACK_URL;
  } catch (error) {
    console.error('[Edge Config] Failed, using fallback');
    return FALLBACK_URL; // 기본값으로 폴백
  }
}
```

**Fallback URL**: `http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080`

### 보안 고려사항

1. **Edge Config Connection String 보호**
   - `.env.local`은 절대 Git에 커밋 금지 (`.gitignore`에 포함됨)
   - 환경변수로만 관리
   - 코드에 하드코딩 금지

2. **CORS 설정**
   - 백엔드 서버에 이미 Vercel CORS 설정되어 있음 (`*.vercel.app`)
   - 추가 설정 불필요

3. **API 접근 제어**
   - Edge Config는 Vercel 프로젝트에만 접근 가능
   - 외부에서 직접 수정 불가

### 백엔드 팀 전달사항

배포 자동화를 위해 백엔드 CI/CD에서 Edge Config를 업데이트할 수 있습니다:

**필요 정보:**
1. **Edge Config ID**: Vercel Dashboard에서 확인
2. **Vercel API Token**: [Vercel Settings → Tokens](https://vercel.com/account/tokens)에서 생성

**CI/CD에서 Edge Config 업데이트:**
```bash
# Vercel CLI 사용
npm install -g vercel
vercel env pull  # EDGE_CONFIG 가져오기

# API로 직접 업데이트 (예시)
curl -X PATCH "https://api.vercel.com/v1/edge-config/<config-id>/items" \
  -H "Authorization: Bearer <vercel-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "operation": "update",
        "key": "api_target",
        "value": "http://new-backend.com:80"
      },
      {
        "operation": "update",
        "key": "updated_at",
        "value": "2025-01-15T15:00:00Z"
      },
      {
        "operation": "update",
        "key": "updated_by",
        "value": "ci"
      }
    ]
  }'
```

### 문제 해결

**증상: `/api` 요청이 실패함**
- Edge Config 값 확인
- Fallback이 작동하는지 로그 확인
- Vercel Functions 로그에서 middleware 에러 확인

**증상: 변경사항이 반영되지 않음**
- Edge Config 저장 후 5-10초 대기 (캐시 무효화)
- 브라우저 캐시 클리어 후 재시도
- Vercel 배포 로그 확인

**증상: 로컬 개발에서 API 호출 실패**
- `NODE_ENV=development` 설정 확인
- 백엔드 로컬 서버 (`localhost:11000`) 실행 여부 확인

### 참고 자료
- [Vercel Edge Config 공식 문서](https://vercel.com/docs/storage/edge-config)
- [Vercel Middleware 가이드](https://vercel.com/docs/functions/edge-middleware)
- [Edge Config API Reference](https://vercel.com/docs/storage/edge-config/vercel-api)

---

## 프로덕션 배포 가이드

### 배포 전략 개요

**현재 구성**: 단일 Vercel 프로젝트 + 브랜치 전략
- **프로덕션 환경**: `main` 브랜치 → https://h-andy.com
- **스테이징 환경**: `develop` 브랜치 (또는 현재 작업 브랜치) → https://stage-handy.com
- **Preview 환경**: 기타 브랜치/PR → Vercel 자동 생성 URL

**주요 특징**:
- 환경변수 기반 API 라우팅 (Edge Config 미사용)
- 브랜치별 자동 배포
- 비용 효율적 (Free tier 사용 가능)

---

### 1단계: Git 브랜치 전략 설정

#### develop 브랜치 생성 (스테이징용)

```bash
# main 브랜치로 이동
git checkout main

# 최신 코드 가져오기
git pull origin main

# develop 브랜치 생성 및 푸시
git checkout -b develop
git push -u origin develop
```

**브랜치 용도**:
- `main`: 프로덕션 배포용 (안정 버전만)
- `develop`: 스테이징 배포용 (테스트 및 QA)
- `feature/*`: 기능 개발용 (개발자별 작업)

---

### 2단계: Vercel 프로젝트 설정

#### A. Production Branch 설정

1. [Vercel Dashboard](https://vercel.com) 접속
2. **web** 프로젝트 선택
3. **Settings** → **Git** 섹션으로 이동
4. **Production Branch** 항목을 `main`으로 설정
5. Save 클릭

이렇게 하면:
- `main` 브랜치 푸시 → 자동으로 프로덕션 배포
- `develop` 브랜치 푸시 → Preview 환경으로 배포
- 기타 브랜치 → Preview 환경으로 배포

---

#### B. 환경변수 설정

##### 방법 1: Vercel Dashboard에서 설정 (추천)

1. Vercel Dashboard → **web** 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경변수들을 추가:

**프로덕션 환경 (Production):**
```
VITE_API_BASE_URL = https://h-andy.com
VITE_ENVIRONMENT = production
VITE_ENABLE_DEBUG = false
VITE_KAKAO_APP_KEY = [프로덕션 카카오 앱 키]
```

**스테이징 환경 (Preview - develop 브랜치):**
```
VITE_API_BASE_URL = https://www.stage-handy.com
VITE_ENVIRONMENT = staging
VITE_ENABLE_DEBUG = false
VITE_KAKAO_APP_KEY = f466bdbd818f288f370407d10da4710d
```

**중요**: 각 환경변수 추가 시 Environment 선택:
- Production 환경변수 → **Production** 체크
- 스테이징 환경변수 → **Preview** 체크 + **Branch**: `develop` 입력

##### 방법 2: Vercel CLI로 설정

```bash
# 프로젝트 디렉토리로 이동
cd packages/web

# Production 환경변수
vercel env add VITE_API_BASE_URL production
# 입력: https://h-andy.com

vercel env add VITE_ENVIRONMENT production
# 입력: production

# Preview (develop 브랜치) 환경변수
vercel env add VITE_API_BASE_URL preview
# 입력: https://www.stage-handy.com
# Branch: develop

vercel env add VITE_ENVIRONMENT preview
# 입력: staging
# Branch: develop
```

---

#### C. 도메인 연결

##### h-andy.com 도메인 추가

1. Vercel Dashboard → **web** 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. `h-andy.com` 입력 후 Add 클릭
4. DNS 설정 안내 화면 표시됨

##### DNS 설정 (도메인 제공자에서)

**옵션 A: Vercel Nameservers 사용 (추천)**
```
도메인 제공자 → DNS 설정 → Nameservers 변경:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**옵션 B: A 레코드 사용**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

##### stage-handy.com 도메인 (이미 설정됨)

현재 스테이징 도메인이 이미 연결되어 있다면 추가 작업 불필요.
`develop` 브랜치를 이 도메인에 매핑하려면:

1. Domains → `stage-handy.com` 옆 **Edit** 클릭
2. **Git Branch**: `develop` 선택
3. Save

---

### 3단계: 배포 실행

#### 로컬에서 빌드 및 배포

##### 스테이징 배포 (develop 브랜치)

```bash
# develop 브랜치로 이동
git checkout develop

# 최신 변경사항 반영
git pull origin develop

# 루트에서 빌드 (shared 포함)
cd /Users/heojeongmin/WebstormProjects/handy-platform
npm run build:shared

# 웹 패키지로 이동
cd packages/web

# 스테이징 빌드
npm run build:stage

# Vercel Preview 배포
npm run deploy:stage
# 또는
vercel

# 배포 URL 확인 및 테스트
```

##### 프로덕션 배포 (main 브랜치)

```bash
# main 브랜치로 이동
git checkout main

# develop 변경사항을 main에 병합
git merge develop

# 루트에서 빌드
cd /Users/heojeongmin/WebstormProjects/handy-platform
npm run build:shared

# 웹 패키지로 이동
cd packages/web

# 프로덕션 빌드
npm run build:prod

# Vercel Production 배포
npm run deploy:prod
# 또는
vercel --prod

# 배포 URL 확인: https://h-andy.com
```

---

#### Git Push를 통한 자동 배포 (추천)

Vercel은 Git과 자동 연동되므로, 브랜치 푸시만으로 배포됩니다.

##### 스테이징 자동 배포
```bash
# develop 브랜치에서 작업
git checkout develop

# 변경사항 커밋
git add .
git commit -m "feat: add new feature"

# develop 브랜치 푸시 → 자동으로 스테이징 배포
git push origin develop
```

##### 프로덕션 자동 배포
```bash
# develop을 main에 병합
git checkout main
git merge develop

# main 브랜치 푸시 → 자동으로 프로덕션 배포
git push origin main
```

**Vercel Dashboard에서 배포 상태 확인**:
- Deployments 탭에서 실시간 빌드 로그 확인
- 배포 완료 시 URL 자동 생성

---

### 4단계: 배포 검증

#### 체크리스트

##### 스테이징 환경 (https://stage-handy.com)
- [ ] 페이지 로딩 정상
- [ ] API 연동 정상 (백엔드 :8080 포트 연결 확인)
- [ ] 로그인/로그아웃 기능
- [ ] 장바구니 추가/삭제
- [ ] 상품 검색 및 목록
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 네트워크 탭에서 API 응답 확인

##### 프로덕션 환경 (https://h-andy.com)
- [ ] 페이지 로딩 정상
- [ ] API 연동 정상 (백엔드 :80 포트 연결 확인)
- [ ] 로그인/로그아웃 기능
- [ ] 장바구니 추가/삭제
- [ ] 상품 검색 및 목록
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 네트워크 탭에서 API 응답 확인
- [ ] 성능 테스트 (Lighthouse 점수 확인)
- [ ] 모바일 반응형 확인

##### 검증 방법

**1. API 연동 확인**
```bash
# 브라우저 개발자 도구 (F12) → Network 탭
# API 요청 URL 확인:
# 스테이징: https://www.stage-handy.com/api/...
# 프로덕션: https://h-andy.com/api/...
```

**2. 환경변수 확인**
```javascript
// 브라우저 콘솔에서 실행
console.log(import.meta.env.VITE_API_BASE_URL);
// 스테이징: "https://www.stage-handy.com"
// 프로덕션: "https://h-andy.com"
```

**3. 빌드 환경 확인**
```javascript
console.log(import.meta.env.VITE_ENVIRONMENT);
// 스테이징: "staging"
// 프로덕션: "production"
```

---

### 5단계: 백엔드 API 설정 확인

프론트엔드 배포 후 백엔드 서버 CORS 설정을 확인하세요.

#### 백엔드 CORS 설정 필요 도메인
```javascript
// 허용해야 할 도메인들
const allowedOrigins = [
  'https://h-andy.com',           // 프로덕션
  'https://www.stage-handy.com',  // 스테이징
  'http://localhost:3001',        // 로컬 개발
  '*.vercel.app'                  // Vercel Preview 환경
];
```

백엔드 팀에 전달:
- h-andy.com CORS 허용 요청
- 프로덕션 백엔드 포트: :80
- 스테이징 백엔드 포트: :8080

---

### 배포 워크플로우 요약

```
개발 프로세스:
1. feature/xxx 브랜치에서 개발
2. develop 브랜치로 PR 생성 및 병합
3. develop 푸시 → 자동 스테이징 배포 (stage-handy.com)
4. 스테이징에서 QA 및 테스트
5. main 브랜치로 PR 생성 및 병합
6. main 푸시 → 자동 프로덕션 배포 (h-andy.com)
7. 프로덕션에서 최종 검증
```

---

### 배포 관련 명령어 요약

```bash
# 스테이징 배포 (로컬)
npm run build:stage && npm run deploy:stage

# 프로덕션 배포 (로컬)
npm run build:prod && npm run deploy:prod

# Git을 통한 자동 배포 (추천)
git push origin develop  # 스테이징
git push origin main     # 프로덕션

# 배포 로그 확인
vercel logs

# 배포 목록 확인
vercel ls
```

---

### 문제 해결

#### 배포 실패 시
1. Vercel 대시보드 → Deployments → 실패한 배포 클릭
2. 빌드 로그 확인
3. 일반적인 원인:
   - 환경변수 미설정
   - TypeScript 에러
   - 빌드 명령어 오류
   - 메모리 부족

#### API 연결 안 됨
1. 브라우저 개발자 도구 → Network 탭
2. API 요청 URL 확인
3. CORS 에러 확인
4. 백엔드 서버 상태 확인

#### 도메인 연결 안 됨
1. DNS 전파 대기 (최대 48시간)
2. DNS 설정 확인: `nslookup h-andy.com`
3. Vercel Domains 탭에서 상태 확인
