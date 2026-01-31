import { NailShape } from '@handy-platform/shared';

interface NailShapeIconProps {
  shape: NailShape;
  className?: string;
  selected?: boolean;
}

/**
 * 네일 쉐입별 실루엣 SVG 아이콘
 * 실제 네일팁 모양을 표현
 */
export function NailShapeIcon({ shape, className = '', selected = false }: NailShapeIconProps) {
  const fillColor = selected ? '#ffffff' : '#374151';
  const strokeColor = selected ? '#ffffff' : '#9CA3AF';

  const iconClass = `w-10 h-14 ${className}`;

  switch (shape) {
    case 'ROUND':
      // 둥근 끝 - 클래식한 라운드 쉐입
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V20C8 9 14 2 20 2C26 2 32 9 32 20V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <ellipse cx="20" cy="20" rx="12" ry="18" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    case 'SQUARE':
      // 각진 사각형 끝 - 스퀘어 쉐입
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V12C8 6 12 2 20 2C28 2 32 6 32 12V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <rect x="8" y="2" width="24" height="24" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    case 'OVAL':
      // 타원형 - 오벌 쉐입
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V22C8 10 13 2 20 2C27 2 32 10 32 22V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <ellipse cx="20" cy="18" rx="12" ry="16" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </svg>
      );

    case 'ALMOND':
      // 아몬드형 - 끝이 부드럽게 뾰족
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V24C8 14 12 8 20 2C28 8 32 14 32 24V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M8 24C8 14 12 8 20 2C28 8 32 14 32 24C32 32 27 38 20 38C13 38 8 32 8 24Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'STILETTO':
      // 스틸레토 - 뾰족한 끝
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M10 56V28C10 18 14 10 20 2C26 10 30 18 30 28V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M10 28C10 18 14 10 20 2C26 10 30 18 30 28C30 36 26 42 20 42C14 42 10 36 10 28Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'COFFIN':
      // 코핀/발레리나 - 끝이 각진 타원
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V20C8 10 12 4 16 2H24C28 4 32 10 32 20V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M8 20C8 10 12 4 16 2H24C28 4 32 10 32 20V28H8V20Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <rect x="14" y="2" width="12" height="6" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
        </svg>
      );

    case 'SQUOVAL':
      // 스퀘어 + 오벌 조합
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M8 56V16C8 8 12 2 20 2C28 2 32 8 32 16V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M8 16C8 8 12 2 20 2C28 2 32 8 32 16V26C32 28 30 30 28 30H12C10 30 8 28 8 26V16Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    case 'BALLERINA':
      // 발레리나 - 코핀과 유사하지만 더 우아한 형태
      return (
        <svg viewBox="0 0 40 56" className={iconClass} fill="none">
          <path
            d="M10 56V22C10 12 13 6 17 3H23C27 6 30 12 30 22V56"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path
            d="M10 22C10 12 13 6 17 3H23C27 6 30 12 30 22V30C30 32 28 34 26 34H14C12 34 10 32 10 30V22Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </svg>
      );

    default:
      return null;
  }
}
