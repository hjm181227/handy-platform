
import { ReactNode } from 'react';

export function Badge({ children, tone="black" }: { children: ReactNode; tone?: "black"|"red"|"blue" }) {
  const m = { black: "bg-black text-white", red: "bg-red-500 text-white", blue: "bg-blue-600 text-white" } as const;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${m[tone]} leading-none`}>{children}</span>;
}

export function Stars({ v=0 }: { v?: number }) {
  const full = Math.floor(v); 
  const half = v - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({length:5}).map((_,i)=>(
        <svg key={i} viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${i<full? "fill-yellow-400 stroke-yellow-400": i===full&&half? "fill-yellow-300 stroke-yellow-300":"fill-transparent stroke-gray-300"}`} strokeWidth="1.5">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z"/>
        </svg>
      ))}
    </div>
  );
}

export function Drawer({ open, onClose, children, side="right" }: { open:boolean; onClose:()=>void; children:ReactNode; side?: "right"|"left"|"bottom" }) {
  const cls = side==="right"
    ? "top-0 right-0 h-full w-full max-w-sm translate-x-full"
    : side==="left"
      ? "top-0 left-0 h-full w-full max-w-sm -translate-x-full"
      : "left-0 bottom-0 w-full rounded-t-2xl translate-y-full";
  const openCls = side==="bottom" ? "translate-y-0" : "translate-x-0";
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open?"opacity-100":"pointer-events-none opacity-0"}`} onClick={onClose}/>
      <div className={`fixed z-50 bg-white shadow-xl transition-transform ${cls} ${open?openCls:""}`}>
        {children}
      </div>
    </>
  );
}