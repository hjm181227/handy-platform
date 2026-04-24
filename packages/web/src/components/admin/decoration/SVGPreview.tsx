export function SVGPreview({ svgPath, viewBox, color }: { svgPath: string; viewBox: string; color: string }) {
  if (!svgPath) return null;
  return (
    <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-center" style={{ height: 200 }}>
      <svg viewBox={viewBox || '0 0 100 100'} width="120" height="120">
        <path d={svgPath} fill={color || '#FF0000'} />
      </svg>
    </div>
  );
}
