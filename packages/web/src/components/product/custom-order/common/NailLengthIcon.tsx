import { NailLength } from '@handy-platform/shared';

interface NailLengthIconProps {
  length: NailLength;
  className?: string;
  selected?: boolean;
}

/**
 * 네일 길이별 실루엣 아이콘
 * 손가락 끝에 네일팁이 있는 형태로 길이를 표현
 */
export function NailLengthIcon({ length, className = '', selected = false }: NailLengthIconProps) {
  const iconClass = `w-12 h-14 ${className}`;

  // 선택 상태에 따른 색상
  const fingerColor = selected ? '#FFF0F5' : '#FFEEE8';
  const fingerStroke = selected ? '#FF69B4' : '#E8D5CF';
  const nailColor = selected ? '#FF69B4' : '#FFB6C1';
  const nailStroke = selected ? '#DB2777' : '#F472B6';

  // 길이별 네일 확장 정도 (손가락 끝에서 얼마나 나오는지)
  const lengthConfig: Record<NailLength, { tipExtend: number; curveY: number }> = {
    SHORT: { tipExtend: 4, curveY: 18 },   // 짧게 - 손톱 끝에서 조금만
    MEDIUM: { tipExtend: 10, curveY: 12 }, // 중간 - 적당히 연장
    LONG: { tipExtend: 18, curveY: 4 },    // 길게 - 많이 연장
  };

  const { tipExtend, curveY } = lengthConfig[length];

  return (
    <svg viewBox="0 0 48 56" className={iconClass} fill="none">
      {/* 손가락 몸통 */}
      <path
        d="M14 56 L14 28 Q14 20 24 20 Q34 20 34 28 L34 56"
        fill={fingerColor}
        stroke={fingerStroke}
        strokeWidth="1.5"
      />

      {/* 손가락 마디 */}
      <line x1="16" y1="38" x2="32" y2="38" stroke={fingerStroke} strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="48" x2="32" y2="48" stroke={fingerStroke} strokeWidth="1" opacity="0.5" />

      {/* 네일 베드 (손톱 바닥) */}
      <path
        d="M16 28 Q16 22 24 22 Q32 22 32 28 L32 24 Q32 20 24 20 Q16 20 16 24 Z"
        fill={fingerColor}
        stroke={fingerStroke}
        strokeWidth="0.5"
      />

      {/* 네일팁 (길이에 따라 다름) */}
      <path
        d={`M16 28
            L16 24
            Q16 ${curveY} 24 ${curveY - tipExtend}
            Q32 ${curveY} 32 24
            L32 28
            Q32 22 24 22
            Q16 22 16 28 Z`}
        fill={nailColor}
        stroke={nailStroke}
        strokeWidth="1.5"
      />

      {/* 네일 하이라이트 */}
      <ellipse
        cx="21"
        cy={curveY + 2}
        rx="3"
        ry="2"
        fill="white"
        opacity="0.5"
      />

      {/* 프리엣지 라인 (자연 손톱 끝) */}
      <path
        d="M17 26 Q24 28 31 26"
        stroke={nailStroke}
        strokeWidth="0.75"
        fill="none"
        opacity="0.4"
        strokeDasharray="2 1"
      />
    </svg>
  );
}

/**
 * 길이 비교용 실루엣 아이콘 (LengthStep에서 사용)
 * 손가락 옆면 실루엣으로 길이 차이를 명확히 표현
 */
export function NailLengthBar({ length, selected = false }: { length: NailLength; selected?: boolean }) {
  // 선택 상태에 따른 색상
  const fingerColor = selected ? '#FFF0F5' : '#F9FAFB';
  const fingerStroke = selected ? '#F9A8D4' : '#E5E7EB';
  const nailColor = selected ? '#EC4899' : '#F9A8D4';
  const nailStroke = selected ? '#BE185D' : '#EC4899';

  // 길이별 네일 확장 (위로 얼마나 나오는지)
  const lengthConfig: Record<NailLength, { nailTop: number; labelY: number }> = {
    SHORT: { nailTop: 16, labelY: 10 },
    MEDIUM: { nailTop: 8, labelY: 2 },
    LONG: { nailTop: -2, labelY: -8 },
  };

  const { nailTop } = lengthConfig[length];

  return (
    <div className="flex items-center justify-center w-14 h-14">
      <svg viewBox="0 0 56 56" className="w-full h-full" fill="none">
        {/* 손가락 (옆면 뷰) */}
        <path
          d="M18 56 L18 28 Q18 20 28 20 Q38 20 38 28 L38 56"
          fill={fingerColor}
          stroke={fingerStroke}
          strokeWidth="1.5"
        />

        {/* 손가락 마디 */}
        <line x1="20" y1="36" x2="36" y2="36" stroke={fingerStroke} strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="46" x2="36" y2="46" stroke={fingerStroke} strokeWidth="1" opacity="0.4" />

        {/* 네일팁 */}
        <path
          d={`M20 28
              L20 24
              Q20 ${nailTop + 4} 28 ${nailTop}
              Q36 ${nailTop + 4} 36 24
              L36 28
              Q36 22 28 22
              Q20 22 20 28 Z`}
          fill={nailColor}
          stroke={nailStroke}
          strokeWidth="1.5"
        />

        {/* 하이라이트 */}
        <ellipse
          cx="25"
          cy={nailTop + 8}
          rx="3"
          ry="2"
          fill="white"
          opacity="0.5"
        />

        {/* 자연 손톱 끝 표시 (점선) */}
        <path
          d="M21 26 Q28 28 35 26"
          stroke={nailStroke}
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
          strokeDasharray="2 1"
        />
      </svg>
    </div>
  );
}
