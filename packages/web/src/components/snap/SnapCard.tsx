import { useState } from 'react';
import { likesService } from '../../services/apiService';

interface SnapCardProps {
  snap: any;
  onSnapClick: (snap: any) => void;
  onCreatorClick?: (userUuid: string) => void;
  onLikeUpdate?: (snapId: string, isLiked: boolean, likesCount: number) => void;
}

export default function SnapCard({ snap, onSnapClick, onCreatorClick, onLikeUpdate }: SnapCardProps) {
  const [isLiked, setIsLiked] = useState(snap.isLiked || false);
  const [likesCount, setLikesCount] = useState(snap.likesCount || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasLiked = isLiked;
    const prevCount = likesCount;

    // 낙관적 업데이트
    setIsLiked(!wasLiked);
    setLikesCount((prev: number) => prev + (wasLiked ? -1 : 1));
    onLikeUpdate?.(snap.id, !wasLiked, likesCount + (wasLiked ? -1 : 1));

    try {
      if (wasLiked) {
        await likesService.unlike('snap', snap.id);
      } else {
        await likesService.like('snap', snap.id);
      }
    } catch {
      // 롤백
      setIsLiked(wasLiked);
      setLikesCount(prevCount);
      onLikeUpdate?.(snap.id, wasLiked, prevCount);
    }
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreatorClick && snap.creator?.userUuid) {
      onCreatorClick(snap.creator.userUuid);
    }
  };

  const imageUrl = snap.imageUrl || snap.images?.[0]?.imageUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSnapClick(snap)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSnapClick(snap); }}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      <img
        src={imageUrl}
        className="w-full h-full object-cover"
        alt={snap.title || 'Nail snap'}
        loading="lazy"
      />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {snap.title && (
            <h3 className="font-semibold text-sm line-clamp-1">{snap.title}</h3>
          )}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={handleCreatorClick}
              className="flex items-center gap-2 text-xs hover:underline"
            >
              {snap.creator?.avatar && (
                <img
                  src={snap.creator.avatar}
                  className="w-5 h-5 rounded-full border border-white/50"
                  alt={snap.creator.nickname || snap.creator.name || ''}
                />
              )}
              <span className="opacity-90">{snap.creator?.nickname || snap.creator?.name || ''}</span>
            </button>
            <div className="flex items-center gap-1 text-xs">
              <span className="opacity-90">{likesCount}</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 좋아요 버튼 */}
      <button
        onClick={handleLike}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
      >
        <svg
          className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    </div>
  );
}
