
/* ---------------- Mega Footer (링크도 라우팅) ---------------- */
export function FooterMega({ onGo }:{ onGo:(to:string)=>void }) {
  const cols = [
    { h: "어바웃 HANDY", items: ["회사 소개", "비즈니스 소개", "뉴스룸", "채용 정보", "공지사항"], base:"/about" },
    { h: "파트너 지원", items: ["입점 문의", "광고/제휴 문의", "협찬 문의", "공동/대량 구매 문의", "제조/생산 문의", "이미지/저작권 문의"], base:"/partner" },
    { h: "고객 지원", items: ["1:1 문의하기", "FAQ 자주 묻는 질문", "고객센터 9611-1711", "운영시간: 평일 09:00 ~ 18:00 (12:00~13:00 제외)", "cs@handy.com"], base:"/support" },
  ];
  const policy = [
    {label:"개인정보처리방침", to:"/policy/privacy"},
    {label:"이용약관", to:"/policy/terms"},
    {label:"결제대행 위탁사", to:"/policy/pg"},
    {label:"분쟁해결기준", to:"/policy/dispute"},
    {label:"영상정보처리기기 운영·관리방침", to:"/policy/cctv"},
  ];

  return (
    <footer className="mt-10 bg-[#f5f5f5] text-[#666]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-5">
          {cols.map((c) => (
            <div key={c.h}>
              <div className="mb-2 text-sm font-semibold text-[#333]">{c.h}</div>
              <ul className="space-y-1 text-[13px]">
                {c.items.map((it) => {
                  let linkPath = `${c.base}/${encodeURIComponent(it)}`;
                  // 특별한 링크들을 직접 매핑
                  if (it === "1:1 문의하기") {
                    linkPath = "/contact-inquiry";
                  } else if (it === "FAQ 자주 묻는 질문") {
                    linkPath = "/footer-faq";
                  } else if (it === "회사 소개") {
                    linkPath = "/about-company";
                  } else if (it === "비즈니스 소개") {
                    linkPath = "/about-business";
                  } else if (it === "뉴스룸") {
                    linkPath = "/about-newsroom";
                  } else if (it === "채용 정보") {
                    linkPath = "/about-careers";
                  } else if (it === "공지사항") {
                    linkPath = "/about-notice";
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
            에르모세아르 | 대표자: 김동현 | 주소: 경기도 용인시 기흥구 공세로 150-29, B01-G160호 | 통신판매업 신고번호: 2024-용인기흥-2437 |
            사업자등록번호: 106-16-34319(사업자정보확인)
          </p>
    
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {policy.map((p)=>(
              <a key={p.label} href={p.to} onClick={(e)=>{e.preventDefault(); onGo(p.to);}} className="underline">{p.label}</a>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[#888]">
            {["윤리·준법경영 국제 표준 통합 인증","안전보건경영시스템 국제 인증","정보보호 관리체계 ISMS 인증"].map((c)=>(
              <span key={c} className="inline-flex items-center gap-2 rounded-full border px-2 py-1">
                <span className="h-4 w-4 rounded-full bg-[#ddd]" /> {c}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-8 text-[#888]">
            {["YT","IG","X","TikTok","Blog"].map((k)=>(
              <a key={k} href={`/sns/${k.toLowerCase()}`} onClick={(e)=>{e.preventDefault(); onGo(`/sns/${k.toLowerCase()}`);}} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ddd] text-[10px]">{k}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}