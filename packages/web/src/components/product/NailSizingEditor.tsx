import { useState } from 'react';
import { webApiService } from '../../services/apiService';
import { NAIL_FINGERS, NailSizing, parseNailSizing } from '../../utils/nailSizing';

export const emptyNailSizing = (): NailSizing => ({ unit: 'mm',
  left: { thumb: 0, index: 0, middle: 0, ring: 0, little: 0 },
  right: { thumb: 0, index: 0, middle: 0, ring: 0, little: 0 }
});
const labels = ['엄지', '검지', '중지', '약지', '소지'];

export function NailSizingEditor({ value, onChange, confirmed, onConfirm }: {
  value: NailSizing; onChange: (value: NailSizing) => void;
  confirmed: boolean; onConfirm: (value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const loadSaved = async () => {
    setLoading(true); setNotice('');
    try {
      const response = await webApiService.user.getNailSize();
      if (!response.data) { setNotice('저장된 사이즈가 없습니다. 아래에 직접 입력해주세요.'); return; }
      const data = response.data;
      onChange({ unit: 'mm', left: { ...data.leftHand }, right: { ...data.rightHand } });
      setNotice('불러온 사이즈를 확인해주세요. 비어 있는 손가락은 직접 입력할 수 있습니다.');
    } catch { setNotice('저장된 사이즈를 불러오지 못했습니다. 로그인 상태를 확인하거나 직접 입력해주세요.'); }
    finally { setLoading(false); }
  };
  return <fieldset className="rounded-xl border border-line p-4 space-y-3" id="order-nail-sizing">
    <legend className="px-1 font-semibold">제작할 손톱 사이즈</legend>
    <p className="text-sm text-muted">각 손톱의 가로 폭을 mm 단위로 입력해주세요. 여러 세트는 같은 사이즈로 제작됩니다. 다른 사이즈는 별도로 담아주세요.</p>
    <button type="button" className="text-sm underline" disabled={loading} onClick={loadSaved}>{loading ? '불러오는 중…' : '저장된 사이즈 불러오기'}</button>
    {(['left', 'right'] as const).map(hand => <div key={hand}>
      <p className="text-sm font-medium mb-2">{hand === 'left' ? '왼손' : '오른손'} (mm)</p>
      <div className="grid grid-cols-5 gap-2">{NAIL_FINGERS.map((finger, index) => <label className="text-xs" key={finger}>
        {labels[index]}
        <input type="number" inputMode="decimal" min="0.01" max="50" step="0.01"
          aria-label={`${hand === 'left' ? '왼손' : '오른손'} ${labels[index]} 손톱 폭 mm`}
          value={value[hand][finger] || ''} className="mt-1 w-full rounded border border-line px-2 py-2"
          onChange={event => onChange({ ...value, [hand]: { ...value[hand], [finger]: Number(event.target.value) } })} />
      </label>)}</div>
    </div>)}
    {notice && <p className="text-sm text-muted" role="status">{notice}</p>}
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmed}
      disabled={!parseNailSizing(value)} onChange={event => onConfirm(event.target.checked)} />양손 10개 사이즈를 확인했습니다. 이 사이즈로 제작해주세요.</label>
  </fieldset>;
}
