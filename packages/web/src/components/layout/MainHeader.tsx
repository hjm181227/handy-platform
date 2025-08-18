import { useState } from 'react';
import { toQ } from '../../utils';

export function MainHeader({ cartCount, onCart, onGo }: { cartCount:number; onCart:()=>void; onGo:(to:string)=>void }) {
  const [q,setQ]=useState("");
  const gnb = [
    {label:"랭킹", to:"/ranking"},
    {label:"세일", to:"/sale"},
    {label:"브랜드", to:"/brands"},
    {label:"추천", to:"/recommend"},
    {label:"신상", to:"/new"},
    {label:"트렌드", to:"/trend"},
  ];
  const submitSearch = () => {
    onGo("/search" + toQ({ q }));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center h-16 px-4">
        <div className="justify-self-start">
          <a className="text-2xl font-extrabold tracking-tight" href="/" onClick={(e)=>{e.preventDefault(); onGo("/");}}>Handy</a>
        </div>

        <div className="justify-self-center w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border px-3 py-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-500" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
              placeholder="검색어를 입력하세요"
              className="w-full text-sm outline-none placeholder:text-gray-400"
            />
            <button onClick={submitSearch} className="text-xs rounded border px-2 py-1">Search</button>
          </div>
        </div>

        <div className="justify-self-end">
          <button onClick={onCart} className="rounded-full border px-3 py-1.5 text-sm">
            장바구니 ({cartCount})
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 overflow-x-auto">
        <div className="flex gap-4 py-2 text-sm whitespace-nowrap">
          {gnb.map(x=>(
            <a key={x.label} href={x.to} onClick={(e)=>{e.preventDefault(); onGo(x.to);}} className="text-gray-700 hover:text-black">{x.label}</a>
          ))}
        </div>
      </div>
    </header>
  );
}