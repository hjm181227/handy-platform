import { NAIL_FINGERS, parseNailSizing } from '../../utils/nailSizing';

export function NailSizingSummary({ value, required = false }: { value: unknown; required?: boolean }) {
  const sizing = parseNailSizing(value);
  if (!sizing) return required ? <p className="text-sm text-amber-700">제작 정보 확인 필요: 양손 손톱 사이즈가 없습니다.</p> : null;
  return <div className="text-xs leading-5 mt-2" aria-label="주문 제작 사이즈">
    <p className="font-medium">손톱 폭 (mm · 엄지 / 검지 / 중지 / 약지 / 소지)</p>
    <p>왼손: {NAIL_FINGERS.map(finger => sizing.left[finger]).join(' / ')}</p>
    <p>오른손: {NAIL_FINGERS.map(finger => sizing.right[finger]).join(' / ')}</p>
  </div>;
}
