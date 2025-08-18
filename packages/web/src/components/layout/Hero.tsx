
export function Hero3({ onGo }:{ onGo:(to:string)=>void }) {
  const tiles = [
    { img:"https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=1200", title:"라이브 특가", sub:"오늘 21시", tag:"포스트맨", to:"/promo/live" },
    { img:"https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?q=80&w=1200", title:"카테고리데이", sub:"셔츠 & 팬츠", tag:"데일리, 계절 외", to:"/promo/categoryday" },
    { img:"https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200", title:"견고한 데님 셔츠", sub:"최대 20% 할인", tag:"디앤슬로우", to:"/promo/denim" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 mt-3">
      <div className="grid md:grid-cols-3 gap-3">
        {tiles.map((t,i)=>(
          <a key={i} href={t.to} onClick={(e)=>{e.preventDefault(); onGo(t.to);}} className="relative group rounded-lg overflow-hidden bg-gray-100">
            <img src={t.img} className="h-[220px] md:h-[280px] w-full object-cover transition-transform duration-300 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
            <div className="absolute left-3 bottom-3 text-white">
              <div className="text-lg md:text-xl font-semibold">{t.title}</div>
              <div className="text-sm text-gray-200">{t.sub}</div>
              <div className="mt-1 inline-block rounded bg-white/90 px-2 py-0.5 text-xs text-black">{t.tag}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}