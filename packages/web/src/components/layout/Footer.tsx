import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../common/LanguageSelector';

/* ---------------- Mega Footer (링크도 라우팅) ---------------- */
export function FooterMega({ onGo }:{ onGo:(to:string)=>void }) {
  const { t } = useTranslation(['nav', 'common', 'mypage']);
  const cols = [
    { h: t('nav:footer.aboutHandy'), items: [t('nav:footer.companyIntro'), t('nav:footer.businessIntro'), t('nav:footer.newsroom'), /* "채용 정보", */ t('nav:footer.notice')], base:"/about" },
    // { h: "파트너 지원", items: [...], base:"/partner" },
    { h: t('nav:footer.customerSupport'), items: [t('nav:footer.contactUs'), t('nav:footer.faq'), t('nav:footer.csPhone'), t('nav:footer.csHours'), t('nav:footer.csEmail')], base:"/support" },
  ];
  const policy = [
    {label:t('nav:footer.privacyPolicy'), to:"/policy/privacy"},
    {label:t('nav:footer.termsOfService'), to:"/policy/terms"},
    {label:t('nav:footer.pgAgent'), to:"/policy/pg"},
    {label:t('nav:footer.disputeResolution'), to:"/policy/dispute"},
  ];

  return (
    <footer className="mt-10 bg-surface text-[#666] pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-5">
          {cols.map((c) => (
            <div key={c.h}>
              <div className="mb-2 text-sm font-semibold text-[#333]">{c.h}</div>
              <ul className="space-y-1 text-[13px]">
                {c.items.map((it) => {
                  // 고객센터와 운영시간은 클릭 불가
                  const isNonClickable = it === t('nav:footer.csPhone') || it === t('nav:footer.csHours') || it === t('nav:footer.csEmail');

                  if (isNonClickable) {
                    return (
                      <li key={it}>
                        <span>{it}</span>
                      </li>
                    );
                  }

                  let linkPath = `${c.base}/${encodeURIComponent(it)}`;
                  // 특별한 링크들을 직접 매핑
                  if (it === t('nav:footer.contactUs')) {
                    linkPath = "/contact";
                  } else if (it === t('nav:footer.faq')) {
                    linkPath = "/faq";
                  } else if (it === t('nav:footer.companyIntro')) {
                    linkPath = "/about";
                  } else if (it === t('nav:footer.businessIntro')) {
                    linkPath = "/about/business";
                  } else if (it === t('nav:footer.newsroom')) {
                    linkPath = "/about/news";
                  } else if (it === t('nav:footer.notice')) {
                    linkPath = "/notice";
                  }

                  return (
                    <li key={it}>
                      <a href={linkPath} onClick={(e)=>{e.preventDefault(); onGo(linkPath);}} className="hover:underline">{it}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-6 h-px bg-[#e5e5e5]" />

        <div className="text-[12px] leading-6 text-[#777]">
          <div className="text-[#444] font-medium">© HANDY ALL RIGHTS RESERVED</div>
          <p className="mt-2">
            {t('nav:footer.companyInfo')}
          </p>
    
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {policy.map((p)=>(
              <a key={p.label} href={p.to} onClick={(e)=>{e.preventDefault(); onGo(p.to);}} className="underline">{p.label}</a>
            ))}
            <span className="mx-1 text-[#ddd]">|</span>
            <LanguageSelector variant="dropdown" className="!text-[12px] !px-2 !py-1 !border-[#ccc] bg-white" />
          </div>

          {/* 인증 배지 숨김 */}
          {/* <div className="mt-3 flex flex-wrap gap-3 text-[#888]">
            {["윤리·준법경영 국제 표준 통합 인증","안전보건경영시스템 국제 인증","정보보호 관리체계 ISMS 인증"].map((c)=>(
              <span key={c} className="inline-flex items-center gap-2 rounded-full border px-2 py-1">
                <span className="h-4 w-4 rounded-full bg-[#ddd]" /> {c}
              </span>
            ))}
          </div> */}

          {/* SNS 링크 숨김 */}
          {/* <div className="mt-4 flex items-center gap-8 text-[#888]">
            {["YT","IG","X","TikTok","Blog"].map((k)=>(
              <a key={k} href={`/sns/${k.toLowerCase()}`} onClick={(e)=>{e.preventDefault(); onGo(`/sns/${k.toLowerCase()}`);}} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ddd] text-[10px]">{k}</a>
            ))}
          </div> */}
        </div>
      </div>
    </footer>
  );
}