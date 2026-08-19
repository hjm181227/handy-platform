import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  API_BASE_URL,
  ImageUploadManager,
  SellerApplicationData,
  SellerApplicationStatus,
} from '@handy-platform/shared';
import { sellerApplicationService } from '../../services/apiService';

interface Props {
  onGo: (to: string) => void;
}

const emptyForm: SellerApplicationData = {
  brandName: '',
  representativeName: '',
  businessNumber: '',
  mailOrderSalesNumber: '',
  businessType: '',
  businessCategory: '',
  contactEmail: '',
  contactPhone: '',
  businessAddress: { street: '', city: '', state: '', zipCode: '', country: '대한민국' },
  bankAccount: { bankName: '', accountNumber: '', accountHolder: '' },
  verificationDocuments: [],
  acceptsCustomOrders: false,
};

const steps = ['브랜드 정보', '사업장 정보', '정산 및 서류'];

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#E85A6B] focus:ring-2 focus:ring-[#E85A6B]/10"
      />
    </label>
  );
}

const SellerApplicationForm: React.FC<Props> = ({ onGo }) => {
  const [form, setForm] = useState<SellerApplicationData>(emptyForm);
  // 서비스 응답의 data 가 optional 이므로 undefined 도 허용한다
  const [status, setStatus] = useState<SellerApplicationStatus | null | undefined>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadManager = useMemo(() => new ImageUploadManager(
    (import.meta as any).env?.VITE_API_BASE_URL || API_BASE_URL,
    async (): Promise<Record<string, string>> => {
      const token = localStorage.getItem('accessToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  ), []);

  useEffect(() => {
    const load = async () => {
      try {
        const statusResponse = await sellerApplicationService.getMyApplicationStatus();
        setStatus(statusResponse.data);
        if (statusResponse.data?.exists) {
          const detailResponse = await sellerApplicationService.getMyApplication();
          if (detailResponse.data?.application) {
            setForm({ ...emptyForm, ...detailResponse.data.application });
          }
        }
      } catch (error) {
        console.error('Failed to load seller application:', error);
        setMessage('신청 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = <K extends keyof SellerApplicationData>(key: K, value: SellerApplicationData[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setMessage('');
  };

  const updateAddress = (key: keyof NonNullable<SellerApplicationData['businessAddress']>, value: string) => {
    update('businessAddress', { ...form.businessAddress!, [key]: value });
  };

  const updateBank = (key: keyof SellerApplicationData['bankAccount'], value: string) => {
    update('bankAccount', { ...form.bankAccount, [key]: value });
  };

  const validateStep = () => {
    const requiredByStep = [
      [form.brandName, form.representativeName, form.businessNumber, form.businessType, form.businessCategory, form.contactEmail, form.contactPhone],
      [form.businessAddress?.street, form.businessAddress?.city, form.businessAddress?.state, form.businessAddress?.zipCode],
      [form.bankAccount.bankName, form.bankAccount.accountNumber, form.bankAccount.accountHolder, form.verificationDocuments?.[0]?.url],
    ];
    if (requiredByStep[step].some((value) => !String(value || '').trim())) {
      setMessage('이 단계의 필수 정보를 모두 입력해 주세요.');
      return false;
    }
    if (step === 0 && !/^\d{3}-?\d{2}-?\d{5}$/.test(form.businessNumber)) {
      setMessage('사업자등록번호를 123-45-67890 형식으로 입력해 주세요.');
      return false;
    }
    return true;
  };

  const saveDraft = async (showMessage = true) => {
    if (!form.brandName.trim()) {
      setMessage('임시저장을 시작하려면 브랜드명을 입력해 주세요.');
      return false;
    }
    try {
      setSaving(true);
      const response = await sellerApplicationService.saveDraft(form);
      setStatus(response.data);
      if (showMessage) setMessage('입력 내용이 안전하게 저장되었습니다.');
      return true;
    } catch (error: any) {
      setMessage(error?.message || '임시저장에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (!validateStep()) return;
    if (!(await saveDraft(false))) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadDocument = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      setMessage('');
      const result = await uploadManager.uploadImage({ file, uploadType: 'seller-document' });
      if (!result.success || !result.imageUrl) throw new Error(result.error || '업로드에 실패했습니다.');
      update('verificationDocuments', [{ type: 'business_registration', url: result.imageUrl }]);
      setMessage('사업자등록증이 업로드되었습니다.');
    } catch (error: any) {
      setMessage(error?.message || '서류 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!validateStep()) return;
    try {
      setSaving(true);
      await sellerApplicationService.saveDraft(form);
      const response = await sellerApplicationService.submitSavedApplication();
      setStatus(response.data);
      setMessage('입점 신청이 접수되었습니다. 검토 결과를 이 화면에서 확인할 수 있습니다.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setMessage(error?.message || '신청 제출에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-gray-500">입점 신청 정보를 불러오는 중입니다…</div>;
  }

  if (status?.status === 'pending' || status?.status === 'approved') {
    const approved = status.status === 'approved';
    return (
      <main className="min-h-screen bg-[#FAF8F7] px-4 py-12">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${approved ? 'bg-green-100' : 'bg-amber-100'}`}>
            {approved ? '✓' : '⌛'}
          </div>
          <h1 className="text-2xl font-bold text-gray-950">{approved ? '입점 승인이 완료되었습니다' : '입점 신청을 검토하고 있습니다'}</h1>
          <p className="mt-3 text-gray-600">{approved ? '이제 상품을 등록하고 판매를 시작할 수 있습니다.' : '담당자가 신청 내용을 확인한 뒤 결과를 알려드립니다.'}</p>
          {message && <p className="mt-5 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{message}</p>}
          <button onClick={() => onGo(approved ? '/seller' : '/')} className="mt-7 w-full rounded-xl bg-[#E85A6B] px-5 py-3 font-semibold text-white">
            {approved ? '판매자 센터로 이동' : '홈으로 이동'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F7] px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <button onClick={() => onGo('/')} className="mb-5 text-sm text-gray-500">← 나중에 계속하기</button>
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-9">
          <div className="mb-7">
            <p className="text-sm font-semibold text-[#E85A6B]">Handy 파트너 입점</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">브랜드의 판매를 시작해 보세요</h1>
            <p className="mt-2 text-gray-600">작성 중 언제든 저장하고 다시 이어갈 수 있습니다.</p>
          </div>

          {status?.status === 'rejected' && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">보완 요청: {status.rejectionReason || '신청 내용을 확인한 후 다시 제출해 주세요.'}</div>
          )}

          <div className="mb-8 grid grid-cols-3 gap-2">
            {steps.map((name, index) => (
              <div key={name} className={`whitespace-nowrap rounded-xl px-1 py-3 text-center text-xs font-medium sm:px-3 sm:text-sm ${index === step ? 'bg-[#E85A6B] text-white' : index < step ? 'bg-[#FFF1F2] text-[#D14A5B]' : 'bg-gray-100 text-gray-400'}`}>
                {index + 1}. {name}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="브랜드명 *" value={form.brandName} onChange={(value) => update('brandName', value)} placeholder="고객에게 표시될 브랜드명" />
              <Field label="대표자명 *" value={form.representativeName || ''} onChange={(value) => update('representativeName', value)} />
              <Field label="사업자등록번호 *" value={form.businessNumber} onChange={(value) => update('businessNumber', value)} placeholder="123-45-67890" />
              {/* 통신판매업 신고번호: 전자상거래법상 브랜드 페이지에 공개되는 항목 (미신고 판매자를 위해 선택 입력) */}
              <Field label="통신판매업 신고번호 (선택)" value={form.mailOrderSalesNumber || ''} onChange={(value) => update('mailOrderSalesNumber', value)} placeholder="2024-용인기흥-2437" />
              <Field label="업태 *" value={form.businessType || ''} onChange={(value) => update('businessType', value)} placeholder="예: 제조업" />
              <Field label="업종·종목 *" value={form.businessCategory || ''} onChange={(value) => update('businessCategory', value)} placeholder="예: 네일용품 제조 및 판매" />
              <Field label="담당자 이메일 *" type="email" value={form.contactEmail} onChange={(value) => update('contactEmail', value)} />
              <Field label="담당자 연락처 *" value={form.contactPhone} onChange={(value) => update('contactPhone', value)} placeholder="010-1234-5678" />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2"><Field label="사업장 주소 *" value={form.businessAddress?.street || ''} onChange={(value) => updateAddress('street', value)} placeholder="도로명과 건물번호" /></div>
              <Field label="시·군·구 *" value={form.businessAddress?.city || ''} onChange={(value) => updateAddress('city', value)} placeholder="예: 강남구" />
              <Field label="시·도 *" value={form.businessAddress?.state || ''} onChange={(value) => updateAddress('state', value)} placeholder="예: 서울특별시" />
              <Field label="우편번호 *" value={form.businessAddress?.zipCode || ''} onChange={(value) => updateAddress('zipCode', value)} placeholder="06124" />
              <Field label="국가" value={form.businessAddress?.country || ''} onChange={(value) => updateAddress('country', value)} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="은행명 *" value={form.bankAccount.bankName} onChange={(value) => updateBank('bankName', value)} />
              <Field label="예금주 *" value={form.bankAccount.accountHolder} onChange={(value) => updateBank('accountHolder', value)} />
              <div className="md:col-span-2"><Field label="정산 계좌번호 *" value={form.bankAccount.accountNumber} onChange={(value) => updateBank('accountNumber', value)} /></div>
              <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-300 p-5">
                <p className="font-medium text-gray-900">사업자등록증 이미지 *</p>
                <p className="mt-1 text-sm text-gray-500">JPG, PNG 또는 WebP 형식, 최대 5MB · 비공개로 안전하게 보관됩니다.</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => uploadDocument(event.target.files?.[0])} />
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50">
                  {uploading ? '업로드 중…' : form.verificationDocuments?.length ? '다른 파일 선택' : '파일 선택'}
                </button>
                {!!form.verificationDocuments?.length && <span className="ml-3 text-sm font-medium text-green-700">업로드 완료 ✓</span>}
              </div>
              <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                <input type="checkbox" checked={form.acceptsCustomOrders || false} onChange={(event) => update('acceptsCustomOrders', event.target.checked)} />
                맞춤 제작 주문도 받고 싶습니다.
              </label>
            </div>
          )}

          {message && <div className="mt-6 rounded-xl bg-[#FFF1F2] p-4 text-sm text-[#B43C4D]">{message}</div>}

          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl border border-gray-300 px-5 py-3 font-medium">이전</button>}
            <button type="button" disabled={saving} onClick={() => saveDraft()} className="rounded-xl border border-[#E85A6B] px-5 py-3 font-medium text-[#D14A5B] disabled:opacity-50">임시저장</button>
            <button type="button" disabled={saving || uploading} onClick={step === steps.length - 1 ? submit : next} className="ml-auto rounded-xl bg-[#E85A6B] px-6 py-3 font-semibold text-white disabled:opacity-50">
              {saving ? '저장 중…' : step === steps.length - 1 ? '입점 신청 제출' : '저장하고 다음'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SellerApplicationForm;
