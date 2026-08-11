/* eslint-disable */
/**
 * 김동현 포트폴리오 — 원본 디자인 에셋 (CSS / HTML)
 *
 * 원본 단일 HTML(`제가 같이 일할래요.html`) + `styles.css`를 그대로 이식한 것입니다.
 * PortfolioPage.tsx가 마운트될 때만 이 CSS를 <head>에 주입하고,
 * 언마운트 시 제거하여 기존 사이트에 영향을 주지 않습니다.
 *
 * 변경점:
 * - 이미지 경로: uploads/한글명 → /portfolio/ASCII명 (packages/web/public/portfolio/)
 * - 이메일: Cloudflare 난독화 해제 → mailto:jlionk200@gmail.com
 * - Cloudflare email-decode 스크립트 제거
 */

export const PORTFOLIO_CSS = `
/* ============================================================
   제가 같이 일할래요! — 김동현 포트폴리오
   Editorial / cream / ivory · Korean-first
   ============================================================ */

@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap");

:root {
  /* paper */
  --paper:       #F3EEE3;
  --paper-deep:  #EBE4D5;
  --paper-card:  #FBF9F3;
  --paper-ink:   #211C16;   /* dark section */

  /* ink */
  --ink:   #211C16;
  --ink-2: #514a3e;
  --ink-3: #8c8475;
  --ink-on-dark: #F1ECE0;

  /* line */
  --line:      rgba(33,28,22,0.18);
  --line-soft: rgba(33,28,22,0.10);
  --line-dark: rgba(241,236,224,0.16);

  /* accent — restrained terracotta */
  --accent:    #A85A3C;
  --accent-2:  #C2856A;

  /* type */
  --serif: "Cormorant Garamond", "Gowun Batang", "Nanum Myeongjo", serif;
  --kr-serif: "Gowun Batang", "Nanum Myeongjo", "Cormorant Garamond", serif;
  --sans: "Pretendard", "Pretendard Variable", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

  --maxw: 1200px;
  --gutter: clamp(20px, 5vw, 72px);

  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

#donghyun-portfolio * { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

body.donghyun-portfolio-active {
  font-family: var(--sans);
  background: var(--paper);
  color: var(--ink);
  line-height: 1.6;
  word-break: keep-all;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

#donghyun-portfolio img { display: block; max-width: 100%; }

/* film-grain paper texture */
body.donghyun-portfolio-active::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9000;
  opacity: 0.04;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ============ scroll progress ============ */
#donghyun-portfolio #progress {
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  width: 0%;
  background: var(--accent);
  z-index: 9500;
  transition: width 80ms linear;
}

/* ============ layout helpers ============ */
#donghyun-portfolio .wrap {
  width: 100%;
  max-width: var(--maxw);
  margin: 0 auto;
  padding-left: var(--gutter);
  padding-right: var(--gutter);
}

#donghyun-portfolio section {
  position: relative;
  padding-block: clamp(90px, 13vh, 170px);
}

#donghyun-portfolio .eyebrow {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--ink-3);
}

#donghyun-portfolio .section-index {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: clamp(28px, 5vh, 54px);
}
#donghyun-portfolio .section-index .num {
  font-family: var(--serif);
  font-size: clamp(56px, 9vw, 116px);
  font-weight: 300;
  line-height: 0.8;
  font-feature-settings: "lnum" 1;
  color: var(--accent);
}
#donghyun-portfolio .section-index .meta { padding-bottom: 0; }
#donghyun-portfolio .section-index .meta .label {
  font-family: var(--kr-serif);
  font-size: clamp(24px, 3.6vw, 44px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
#donghyun-portfolio .section-index .meta .en {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-3);
}

#donghyun-portfolio .lead {
  font-family: var(--kr-serif);
  font-weight: 400;
  font-size: clamp(20px, 2.6vw, 30px);
  line-height: 1.55;
  letter-spacing: -0.01em;
  color: var(--ink);
  max-width: none;
  text-wrap: pretty;
  white-space: pre-line;
}

#donghyun-portfolio .body-col p {
  font-size: clamp(15px, 1.15vw, 17px);
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 60ch;
}
#donghyun-portfolio .body-col p + p { margin-top: 1.1em; }

#donghyun-portfolio .hr {
  height: 1px;
  background: var(--line-soft);
  border: 0;
}

/* ============ reveal animation ============ */
#donghyun-portfolio .reveal {
  opacity: 0;
  transform: translateY(34px);
  transition: opacity 1s var(--ease-out), transform 1s var(--ease-out);
  transition-delay: var(--d, 0ms);
  will-change: opacity, transform;
}
#donghyun-portfolio .reveal.in { opacity: 1; transform: none; }

#donghyun-portfolio .reveal-up { transform: translateY(46px); }
#donghyun-portfolio .reveal-left { transform: translateX(-40px); }
#donghyun-portfolio .reveal-right { transform: translateX(40px); }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  #donghyun-portfolio .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  #donghyun-portfolio .hero-line span { transform: none !important; opacity: 1 !important; }
}

/* ============================================================
   HERO
   ============================================================ */
#donghyun-portfolio .hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-block: clamp(28px, 5vh, 48px);
  overflow: hidden;
}

#donghyun-portfolio .hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
#donghyun-portfolio .hero-top .id-block { text-align: right; }
#donghyun-portfolio .hero-top .id-block .nm {
  font-family: var(--kr-serif);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
#donghyun-portfolio .hero-top .id-block .nm-en {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--ink-3);
  text-transform: uppercase;
  margin-top: 3px;
}

#donghyun-portfolio .hero-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

#donghyun-portfolio .hero-arc {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -54%);
  width: min(86vw, 880px);
  height: min(86vw, 880px);
  pointer-events: none;
  z-index: 0;
}
#donghyun-portfolio .hero-arc svg { width: 100%; height: 100%; overflow: visible; }
#donghyun-portfolio .hero-arc circle, #donghyun-portfolio .hero-arc path {
  fill: none;
  stroke: var(--line);
  stroke-width: 1;
}

#donghyun-portfolio .hero-eyebrow {
  position: relative; z-index: 2;
  margin-bottom: clamp(20px, 4vh, 40px);
  letter-spacing: 0.5em;
}

#donghyun-portfolio .hero-headline {
  position: relative; z-index: 2;
  font-family: var(--kr-serif);
  font-weight: 700;
  font-size: clamp(44px, 11vw, 158px);
  line-height: 1.06;
  letter-spacing: -0.02em;
  text-wrap: nowrap;
}
#donghyun-portfolio .hero-headline .hero-line { display: block; }
#donghyun-portfolio .hero-headline .hero-line span {
  display: inline-block;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(46px);
  transition: transform 1.1s var(--ease-out), opacity 1.1s var(--ease-out);
  transition-delay: var(--d, 0ms);
}
#donghyun-portfolio .hero.loaded .hero-headline .hero-line span { transform: none; opacity: 1; }
#donghyun-portfolio .hero-headline .mark { color: var(--accent); }

#donghyun-portfolio .hero-sub {
  position: relative; z-index: 2;
  margin-top: clamp(22px, 4vh, 40px);
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(16px, 2.1vw, 25px);
  font-weight: 400;
  color: var(--ink-2);
  text-wrap: balance;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1s var(--ease-out) 0.7s, transform 1s var(--ease-out) 0.7s;
}
#donghyun-portfolio .hero.loaded .hero-sub { opacity: 1; transform: none; }

#donghyun-portfolio .hero-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  opacity: 0;
  transition: opacity 1s ease 1s;
}
#donghyun-portfolio .hero.loaded .hero-bottom { opacity: 1; }
#donghyun-portfolio .scroll-cue {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-3);
}
#donghyun-portfolio .scroll-cue .ln {
  width: 56px; height: 1px;
  background: var(--ink-3);
  transform-origin: left;
  animation: dh-cue 2.4s var(--ease) infinite;
}
@keyframes dh-cue {
  0%, 100% { transform: scaleX(0.4); opacity: 0.4; }
  50% { transform: scaleX(1); opacity: 1; }
}

/* ============================================================
   INTRO + INDEX
   ============================================================ */
#donghyun-portfolio .intro { background: var(--paper); }
#donghyun-portfolio .intro-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(40px, 7vw, 110px);
  align-items: start;
}
#donghyun-portfolio .intro-lead {
  font-family: var(--kr-serif);
  font-weight: 400;
  font-size: clamp(22px, 2.9vw, 37px);
  line-height: 1.5;
  letter-spacing: -0.015em;
  text-wrap: pretty;
}
#donghyun-portfolio .intro-lead .em { color: var(--accent); font-weight: 700; }
#donghyun-portfolio .intro-body p {
  font-size: clamp(15px, 1.05vw, 16.5px);
  line-height: 1.9;
  color: var(--ink-2);
}
#donghyun-portfolio .intro-body p + p { margin-top: 1.1em; }

#donghyun-portfolio .kw-index {
  margin-top: clamp(54px, 8vh, 96px);
  border-top: 1px solid var(--line);
}
#donghyun-portfolio .kw-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(18px, 4vw, 48px);
  padding: clamp(20px, 3.2vh, 34px) 4px;
  border-bottom: 1px solid var(--line);
  text-decoration: none;
  color: var(--ink);
  position: relative;
  transition: padding-left 0.5s var(--ease-out), color 0.4s ease;
}
#donghyun-portfolio .kw-row .kw-num {
  font-family: var(--serif);
  font-size: clamp(20px, 2vw, 26px);
  font-weight: 400;
  color: var(--ink-3);
  font-feature-settings: "lnum" 1;
  transition: color 0.4s ease;
}
#donghyun-portfolio .kw-row .kw-title {
  font-family: var(--kr-serif);
  font-size: clamp(22px, 3.4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
#donghyun-portfolio .kw-row .kw-arrow {
  font-size: clamp(20px, 2.4vw, 30px);
  color: var(--ink-3);
  transform: translateX(-8px);
  opacity: 0;
  transition: transform 0.5s var(--ease-out), opacity 0.4s ease;
}
#donghyun-portfolio .kw-row::after {
  content: "";
  position: absolute;
  left: 0; bottom: -1px;
  height: 1px; width: 0;
  background: var(--accent);
  transition: width 0.55s var(--ease-out);
}
#donghyun-portfolio .kw-row:hover { padding-left: 20px; color: var(--accent); }
#donghyun-portfolio .kw-row:hover .kw-num { color: var(--accent); }
#donghyun-portfolio .kw-row:hover .kw-arrow { transform: none; opacity: 1; }
#donghyun-portfolio .kw-row:hover::after { width: 100%; }

/* ============================================================
   SECTION 01 — pillars
   ============================================================ */
#donghyun-portfolio .s01 { background: var(--paper-deep); }
#donghyun-portfolio .pillars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(24px, 4vw, 56px);
  margin-top: clamp(40px, 6vh, 72px);
}
#donghyun-portfolio .pillar { position: relative; padding-top: 26px; }
#donghyun-portfolio .pillar .p-mark {
  position: absolute; top: 0; left: 0;
  width: 46px; height: 1px;
  background: var(--accent);
}
#donghyun-portfolio .pillar h3 {
  font-family: var(--kr-serif);
  font-size: clamp(21px, 2.3vw, 28px);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
#donghyun-portfolio .pillar .p-en {
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 16px;
}
#donghyun-portfolio .pillar p {
  font-size: 15.5px;
  line-height: 1.8;
  color: var(--ink-2);
}
#donghyun-portfolio .s01-foot {
  margin-top: clamp(48px, 7vh, 86px);
  padding-top: clamp(28px, 4vh, 44px);
  border-top: 1px solid var(--line);
}
#donghyun-portfolio .s01-foot .q {
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(19px, 2.6vw, 32px);
  line-height: 1.45;
  color: var(--ink);
  max-width: 52ch;
  text-wrap: balance;
}
#donghyun-portfolio .kr-italic { font-family: var(--kr-serif); font-style: normal; }

/* ============================================================
   SECTION 02 — timeline
   ============================================================ */
#donghyun-portfolio .s02 { background: var(--paper); }
#donghyun-portfolio .timeline {
  margin-top: clamp(44px, 6vh, 80px);
  position: relative;
  padding-left: clamp(26px, 5vw, 70px);
}
/* rail */
#donghyun-portfolio .timeline::before {
  content: "";
  position: absolute;
  left: clamp(6px, 1.4vw, 16px);
  top: 6px; bottom: 6px;
  width: 1px;
  background: var(--line);
}
#donghyun-portfolio .timeline .rail-fill {
  position: absolute;
  left: clamp(6px, 1.4vw, 16px);
  top: 6px;
  width: 1px;
  height: 0;
  background: var(--accent);
  transition: height 0.2s linear;
}
#donghyun-portfolio .tl-item {
  position: relative;
  padding-block: clamp(26px, 4vh, 46px);
}
#donghyun-portfolio .tl-item::before { /* node */
  content: "";
  position: absolute;
  left: calc(clamp(6px, 1.4vw, 16px) - clamp(26px, 5vw, 70px) + 0px);
  top: clamp(32px, 4.6vh, 52px);
  width: 9px; height: 9px;
  margin-left: -4px;
  border-radius: 50%;
  background: var(--paper);
  border: 1.5px solid var(--ink-3);
  transition: background 0.4s ease, border-color 0.4s ease, transform 0.4s var(--ease-out);
}
#donghyun-portfolio .tl-item.in::before { background: var(--accent); border-color: var(--accent); transform: scale(1.15); }

#donghyun-portfolio .tl-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
#donghyun-portfolio .tl-year {
  font-family: var(--serif);
  font-size: clamp(15px, 1.5vw, 19px);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--accent);
  font-feature-settings: "lnum" 1;
  white-space: nowrap;
  flex-shrink: 0;
}
#donghyun-portfolio .tl-tag {
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-3);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 11px;
  white-space: nowrap;
  flex-shrink: 0;
}
#donghyun-portfolio .tl-title {
  font-family: var(--kr-serif);
  font-size: clamp(22px, 2.8vw, 34px);
  font-weight: 700;
  letter-spacing: -0.012em;
  line-height: 1.18;
  margin-bottom: 10px;
}
#donghyun-portfolio .tl-desc {
  font-size: 15.5px;
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 680px;
}
#donghyun-portfolio .tl-desc .hl { color: var(--ink); font-weight: 600; box-shadow: inset 0 -0.5em 0 rgba(168,90,60,0.12); }

#donghyun-portfolio .tl-media {
  margin-top: 22px;
  display: flex;
  gap: clamp(14px, 2vw, 26px);
  flex-wrap: wrap;
  align-items: center;
}
#donghyun-portfolio .media-logo {
  background: #FFFFFF;
  border: 1px solid var(--line);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 34px;
  box-shadow: 0 14px 34px -22px rgba(33,28,22,0.5);
}
#donghyun-portfolio .media-logo img { mix-blend-mode: multiply; }

#donghyun-portfolio .media-frame {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 14px 34px -22px rgba(33,28,22,0.5);
}
#donghyun-portfolio .media-frame img { border-radius: 2px; }
#donghyun-portfolio .media-cap {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  text-align: center;
}
#donghyun-portfolio .media-cell { display: flex; flex-direction: column; align-items: center; }

#donghyun-portfolio .icon-tile {
  width: clamp(96px, 12vw, 128px);
  height: clamp(96px, 12vw, 128px);
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 18px 40px -18px rgba(0,0,0,0.55);
}
#donghyun-portfolio .icon-tile img { width: 100%; height: 100%; object-fit: cover; }

#donghyun-portfolio .tl-foot {
  margin-top: clamp(30px, 4vh, 50px);
  padding-left: 0;
}
#donghyun-portfolio .tl-foot .credo {
  font-family: var(--kr-serif);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
#donghyun-portfolio .tl-foot .credo .slash { color: var(--accent); font-family: var(--serif); font-weight: 400; margin: 0 6px; }

/* ============================================================
   SECTION 03 — help / 4 questions (dark)
   ============================================================ */
#donghyun-portfolio .s03 { background: var(--paper-ink); color: var(--ink-on-dark); }
#donghyun-portfolio .s03 .section-index .num { color: var(--accent-2); }
#donghyun-portfolio .s03 .section-index .meta .en { color: rgba(241,236,224,0.5); }
#donghyun-portfolio .s03 .eyebrow { color: rgba(241,236,224,0.55); }

#donghyun-portfolio .pullquote {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(26px, 4.6vw, 60px);
  line-height: 1.32;
  letter-spacing: -0.01em;
  text-wrap: balance;
  max-width: 760px;
  margin: clamp(20px, 4vh, 44px) 0 clamp(34px, 5vh, 60px);
}
#donghyun-portfolio .pullquote .kr { font-family: var(--kr-serif); font-style: normal; }
#donghyun-portfolio .s03-intro {
  font-size: clamp(15px, 1.1vw, 17px);
  line-height: 1.9;
  color: rgba(241,236,224,0.74);
  max-width: 62ch;
}
#donghyun-portfolio .s03-intro + .s03-intro { margin-top: 1.1em; }

#donghyun-portfolio .q-grid {
  margin-top: clamp(46px, 7vh, 86px);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--line-dark);
  border: 1px solid var(--line-dark);
}
#donghyun-portfolio .q-card {
  background: var(--paper-ink);
  padding: clamp(28px, 4vw, 48px);
  min-height: clamp(180px, 22vh, 250px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: background 0.45s var(--ease);
}
#donghyun-portfolio .q-card .q-rn {
  font-family: var(--serif);
  font-size: clamp(15px, 1.4vw, 18px);
  letter-spacing: 0.18em;
  color: var(--accent-2);
  text-transform: uppercase;
}
#donghyun-portfolio .q-card .q-text {
  font-family: var(--kr-serif);
  font-size: clamp(19px, 2.2vw, 27px);
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--ink-on-dark);
  text-wrap: balance;
}
#donghyun-portfolio .q-card::after {
  content: "";
  position: absolute;
  left: 0; bottom: 0;
  width: 100%; height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s var(--ease-out);
}
#donghyun-portfolio .q-card:hover { background: #2a241c; }
#donghyun-portfolio .q-card:hover::after { transform: scaleX(1); }

#donghyun-portfolio .s03-foot {
  margin-top: clamp(40px, 6vh, 72px);
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(18px, 2.4vw, 28px);
  line-height: 1.5;
  color: rgba(241,236,224,0.9);
  max-width: 34ch;
  text-wrap: balance;
}
#donghyun-portfolio .s03-foot .kr { font-family: var(--kr-serif); font-style: normal; }

/* ============================================================
   SECTION 04 — give & take / scale
   ============================================================ */
#donghyun-portfolio .s04 { background: var(--paper); }
#donghyun-portfolio .s04-intro {
  max-width: 60ch;
  margin-top: clamp(20px, 3vh, 36px);
}
#donghyun-portfolio .s04-intro p { font-size: clamp(15px, 1.1vw, 17px); line-height: 1.9; color: var(--ink-2); }
#donghyun-portfolio .s04-intro p + p { margin-top: 1.1em; }
#donghyun-portfolio .s04-intro .seed {
  font-family: var(--kr-serif);
  font-size: clamp(18px, 2.2vw, 24px);
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
}

#donghyun-portfolio .scale-wrap {
  margin-top: clamp(50px, 8vh, 96px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 34px;
  align-items: center;
}
#donghyun-portfolio .scale-svg-box { display: flex; justify-content: center; }
#donghyun-portfolio .scale-svg { width: min(560px, 92%); height: auto; overflow: visible; }
#donghyun-portfolio .scale-svg .beam-group { transform-box: fill-box; transform-origin: center; }

#donghyun-portfolio .gt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(20px, 3vw, 40px);
}
#donghyun-portfolio .gt-col { padding-top: 22px; border-top: 2px solid var(--ink); }
#donghyun-portfolio .gt-col.take { border-top-color: var(--accent); }
#donghyun-portfolio .gt-col .gt-key {
  display: flex; align-items: baseline; gap: 12px;
  margin-bottom: 18px;
}
#donghyun-portfolio .gt-col .gt-key .lbl {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 50px);
  font-weight: 400;
  letter-spacing: 0.02em;
}
#donghyun-portfolio .gt-col.take .gt-key .lbl { color: var(--accent); }
#donghyun-portfolio .gt-col .gt-key .ko {
  font-family: var(--kr-serif);
  font-size: clamp(14px, 1.4vw, 17px);
  font-weight: 700;
  color: var(--ink-2);
}
#donghyun-portfolio .gt-list { list-style: none; }
#donghyun-portfolio .gt-list li {
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--ink-2);
  padding: 11px 0 11px 22px;
  border-bottom: 1px solid var(--line-soft);
  position: relative;
}
#donghyun-portfolio .gt-list li::before {
  content: "";
  position: absolute; left: 0; top: 19px;
  width: 8px; height: 1px; background: var(--ink-3);
}
#donghyun-portfolio .gt-col.take .gt-list li::before { background: var(--accent); }

#donghyun-portfolio .s04-foot {
  margin-top: clamp(44px, 6vh, 76px);
  padding-top: clamp(26px, 4vh, 40px);
  border-top: 1px solid var(--line);
  font-family: var(--kr-serif);
  font-size: clamp(19px, 2.5vw, 30px);
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: -0.01em;
  text-wrap: balance;
  max-width: 620px;
}

/* ============================================================
   CLOSING
   ============================================================ */
#donghyun-portfolio .closing { background: var(--paper-ink); color: var(--ink-on-dark); padding-bottom: clamp(60px, 9vh, 110px); }
#donghyun-portfolio .closing .eyebrow { color: rgba(241,236,224,0.5); }
#donghyun-portfolio .closing-pre {
  font-family: var(--kr-serif);
  font-size: clamp(18px, 2.3vw, 26px);
  line-height: 1.7;
  color: rgba(241,236,224,0.82);
  max-width: 40ch;
  margin: clamp(20px, 3vh, 36px) 0 clamp(28px, 4vh, 48px);
  text-wrap: pretty;
}
#donghyun-portfolio .wish-list { list-style: none; margin-bottom: clamp(48px, 8vh, 96px); }
#donghyun-portfolio .wish-list li {
  font-family: var(--kr-serif);
  font-size: clamp(19px, 2.7vw, 34px);
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: rgba(241,236,224,0.6);
  padding: clamp(14px, 2vh, 22px) 0;
  border-bottom: 1px solid var(--line-dark);
  transition: color 0.5s var(--ease), padding-left 0.5s var(--ease-out);
}
#donghyun-portfolio .wish-list li .n {
  font-family: var(--serif);
  font-size: 0.5em;
  color: var(--accent-2);
  margin-right: 16px;
  vertical-align: middle;
}
#donghyun-portfolio .wish-list li.in { color: var(--ink-on-dark); }

#donghyun-portfolio .final-headline {
  font-family: var(--kr-serif);
  font-weight: 700;
  font-size: clamp(46px, 12.5vw, 190px);
  line-height: 1.04;
  white-space: nowrap;
  letter-spacing: -0.025em;
  text-align: center;
  text-wrap: balance;
  margin-bottom: clamp(40px, 6vh, 72px);
}
#donghyun-portfolio .final-headline .mark { color: var(--accent-2); }

#donghyun-portfolio .contact-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: clamp(36px, 5vh, 60px);
}
#donghyun-portfolio .btn {
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
  padding: 15px 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.4s var(--ease-out), background 0.3s ease, color 0.3s ease;
}
#donghyun-portfolio .btn.primary { background: var(--ink-on-dark); color: var(--paper-ink); }
#donghyun-portfolio .btn.primary:hover { background: var(--accent-2); color: #fff; transform: translateY(-3px); }
#donghyun-portfolio .btn.ghost { border: 1px solid var(--line-dark); color: var(--ink-on-dark); }
#donghyun-portfolio .btn.ghost:hover { border-color: var(--accent-2); color: var(--accent-2); transform: translateY(-3px); }
#donghyun-portfolio .btn .ic { width: 17px; height: 17px; stroke: currentColor; fill: none; stroke-width: 1.6; }

#donghyun-portfolio .ig-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 28px;
  margin-bottom: clamp(48px, 7vh, 86px);
}
#donghyun-portfolio .ig-row a {
  text-decoration: none;
  color: rgba(241,236,224,0.62);
  font-size: 13.5px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: color 0.3s ease;
}
#donghyun-portfolio .ig-row a .handle { font-weight: 600; color: var(--ink-on-dark); }
#donghyun-portfolio .ig-row a .role { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(241,236,224,0.42); }
#donghyun-portfolio .ig-row a:hover .handle { color: var(--accent-2); }

#donghyun-portfolio .closing-foot {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(241,236,224,0.38);
  padding-top: clamp(28px, 4vh, 44px);
  border-top: 1px solid var(--line-dark);
}

/* ── Free line-breaks: no width caps + honor Enter line breaks everywhere ── */
#donghyun-portfolio .intro-lead, #donghyun-portfolio .intro-body p, #donghyun-portfolio .body-col p, #donghyun-portfolio .pillar p,
#donghyun-portfolio .s01-foot .q, #donghyun-portfolio .tl-desc, #donghyun-portfolio .tl-foot .credo,
#donghyun-portfolio .pullquote, #donghyun-portfolio .s03-intro, #donghyun-portfolio .s03-foot,
#donghyun-portfolio .s04-intro p, #donghyun-portfolio .s04-intro .seed, #donghyun-portfolio .s04-foot,
#donghyun-portfolio .closing-pre {
  max-width: none;
}
#donghyun-portfolio .intro-lead, #donghyun-portfolio .intro-body p, #donghyun-portfolio .body-col p, #donghyun-portfolio .pillar p,
#donghyun-portfolio .s01-foot .q, #donghyun-portfolio .tl-desc, #donghyun-portfolio .tl-foot .credo,
#donghyun-portfolio .s03-intro, #donghyun-portfolio .s03-foot,
#donghyun-portfolio .s04-intro p, #donghyun-portfolio .s04-intro .seed, #donghyun-portfolio .s04-foot,
#donghyun-portfolio .closing-pre {
  white-space: pre-line;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 860px) {
  #donghyun-portfolio .intro-grid { grid-template-columns: 1fr; gap: 40px; }
  #donghyun-portfolio .pillars { grid-template-columns: 1fr; gap: 38px; }
  #donghyun-portfolio .q-grid { grid-template-columns: 1fr; }
  #donghyun-portfolio .gt-grid { grid-template-columns: 1fr; gap: 30px; }
  #donghyun-portfolio .hero-top .id-block { display: none; }
}
@media (max-width: 560px) {
  #donghyun-portfolio .tl-media { gap: 14px; }
  #donghyun-portfolio .contact-bar { flex-direction: column; align-items: stretch; }
  #donghyun-portfolio .btn { justify-content: center; }
}
`;

export const PORTFOLIO_HTML = `
<div id="progress"></div>

<!-- ============================ HERO ============================ -->
<header class="hero wrap" id="hero" data-screen-label="Hero">
  <div class="hero-top">
    <div class="eyebrow">PORTFOLIO</div>
    <div class="id-block">
      <div class="nm">김동현</div>
      <div class="nm-en">Kim Dong Hyun</div>
    </div>
  </div>

  <div class="hero-center">
    <div class="hero-arc" aria-hidden="true">
      <svg viewBox="0 0 880 880">
        <circle cx="440" cy="440" r="300"></circle>
        <circle cx="440" cy="440" r="380"></circle>
        <path d="M120 540 A 320 320 0 0 1 760 540"></path>
      </svg>
    </div>
    <div class="hero-eyebrow eyebrow">Let's work together</div>
    <h1 class="hero-headline">
      <span class="hero-line"><span style="--d:120ms">제가 같이</span></span>
      <span class="hero-line"><span style="--d:260ms">일할래요<span class="mark">!</span></span></span>
    </h1>
    <p class="hero-sub">좋아하는 일을 현실로 만들어 온 사람</p>
  </div>

  <div class="hero-bottom">
    <div class="scroll-cue"><span class="ln"></span>Scroll</div>
    <div class="eyebrow">드로우앤드류 PD 지원</div>
  </div>
</header>

<!-- ============================ INTRO ============================ -->
<section class="intro wrap" data-screen-label="Intro">
  <div class="intro-grid">
    <div>
      <p class="intro-lead reveal">안녕하세요. 김동현입니다.
저는 지난 시간 동안 좋아하는 일을 현실로 만들기 위해
<span class="em">정말 밀도 있게</span> 살아왔습니다.</p>
    </div>
    <div class="intro-body">
      <p class="reveal" style="--d:80ms">생명공학과 스페인어를 이중전공했고, 드라마 시나리오 작가를 준비하며 각본을 썼으며, 마케팅 회사에서 근무했었었습니다.
그리고 2024년부터는 네일아트 브랜드 MAMMON과 네일아트 플랫폼·디자인툴, 입문자용 DAW 앱을 직접 기획하고 만들어왔습니다.</p>
      <p class="reveal" style="--d:160ms">이번 드로우앤드류 PD 채용 공고를 보고, 단순히 지원하고 싶은 것이 아니라 '정말 함께 일해보고 싶다'는 생각이 들었습니다. 제가 왜 함께 일하고 싶은 사람인지, 그리고 왜 이 채널에 도움이 될 수 있는지<br>네 가지 키워드로 정리했습니다.</p>
    </div>
  </div>

  <nav class="kw-index reveal" style="--d:120ms">
    <a class="kw-row" href="#s01">
      <span class="kw-num">01</span>
      <span class="kw-title">함께하기 좋은 사람</span>
      <span class="kw-arrow">→</span>
    </a>
    <a class="kw-row" href="#s02">
      <span class="kw-num">02</span>
      <span class="kw-title">배우고 행동하고 책임지는</span>
      <span class="kw-arrow">→</span>
    </a>
    <a class="kw-row" href="#s03">
      <span class="kw-num">03</span>
      <span class="kw-title">도움을 줄 수 있는</span>
      <span class="kw-arrow">→</span>
    </a>
    <a class="kw-row" href="#s04">
      <span class="kw-num">04</span>
      <span class="kw-title">함께 버티고 성장하는</span>
      <span class="kw-arrow">→</span>
    </a>
  </nav>
</section>

<!-- ============================ 01 ============================ -->
<section class="s01 wrap" id="s01" data-screen-label="01 함께하기 좋은 사람">
  <div class="section-index reveal">
    <span class="num">01</span>
    <span class="meta">
      <span class="label" style="font-weight: 700; text-align: left">저는 함께하기<br>좋은 사람입니다</span>
      <span class="en">Good to work with</span>
    </span>
  </div>

  <p class="lead reveal" style="--d:80ms">함께 일한다는 것은
단순히 업무 능력만으로 되는 일이 아니라고 생각합니다.</p>

  <div class="pillars">
    <div class="pillar reveal" style="--d:120ms">
      <span class="p-mark"></span>
      <h3>듣고, 대화합니다</h3>
      <div class="p-en">Listen</div>
      <p>상대의 말을 잘 듣고, 필요한 순간에는 진지하게 대화합니다. 매너 있게 대화하고, 상대를 배려하려 노력합니다.</p>
    </div>
    <div class="pillar reveal" style="--d:220ms">
      <span class="p-mark"></span>
      <h3>유머로 공간을 만듭니다</h3>
      <div class="p-en">Humor</div>
      <p>적당한 유머로 분위기에 공간을 만들고, 서로의 시간을 존중하며 움직입니다. 대화와 소통에 자신이 있습니다.</p>
    </div>
    <div class="pillar reveal" style="--d:320ms">
      <span class="p-mark"></span>
      <h3>솔직하게 말합니다</h3>
      <div class="p-en">Honesty</div>
      <p>필요한 상황에서는 솔직하게 의견을 말할 줄 압니다. 태도와 소양이 함께 일하는 데 가장 중요하다고 믿습니다.</p>
    </div>
  </div>

  <div class="s01-foot reveal">
    <p class="q" style="text-align: left">콘텐츠를 만드는 일은 결국 사람을 이해하는 일입니다.
면접의 기회를 주신다면,
지금 하는 말을 증명해 보이겠습니다.</p>
  </div>
</section>

<!-- ============================ 02 ============================ -->
<section class="s02 wrap" id="s02" data-screen-label="02 타임라인">
  <div class="section-index reveal">
    <span class="num">02</span>
    <span class="meta">
      <span class="label">배우고, 행동하고,<br>책임집니다</span>
      <span class="en">A life of learning &amp; doing</span>
    </span>
  </div>

  <p class="lead reveal" style="--d:80ms">완벽하게 준비된 상태로 시작한 적은 많지 않습니다.
대신 빠르게 배우고, 바로 실행하고,
부족한 부분을 보완하며 움직였습니다.</p>

  <div class="timeline">
    <div class="rail-fill" id="railFill"></div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">~ 2023</span>
        <span class="tl-tag">Foundation</span>
      </div>
      <h3 class="tl-title">생명공학 · 스페인어 이중전공</h3>
      <p class="tl-desc">대학교 4학년, 졸업을 준비하며 드라마 시나리오 작가를 꿈꿨고 직접 각본을 썼습니다.
두 개의 전공과 한 편의 이야기 — 서로 다른 언어를 오가는 법을 배운 시간이었습니다.</p>
    </div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">2023</span>
        <span class="tl-tag">First deal</span>
      </div>
      <h3 class="tl-title">마케팅 에이전시 근무</h3>
      <p class="tl-desc">짧게 근무했지만 <span class="hl">첫 계약</span>까지 직접 만들어냈습니다.<br>그 경험을 통해 '내가 원하는 일을 직접 만들어보고 싶다'는 생각을 하게 되었습니다.</p>
    </div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">2024</span>
        <span class="tl-tag">Brand</span>
      </div>
      <h3 class="tl-title">네일아트 브랜드 MAMMON</h3>
      <p class="tl-desc">아르바이트로 만난 동료와 함께 브랜드를 시작했습니다.
처음부터 다 알고 시작한 건 아니었지만
기획·고객 소통·마케팅·콘텐츠·판매·운영을 하나씩 배우며 움직였습니다.</p>
      <div class="tl-media">
        <div class="media-cell">
          <div class="media-frame">
            <img src="/portfolio/mammon.jpeg" alt="MAMMON 브랜드 로고" width="220" height="220" loading="lazy">
          </div>
          <div class="media-cap">MAMMON — Fulfill your desire</div>
        </div>
      </div>
    </div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">2025 초</span>
        <span class="tl-tag">Result</span>
      </div>
      <h3 class="tl-title">VVS 아이돌 컴백 MV 네일아트 계약</h3>
      <p class="tl-desc">아이돌 브랜드 VVS의 컴백 뮤직비디오 네일아트 제작 계약을 진행했습니다.<br><span class="hl">내가 심은 씨앗이 실제 결과로 이어질 수 있다는 것</span>을 처음으로 크게 체감한 순간이었습니다.</p>
    </div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">2025</span>
        <span class="tl-tag">Build · 3 months</span>
      </div>
      <h3 class="tl-title">네일아트 플랫폼 &amp; 디자인툴 — Handy</h3>
      <p class="tl-desc">고등학교 동창과 2인 개발팀으로 만들었습니다.
개발자 출신은 아니지만 어깨너머로 배우고 독학하며 기획·코딩·런칭·마케팅 방향까지 함께 만들었고,
디자인툴은 약 3개월 만에 런칭했습니다.</p>
      <div class="tl-media">
        <div class="media-cell">
          <div class="media-logo">
            <img src="/portfolio/handy-wordmark.png" alt="HANDY 워드마크" width="300" loading="lazy">
          </div>
        </div>
        <div class="media-cell">
          <div class="media-frame">
            <img src="/portfolio/handy-mood.png" alt="HANDY 브랜드 무드" width="200" height="250" loading="lazy">
          </div>
          <div class="media-cap">
</div>
        </div>
      </div>
    </div>

    <div class="tl-item reveal">
      <div class="tl-head">
        <span class="tl-year">2025</span>
        <span class="tl-tag">In review</span>
      </div>
      <h3 class="tl-title">입문자용 DAW 앱</h3>
      <p class="tl-desc">사회인 밴드의 리더로 활동하며 느낀 음악의 진입장벽을 풀고 싶었습니다.
악기를 다루지 못해도 쉽게 음악을 만드는 앱을 약 3주 만에 개발해 현재 심사 대기 중입니다.</p>
      <div class="tl-media">
        <div class="media-cell">
          <div class="icon-tile">
            <img src="/portfolio/daw-icon.png" alt="DAW 앱 아이콘" width="128" height="128" loading="lazy">
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="tl-foot reveal">
    <p class="credo">모르면 배우고<span class="slash">/</span>필요하면 움직이고<span class="slash">/</span>부족하면 다시 고칩니다.</p>
  </div>
</section>

<!-- ============================ 03 ============================ -->
<section class="s03 wrap" id="s03" data-screen-label="03 도움을 줄 수 있습니다">
  <div class="section-index reveal">
    <span class="num">03</span>
    <span class="meta">
      <span class="label">당신에게 도움을<br>줄 수 있습니다</span>
      <span class="en">What I can bring</span>
    </span>
  </div>

  <blockquote class="pullquote reveal" style="--d:60ms; letter-spacing: 0px;">
    <span class="kr">"상대가 원하는 것을 정확히 파악하고, 그것을 알맞은 형태로 제공하는 것."</span>
  </blockquote>

  <p class="s03-intro reveal" style="--d:120ms">브랜드를 운영할 때도, 서비스를 만들 때도, 콘텐츠를 준비할 때도 핵심은 같았습니다. 이 사람이 지금 무엇을 원하는지, 무엇이 불편한지,
어떤 언어로 전달해야 움직이는지를 파악하는 것.</p>
  <p class="s03-intro reveal" style="--d:180ms">저는 드로우앤드류 채널도 하나의 소중한 사업이라고 생각합니다. 그래서 함께하게 된다면 단순히 주어진 일을 처리하는 사람이 아니라,
이렇게 함께 고민하는 사람이 되고 싶습니다.</p>

  <div class="q-grid">
    <div class="q-card reveal">
      <span class="q-rn">i</span>
      <span class="q-text">"이 콘텐츠에서 지금 필요한 것은 무엇인지"</span>
    </div>
    <div class="q-card reveal" style="--d:90ms">
      <span class="q-rn">ii</span>
      <span class="q-text">"시청자는 어떤 지점에서 공감할지"</span>
    </div>
    <div class="q-card reveal" style="--d:180ms">
      <span class="q-rn">iii</span>
      <span class="q-text">"어떻게 하면 더 잘 전달될지"</span>
    </div>
    <div class="q-card reveal" style="--d:270ms">
      <span class="q-rn">iv</span>
      <span class="q-text">"어떤 방식으로 일하면 더 효율적일지"</span>
    </div>
  </div>

  <p class="s03-foot reveal">저는 이 채널의 메시지를 콘텐츠로만 이해하지 않습니다. <span class="kr">그 메시지를 실제로 살아오고 있는 사람입니다.</span></p>
</section>

<!-- ============================ 04 ============================ -->
<section class="s04 wrap" id="s04" data-screen-label="04 기브 앤 테이크">
  <div class="section-index reveal">
    <span class="num">04</span>
    <span class="meta">
      <span class="label">함께 버티고,<br>함께 성장하고 싶습니다</span>
      <span class="en">A good give &amp; take</span>
    </span>
  </div>

  <div class="s04-intro reveal" style="--d:60ms">
    <p>솔직하게 말씀드리면, 저는 아직 제 사업만으로 풍족한 수익을 만들고 있지는 못합니다.<br>하지만 지난 시간을 통해 하나를 배웠습니다.</p>
    <p class="seed">"사업은 씨앗을 심고, 결과가 꽃피기까지 기다리고 버티는 시간이 필요하다."</p>
    <p>방향이 맞고, 계속 개선하고, 사람들에게 닿는 시간이 쌓이면 결과는 나옵니다. 다만 그 시간이 오기까지 현실적으로 버틸 수 있는 힘이 필요합니다.<br>저는 이 관계가 좋은 기브 앤 테이크가 될 수 있다고 믿습니다.</p>
  </div>

  <div class="scale-wrap reveal" style="--d:100ms">
    <div class="scale-svg-box">
      <svg class="scale-svg" id="scaleSvg" viewBox="0 0 560 300" style="height: 300px;" aria-label="기브 앤 테이크 저울">
        <!-- base -->
        <line x1="280" y1="270" x2="280" y2="70" stroke="#211C16" stroke-width="2.5"/>
        <path d="M250 272 Q280 256 310 272 Z" fill="none" stroke="#211C16" stroke-width="2.5"/>
        <circle cx="280" cy="66" r="6" fill="#A85A3C"/>
        <!-- beam + pans (animated) -->
        <g class="beam-group" id="beamGroup">
          <line x1="80" y1="66" x2="480" y2="66" stroke="#211C16" stroke-width="2.5"/>
          <!-- left strings + pan -->
          <line x1="80" y1="66" x2="80" y2="150" stroke="#211C16" stroke-width="1"/>
          <path d="M40 150 Q80 196 120 150" fill="none" stroke="#211C16" stroke-width="2.5"/>
          <text x="80" y="226" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="22" fill="#211C16">GIVE</text>
          <!-- right strings + pan -->
          <line x1="480" y1="66" x2="480" y2="150" stroke="#A85A3C" stroke-width="1"/>
          <path d="M440 150 Q480 196 520 150" fill="none" stroke="#A85A3C" stroke-width="2.5"/>
          <text x="480" y="226" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="22" fill="#A85A3C">TAKE</text>
        </g>
      </svg>
    </div>

    <div class="gt-grid">
      <div class="gt-col give reveal" style="--d:140ms">
        <div class="gt-key"><span class="lbl">Give</span><span class="ko">제가 드릴 것</span></div>
        <ul class="gt-list">
          <li>콘텐츠 기획 · 자료 조사 · 아이디어</li>
          <li>메시지 정리와 출연자 이해</li>
          <li>시청자 관점에서의 감정 설계</li>
          <li>기획자 · 운영자 · 마케터의 시선</li>
          <li>맡은 일에는 끝까지 지는 책임감</li>
        </ul>
      </div>
      <div class="gt-col take reveal" style="--d:240ms">
        <div class="gt-key"><span class="lbl">Take</span><span class="ko">제가 받고 싶은 것</span></div>
        <ul class="gt-list">
          <li>제 일을 이어갈 수 있는 기회</li>
          <li>현실적으로 버틸 수 있는 보수</li>
          <li>존중하는 채널에서 배우는 경험</li>
          <li>새로운 사람들과의 만남</li>
          <li>함께 성장하는 관계</li>
        </ul>
      </div>
    </div>
  </div>

  <p class="s04-foot reveal">저는 도움을 받고 싶습니다.
하지만 그저 기대고 싶다는 뜻이 아닙니다.
그 균형을 책임감 있게 지키겠습니다.</p>
</section>

<!-- ============================ CLOSING ============================ -->
<section class="closing wrap" data-screen-label="마무리">
  <div class="eyebrow reveal" style="text-align:center; letter-spacing:0.4em;">In closing</div>

  <p class="closing-pre reveal" style="--d:60ms; margin-left:auto; margin-right:auto; text-align:center;">저는 아직 완성된 사람이 아닙니다.
하지만 계속 배우고, 움직이고, 책임지며 살아온 사람입니다.</p>

  <ul class="wish-list">
    <li class="reveal"><span class="n">01</span>함께하기 좋은 사람이 되고 싶고,</li>
    <li class="reveal" style="--d:90ms"><span class="n">02</span>이 채널에 실제로 도움이 되는 사람이 되고 싶고,</li>
    <li class="reveal" style="--d:180ms"><span class="n">03</span>이 일을 통해 저 역시 제 일을 이어가고 싶습니다.</li>
  </ul>

  <h2 class="final-headline reveal">제가 같이<br>일할래요<span class="mark">!</span></h2>

  <div class="contact-bar reveal" style="--d:80ms">
    <a class="btn primary" href="tel:01096111711">
      <svg class="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      010-9611-1711
    </a>
    <a class="btn ghost" href="mailto:jlionk200@gmail.com">
      <svg class="ic" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
      jlionk200@gmail.com
    </a>
  </div>

  <div class="ig-row reveal" style="--d:140ms">
    <a href="https://instagram.com/oliver_usopp" target="_blank" rel="noopener">
      <span class="handle">@oliver_usopp</span>
      <span class="role">Personal</span>
    </a>
    <a href="https://instagram.com/mammon_desire" target="_blank" rel="noopener">
      <span class="handle">@mammon_desire</span>
      <span class="role">MAMMON</span>
    </a>
    <a href="https://instagram.com/handy_nailtip" target="_blank" rel="noopener">
      <span class="handle">@handy_nailtip</span>
      <span class="role">Handy</span>
    </a>
  </div>

  <div class="closing-foot">김동현 · Kim Dong Hyun · 2026</div>
</section>
`;
