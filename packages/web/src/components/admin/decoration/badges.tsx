export function AccessTierBadge({ tier }: { tier: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    free: { bg: 'bg-green-100', text: 'text-green-800', label: 'Free' },
    paid: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Paid' },
    pro_only: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Pro' },
  };
  const cfg = map[tier] || map.free;
  return (
    <span className={`px-2 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} rounded-full`}>
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? '활성' : '비활성'}
    </span>
  );
}

export function AssetTypeBadge({ type }: { type: string }) {
  const isPart = type === 'part';
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isPart ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
      }`}
    >
      {isPart ? 'Part' : 'Sticker'}
    </span>
  );
}
