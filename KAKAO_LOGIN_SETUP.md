# 카카오 로그인 연동 설정 가이드

## 🎯 구현 완료 내용

✅ **프론트엔드 구현 완료**
- 카카오 SDK 동적 로딩 및 초기화
- 로그인 화면에 카카오 로그인 버튼 추가
- OAuth 인증 플로우 연동
- 에러 처리 및 사용자 피드백
- 로딩 상태 관리

✅ **백엔드 연동 준비 완료**
- OAuth API 엔드포인트 (`/api/auth/oauth/kakao`)
- JWT 토큰 관리
- 사용자 정보 동기화

## 🔧 카카오 개발자 설정 필요 사항

### 1. 카카오 개발자 콘솔 설정

1. **카카오 개발자 콘솔 접속**: https://developers.kakao.com/
2. **앱 생성**: 
   - 앱 이름: `Handy Platform - 네일아트 쇼핑몰`
   - 회사명: `핸디 메이드`
3. **플랫폼 등록**:
   - **웹 플랫폼**: 
     - 도메인: `localhost:3001` (개발용)
     - 도메인: `your-production-domain.com` (프로덕션용)
   - **Android/iOS**: 필요시 추가

### 2. 카카오 로그인 활성화

1. **제품 설정 > 카카오 로그인**
2. **활성화 설정**: ON
3. **Redirect URI 설정**:
   - 개발용: `http://localhost:3001/auth/kakao/callback`
   - 프로덕션: `https://your-domain.com/auth/kakao/callback`
4. **동의항목 설정**:
   - 닉네임: 필수
   - 이메일: 필수 (비즈니스 앱 승인 필요)
   - 성별, 연령대: 선택

### 3. 앱 키 발급 및 설정

1. **앱 설정 > 앱 키**에서 `JavaScript 키` 복사
2. **환경 변수 설정**:

```bash
# packages/web/.env.development
VITE_KAKAO_APP_KEY=your_actual_javascript_key_here

# packages/web/.env.production  
VITE_KAKAO_APP_KEY=your_actual_javascript_key_here
```

## 🚀 서버 연동 요구사항

### 백엔드 API 구현 확인

**필요한 엔드포인트**: `POST /api/auth/oauth/kakao`

**요청 형식**:
```json
{
  "accessToken": "kakaoaccess_token_here"
}
```

**응답 형식**:
```json
{
  "message": "OAuth 로그인 성공",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "사용자명",
    "role": "user"
  }
}
```

### 카카오 사용자 정보 처리

카카오 API에서 받는 사용자 정보:
```json
{
  "id": 123456789,
  "kakao_account": {
    "email": "user@example.com",
    "profile": {
      "nickname": "사용자닉네임",
      "profile_image_url": "https://..."
    }
  }
}
```

## 📱 테스트 방법

### 1. 개발 환경 실행
```bash
# 웹 개발 서버 시작
npm run web:dev

# 또는 특정 환경으로 실행
npm run web:stage
```

### 2. 로그인 테스트
1. `http://localhost:3001/login` 접속
2. "카카오 로그인" 버튼 클릭
3. 카카오 로그인 팝업에서 인증
4. JWT 토큰 저장 및 홈 페이지 리다이렉트 확인

### 3. 디버깅
브라우저 개발자 도구 콘솔에서 로그 확인:
```javascript
// 카카오 SDK 초기화 확인
console.log(window.Kakao);

// 로컬 스토리지의 토큰 확인
console.log(localStorage.getItem('accessToken'));
```

## 🔍 트러블슈팅

### 자주 발생하는 오류

1. **"카카오 SDK 초기화 실패"**
   - 인터넷 연결 확인
   - JavaScript 키 유효성 확인
   - CORS 설정 확인

2. **"OAuth 서버 인증 실패"**
   - 백엔드 서버 실행 상태 확인
   - API 엔드포인트 URL 확인
   - 네트워크 요청 로그 확인

3. **"Redirect URI mismatch"**
   - 카카오 개발자 콘솔에서 Redirect URI 정확히 설정
   - 프로토콜(http/https) 일치 확인

### 보안 고려사항

1. **JavaScript 키 노출**: 
   - 클라이언트 사이드에서 사용하므로 노출됨
   - 도메인 제한으로 보안 강화
   
2. **액세스 토큰 처리**:
   - 서버에서만 사용자 정보 조회
   - 클라이언트는 JWT 토큰만 저장

3. **HTTPS 필수**:
   - 프로덕션에서는 반드시 HTTPS 사용
   - 카카오 로그인 정책 준수

## 🎉 완료 후 확인사항

- [ ] 카카오 로그인 버튼 정상 동작
- [ ] 사용자 정보 서버 저장 확인  
- [ ] JWT 토큰 로컬 스토리지 저장
- [ ] 로그인 후 홈 페이지 리다이렉트
- [ ] 로그아웃 후 토큰 삭제
- [ ] 에러 상황 사용자 피드백

---

**참고**: 현재 다른 소셜 로그인(Google, Apple, Naver)은 "준비 중" 상태로 표시되며, 필요시 같은 패턴으로 구현할 수 있습니다.