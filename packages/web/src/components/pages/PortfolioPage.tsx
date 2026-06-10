import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { PORTFOLIO_CSS, PORTFOLIO_HTML } from './portfolioAssets';

/**
 * 김동현 포트폴리오 페이지 — "제가 같이 일할래요!"
 *
 * 특징:
 * - 기존 핸디 사이트와 완전히 독립된 공간 (헤더/푸터/전역 레이아웃 미적용)
 * - 진입 경로는 직접 링크(`/DongHyun/portfolio`)로만 접근 (메뉴/네비게이션 미노출)
 * - `noindex`로 검색엔진 색인 차단
 *
 * 격리 방식:
 * - 원본 디자인(styles.css)을 모두 `#donghyun-portfolio` / `body.donghyun-portfolio-active`로
 *   스코프하여, 이 페이지가 마운트된 동안에만 <head>에 주입하고 언마운트 시 제거합니다.
 * - 따라서 기존 사이트의 스타일/배경/폰트에 영향을 주지 않습니다.
 */
interface PortfolioPageProps {
  nav?: (to: string) => void;
}

export function PortfolioPage(_props: PortfolioPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const head = document.head;
    const injected: HTMLElement[] = [];

    // 1) 폰트 주입 (Gowun Batang, Pretendard) — id로 중복 방지
    const addLink = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id;
      l.rel = 'stylesheet';
      l.href = href;
      head.appendChild(l);
      injected.push(l);
    };
    addLink(
      'dh-font-gowun',
      'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap'
    );
    addLink(
      'dh-font-pretendard',
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css'
    );

    // 2) 스코프된 디자인 CSS 주입
    if (!document.getElementById('dh-portfolio-style')) {
      const style = document.createElement('style');
      style.id = 'dh-portfolio-style';
      style.textContent = PORTFOLIO_CSS;
      head.appendChild(style);
      injected.push(style);
    }

    // 3) body 배경/그레인 활성화 + 최상단으로
    document.body.classList.add('donghyun-portfolio-active');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    // 4) HERO 진입 애니메이션
    const hero = root.querySelector('.hero');
    let rafId = 0;
    rafId = requestAnimationFrame(() =>
      requestAnimationFrame(() => hero?.classList.add('loaded'))
    );

    // 5) 스크롤 리빌 (reveal → .in)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // 6) GIVE & TAKE 저울 기울임 (뷰 진입 시 1회)
    const beam = root.querySelector('#beamGroup') as SVGGElement | null;
    const scaleSvg = root.querySelector('#scaleSvg');
    let scaleIO: IntersectionObserver | null = null;
    if (beam && scaleSvg) {
      beam.style.setProperty('transform-box', 'view-box');
      beam.style.setProperty('transform-origin', '280px 66px');
      let done = false;
      scaleIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && !done) {
              done = true;
              beam.animate(
                [
                  { transform: 'rotate(0deg)' },
                  { transform: 'rotate(-7deg)', offset: 0.35 },
                  { transform: 'rotate(4deg)', offset: 0.68 },
                  { transform: 'rotate(0deg)' },
                ],
                { duration: 1800, easing: 'cubic-bezier(0.22,0.61,0.36,1)' }
              );
              scaleIO?.unobserve(e.target);
            }
          }
        },
        { threshold: 0.4 }
      );
      scaleIO.observe(scaleSvg);
    }

    // 7) 스크롤 진행바 + 타임라인 레일 채우기
    const progress = root.querySelector('#progress') as HTMLElement | null;
    const timeline = root.querySelector('.timeline') as HTMLElement | null;
    const railFill = root.querySelector('#railFill') as HTMLElement | null;
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (st / docH) * 100 : 0;
      if (progress) progress.style.width = `${pct}%`;
      if (timeline && railFill) {
        const r = timeline.getBoundingClientRect();
        const passed = Math.min(
          Math.max(window.innerHeight * 0.5 - r.top, 0),
          r.height
        );
        railFill.style.height = `${passed}px`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // 정리: 주입한 노드/리스너/상태 모두 제거 → 기존 사이트 원복
    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      scaleIO?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.body.classList.remove('donghyun-portfolio-active');
      injected.forEach((n) => n.remove());
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>제가 같이 일할래요! — 김동현</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div
        id="donghyun-portfolio"
        ref={rootRef}
        dangerouslySetInnerHTML={{ __html: PORTFOLIO_HTML }}
      />
    </>
  );
}

export default PortfolioPage;
