
import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';

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
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startTouch, setStartTouch] = useState({ x: 0, y: 0 });

  const sideStyles = {
    right: {
      position: "top-0 right-0 h-full w-full sm:w-80 md:w-96 max-w-md",
      animate: open ? "translate-x-0" : "translate-x-full"
    },
    left: {
      position: "top-0 left-0 h-full w-full sm:w-80 md:w-96 max-w-md",
      animate: open ? "translate-x-0" : "-translate-x-full"
    },
    bottom: {
      position: "bottom-0 left-0 w-full h-96",
      animate: open ? "translate-y-0" : "translate-y-full"
    }
  };

  // 터치 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!open) return;
    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, [open]);

  // 터치 이동
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !open) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;
    
    if (side === 'right' && deltaX > 0) {
      setDragOffset(Math.min(deltaX, 200)); // 최대 200px까지만 드래그
    } else if (side === 'left' && deltaX < 0) {
      setDragOffset(Math.max(deltaX, -200)); // 최대 -200px까지만 드래그
    } else if (side === 'bottom' && deltaY > 0) {
      setDragOffset(Math.min(deltaY, 200)); // 최대 200px까지만 드래그
    }
  }, [isDragging, startTouch, side, open]);

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    // 드래그 거리가 100px 이상이면 닫기
    const shouldClose = Math.abs(dragOffset) > 100;
    
    if (shouldClose) {
      onClose();
    }
    
    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // 키보드 이벤트 (ESC 키로 닫기)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // 포커스 트랩 (접근성)
      const firstFocusable = drawerRef.current?.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // 드래그 중일 때 transform 값 계산
  const getDragTransform = () => {
    if (!isDragging || dragOffset === 0) return '';
    
    if (side === 'right') {
      return `translateX(${dragOffset}px)`;
    } else if (side === 'left') {
      return `translateX(${dragOffset}px)`;
    } else if (side === 'bottom') {
      return `translateY(${dragOffset}px)`;
    }
    return '';
  };

  const dragTransform = getDragTransform();
  
  return (
    <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Background overlay with fade animation */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${open ? 'bg-opacity-50' : 'bg-opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer content with slide animation and touch support */}
      <div 
        ref={drawerRef}
        className={`absolute bg-white shadow-xl z-10 transform ${isDragging ? '' : 'transition-transform duration-300 ease-out'} ${sideStyles[side].position} ${isDragging ? '' : sideStyles[side].animate}`}
        style={isDragging ? { transform: dragTransform } : {}}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {children}
      </div>
    </div>
  );
}