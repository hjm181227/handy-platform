/**
 * 외부 프로필 이미지 URL을 https로 정규화한다.
 *
 * 카카오 로그인 프로필이 `http://k.kakaocdn.net/...` 형태로 저장돼 있어
 * HTTPS 페이지에서 mixed content로 차단되어 이미지가 깨진다.
 * 해당 CDN들은 https를 지원하므로 스킴만 올려서 쓴다.
 */
export function secureImageUrl(url: string): string;
export function secureImageUrl(url: string | null | undefined): string | undefined;
export function secureImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://')) {
    return 'https://' + url.slice('http://'.length);
  }
  return url;
}
