import { NailLength } from '@handy-platform/shared';

interface NailLengthIconProps {
  length: NailLength;
  className?: string;
}

/**
 * 네일 길이별 시각적 아이콘
 * 손가락 위에 네일팁이 있는 형태로 길이를 표현
 */
export function NailLengthIcon({ length, className = '' }: NailLengthIconProps) {
  const iconClass = `w-12 h-16 ${className}`;

  // 손가락 색상
  const fingerColor = '#FFDAB9';
  const fingerStroke = '#DEB887';

  // 네일 색상 (핑크 계열)
  const nailColor = '#FFB6C1';
  const nailStroke = '#FF69B4';

  // 길이별 네일 높이 설정
  const nailHeights: Record<NailLength, { y: number; height: number; tipY: number }> = {
    SHORT: { y: 8, height: 14, tipY: 4 },
    MEDIUM: { y: 4, height: 22, tipY: 0 },
    LONG: { y: -4, height: 32, tipY: -8 },
  };

  const { y, height, tipY } = nailHeights[length];

  return (
    <svg viewBox="0 0 48 64" className={iconClass} fill="none">
      {/* 손가락 */}
      <rect
        x="12"
        y="28"
        width="24"
        height="36"
        rx="4"
        fill={fingerColor}
        stroke={fingerStroke}
        strokeWidth="1.5"
      />

      {/* 손가락 마디 라인 */}
      <line x1="14" y1="44" x2="34" y2="44" stroke={fingerStroke} strokeWidth="1" opacity="0.5" />
      <line x1="14" y1="52" x2="34" y2="52" stroke={fingerStroke} strokeWidth="1" opacity="0.5" />

      {/* 네일팁 (길이에 따라 다름) */}
      <path
        d={`M12 28
            C12 ${y + 8} 16 ${tipY} 24 ${tipY}
            C32 ${tipY} 36 ${y + 8} 36 28
            V${28 + 8} H12 V28Z`}
        fill={nailColor}
        stroke={nailStroke}
        strokeWidth="1.5"
      />

      {/* 네일 하이라이트 */}
      <ellipse
        cx="20"
        cy={y + 12}
        rx="4"
        ry="3"
        fill="white"
        opacity="0.4"
      />

      {/* 큐티클 라인 */}
      <path
        d="M14 30 Q24 34 34 30"
        stroke={nailStroke}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * 길이 비교용 간단한 바 아이콘
 */
export function NailLengthBar({ length, selected = false }: { length: NailLength; selected?: boolean }) {
  const barHeights: Record<NailLength, number> = {
    SHORT: 20,
    MEDIUM: 32,
    LONG: 44,
  };

  const height = barHeights[length];
  const fillColor = selected ? '#FF69B4' : '#FFB6C1';
  const bgColor = selected ? 'rgba(255, 105, 180, 0.2)' : '#F3F4F6';

  return (
    <div
      className="flex items-end justify-center w-12 h-12 rounded-lg"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="w-6 rounded-t-full transition-all"
        style={{
          height: `${height}px`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  );
}
