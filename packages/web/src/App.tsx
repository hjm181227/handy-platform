import { useState, useMemo } from 'react';
import { useMiniRouter } from './utils';
import { products } from './data';

// Layout Components
import { TopDarkNav } from './components/layout/TopDarkNav';
import { MainHeader } from './components/layout/MainHeader';
import { Hero3 } from './components/layout/Hero';
import { FooterMega } from './components/layout/Footer';
import { CartDrawer, CategoryDrawer } from './components/layout/Drawers';

// Product Components
import { SectionRow, ProductGrid, TitleBar } from './components/product/ProductGrid';
import { Detail } from './components/product/Detail';

// Page Components
import { NewsPage, NewsArticle } from './components/pages/NewsPage';
import { BrandsPage } from './components/pages/BrandsPage';
import { LoginPage } from './components/pages/LoginPage';
import { HelpPage } from './components/pages/HelpPage';
import { LikesPage, MyPage, SnapPage } from './components/pages/OtherPages';

export default function App() {
  const { path, nav } = useMiniRouter();

  // Cart
  const [cart, setCart] = useState<{id:string; qty:number}[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const add = (id:string) => setCart(prev=>{
    const i = prev.findIndex(x=>x.id===id);
    if(i>=0){ const next=[...prev]; next[i]={...next[i], qty: next[i].qty+1}; return next; }
    return [...prev, {id, qty:1}];
  });
  const remove = (id:string) => setCart(prev=>prev.filter(x=>x.id!==id));
  const count = cart.reduce((a,c)=>a+c.qty,0);
  const checkout = (total:number)=>{
    try{ (window as any).ReactNativeWebView?.postMessage(JSON.stringify({type:"checkout", total})); }catch{};
    alert(`결제 진행 (총 ${total.toLocaleString()}원)`);
    setDrawer(false);
  };

  // Routing
  const [pathname, search] = useMemo(()=>{
    const u = new URL(window.location.href);
    return [u.pathname, u.search] as const;
  }, [path]);

  const q = useMemo(()=> new URLSearchParams(search), [search]);

  // helper screens
  const openProduct = (id:string)=> nav(`/p/${id}`);
  const addProduct = (id:string)=> add(id);

  let screen: React.ReactNode;

  // Product detail
  const mDetail = pathname.match(/^\/p\/(.+)$/);
  if (mDetail) {
    screen = <Detail id={decodeURIComponent(mDetail[1])} onBack={()=>history.back()} onAdd={addProduct}/>;
  } else if (pathname.startsWith("/brands")) {
    screen = (
      <BrandsPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
      />
    );
  } else if (pathname.startsWith("/snap")) {
    screen = <SnapPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname.startsWith("/news")) {
    const m = pathname.match(/^\/news\/(.+)$/);
    if (m) {
      // 기사 상세
      screen = <NewsArticle slug={decodeURIComponent(m[1])} onGo={nav} onOpenProduct={openProduct} />;
    } else {
      // 목록
      screen = <NewsPage onGo={nav} onOpenProduct={openProduct} />;
    }
  } else if (pathname.startsWith("/ranking")) {
    screen = (<><TitleBar title="랭킹"/><ProductGrid title="Top Rated" items={[...products].sort((a,b)=>(b.rating??0)-(a.rating??0))} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/sale")) {
    screen = (<><TitleBar title="세일"/><ProductGrid title="할인 중" items={products.filter(p=>p.sale)} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/recommend")) {
    screen = (<><TitleBar title="추천"/><ProductGrid title="회원님을 위한 추천" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/new")) {
    screen = (<><TitleBar title="신상"/><ProductGrid title="방금 등록된 상품" items={products.filter(p=>p.isNew)} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/trend")) {
    screen = (<><TitleBar title="트렌드"/><ProductGrid title="지금 뜨는 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/promo/")) {
    const slug = pathname.split("/").pop();
    screen = (<><TitleBar title={`프로모션: ${slug}`} desc="프로모션 기획전"/><SectionRow title="기획전 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/cat/")) {
    const parts = pathname.split("/").slice(2).map(decodeURIComponent);
    const [group, name] = parts;
    screen = (<><TitleBar title={`${group?.toUpperCase()} / ${name}`} desc="카테고리 결과"/><ProductGrid title="카테고리 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/search")) {
    const keyword = q.get("q") ?? "";
    screen = (<><TitleBar title={`검색: ${keyword || "전체"}`} desc="검색 결과"/><ProductGrid title="검색 결과" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/help")) {
    screen = <HelpPage onGo={nav} />;
  } else if (pathname.startsWith("/likes")) {
    screen = <LikesPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname.startsWith("/my")) {
    screen = <MyPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname.startsWith("/login")) {
    screen = <LoginPage onGo={nav} />;
  } else {
    // Home
    screen = (
      <>
        <Hero3 onGo={nav}/>
        <SectionRow title="신상 제품" items={[...products].reverse()} onOpen={openProduct} onAdd={addProduct}/>
        <SectionRow title="회원님을 위한 추천상품" items={products} onOpen={openProduct} onAdd={addProduct}/>
        <SectionRow title="시즌 트렌드 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct}/>
      </>
    );
  }

  return (
    <>
      {/* 앱(WebView)에서만 숨길 요소 */}
      <div data-apphide="true">
        <TopDarkNav onOpenCategories={() => setCatOpen(true)} onGo={nav} />
      </div>
      <div data-apphide="true">
        <MainHeader cartCount={count} onCart={() => setDrawer(true)} onGo={nav} />
      </div>

      {/* 본문은 절대 숨김 래퍼 안에 넣지 않기 */}
      {screen}

      <FooterMega onGo={nav} />
      <CartDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        items={cart}
        onRemove={remove}
        onCheckout={checkout}
      />
      <CategoryDrawer
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onGo={nav}
      />
    </>
  );
}