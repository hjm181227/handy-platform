import type { MembershipLevel } from '@handy-platform/shared';

// 회원등급별 스타일 정의
export interface MembershipStyle {
  bg: string;          // Tailwind 배경색 클래스
  hoverBg: string;     // 호버 시 배경색
  textColor: string;   // Tailwind 텍스트 색상 클래스
  label: string;       // 등급 약어 (1-2글자)
  fullName: string;    // 전체 이름
  description: string; // 등급 설명
  benefit: string;     // 혜택 설명
  requirement: string; // 승급 조건
}

// 등급 순서 (낮은 등급 → 높은 등급)
export const MEMBERSHIP_LEVELS: MembershipLevel[] = [
  'Stylish',
  'Gorgeous',
  'Stunning',
  'Iconic',
  'Breathtaking',
];

export const MEMBERSHIP_STYLES: Record<MembershipLevel, MembershipStyle> = {
  'Stylish': {
    bg: 'bg-gray-400',
    hoverBg: 'hover:bg-gray-500',
    textColor: 'text-gray-500',
    label: 'S',
    fullName: 'Stylish',
    description: '핸디의 첫 번째 등급입니다.',
    benefit: '',
    requirement: '신규 가입 시 자동 부여',
  },
  'Gorgeous': {
    bg: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-600',
    textColor: 'text-blue-500',
    label: 'G',
    fullName: 'Gorgeous',
    description: '꾸준히 핸디를 이용해주시는 고객님을 위한 등급입니다.',
    benefit: '',
    requirement: '누적 구매 5만원 이상',
  },
  'Stunning': {
    bg: 'bg-purple-500',
    hoverBg: 'hover:bg-purple-600',
    textColor: 'text-purple-500',
    label: 'St',
    fullName: 'Stunning',
    description: '핸디와 함께하는 특별한 고객님입니다.',
    benefit: '',
    requirement: '누적 구매 15만원 이상',
  },
  'Iconic': {
    bg: 'bg-yellow-500',
    hoverBg: 'hover:bg-yellow-600',
    textColor: 'text-yellow-600',
    label: 'I',
    fullName: 'Iconic',
    description: '핸디의 VIP 고객님입니다.',
    benefit: '',
    requirement: '누적 구매 30만원 이상',
  },
  'Breathtaking': {
    bg: 'bg-red-500',
    hoverBg: 'hover:bg-red-600',
    textColor: 'text-red-500',
    label: 'B',
    fullName: 'Breathtaking',
    description: '핸디의 최고 등급, VVIP 고객님입니다.',
    benefit: '',
    requirement: '누적 구매 50만원 이상',
  },
};

// 기본 스타일 (등급이 없는 경우)
export const DEFAULT_MEMBERSHIP_STYLE: MembershipStyle = {
  bg: 'bg-[#FF073A]',
  hoverBg: 'hover:bg-[#E0062F]',
  textColor: 'text-[#FF073A]',
  label: '',
  fullName: '',
  description: '',
  benefit: '',
  requirement: '',
};

// 등급에 따른 스타일 가져오기
export function getMembershipStyle(level?: MembershipLevel): MembershipStyle {
  if (!level) return DEFAULT_MEMBERSHIP_STYLE;
  return MEMBERSHIP_STYLES[level] || DEFAULT_MEMBERSHIP_STYLE;
}
