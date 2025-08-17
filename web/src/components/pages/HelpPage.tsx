import React, { useState } from 'react';
import { faqs } from '../../data';

export function HelpPage({ onGo }: { onGo: (to: string) => void }) {
  const tel = "1544-7199";
  const email = "cs@handy.com";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("[HANDY] 문의")}&body=${encodeURIComponent("안녕하세요, 문의드립니다.\n\n주문번호:\n내용:")}`;

  const openChat = () => {
    // 웹에선 /support/contact 로 이동, 앱에선 브릿지 메세지 전송
    try { (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "open-chat" })); } catch {}
    onGo("/support/contact");
  };

  const [query, setQuery] = useState("");
  const filtered = faqs.filter(f => {
    const q = query.trim();
    return q === "" || (f.q + f.a).toLowerCase().includes(q.toLowerCase());
  });

  const ActionBtn = ({ icon, label, href, onClick }:{
    icon: React.ReactNode; label: string; href?: string; onClick?: ()=>void;
  }) => (
    href ? (
      <a href={href} className="flex-1 rounded-xl border bg-white px-4 py-3 text-center hover:bg-gray-50">
        <div className="mx-auto mb-1 h-6 w-6">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
      </a>
    ) : (
      <button onClick={onClick} className="flex-1 rounded-xl border bg-white px-4 py-3 hover:bg-gray-50">
        <div className="mx-auto mb-1 h-6 w-6">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
      </button>
    )
  );

  const PhoneI = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="currentColor"/></svg>);
  const MailI  = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>);
  const ChatI  = () => (<svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>);

  const FAQItem = ({ f }: { f: typeof faqs[0] }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="rounded-lg border bg-white">
        <button onClick={() => setOpen(v=>!v)} className="w-full px-4 py-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{f.q}</span>
            <span className="text-gray-400">{open ? "−" : "+"}</span>
          </div>
        </button>
        {open && <div className="px-4 pb-4 text-sm text-gray-700">{f.a}</div>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">HELP</h1>
      <p className="text-sm text-gray-600">문의 유형을 선택하거나 FAQ에서 빠르게 답을 찾으세요.</p>

      {/* 핵심 액션 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ActionBtn icon={<PhoneI/>} label={`고객센터 연결 (${tel})`} href={`tel:${tel}`} />
        <ActionBtn icon={<MailI/>}  label="이메일 보내기" href={mailto} />
        <ActionBtn icon={<ChatI/>}  label="1:1 상담 연결" onClick={openChat} />
      </div>

      {/* 운영 정보 / 안내 */}
      <div className="mt-3 rounded-lg bg-gray-100 px-4 py-3 text-xs text-gray-700">
        상담시간: 평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00) · 토/일/공휴일 휴무
      </div>

      {/* 검색 */}
      <div className="mt-5">
        <div className="flex items-center gap-2 rounded-full border px-4 py-2 bg-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-500" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
          </svg>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="FAQ 검색 (예: 반품, 영수증, 배송)"
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      {/* FAQ 리스트 */}
      <div className="mt-4 space-y-2">
        {filtered.map((f, i) => <FAQItem key={i} f={f} />)}
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white px-4 py-6 text-center text-sm text-gray-500">
            검색 결과가 없습니다. 키워드를 바꿔보거나 1:1 상담을 이용하세요.
          </div>
        )}
      </div>

      {/* 추가 안내 */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-zinc-900 to-gray-800 p-5 text-white">
        <div className="text-[15px] font-semibold">해결이 안 되시나요?</div>
        <p className="mt-1 text-sm text-white/80">주문 번호를 준비하시면 더 빠르게 도와드릴 수 있어요.</p>
        <div className="mt-3 flex gap-2">
          <a href={`tel:${tel}`} className="rounded-full bg-white px-4 py-1.5 text-sm text-black">고객센터 전화</a>
          <button onClick={openChat} className="rounded-full bg-white/10 px-4 py-1.5 text-sm">1:1 상담</button>
        </div>
      </div>
    </div>
  );
}