import { useState } from 'react';
import { followService } from '../../services/apiService';

interface FollowButtonProps {
  userUuid: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({
  userUuid,
  initialIsFollowing,
  onFollowChange,
  size = 'md',
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    const wasFollowing = isFollowing;

    // 낙관적 업데이트
    setIsFollowing(!wasFollowing);
    onFollowChange?.(!wasFollowing);

    try {
      setLoading(true);
      if (wasFollowing) {
        await followService.unfollow(userUuid);
      } else {
        await followService.follow(userUuid);
      }
    } catch {
      // 롤백
      setIsFollowing(wasFollowing);
      onFollowChange?.(wasFollowing);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1 text-xs'
    : 'px-4 py-1.5 text-sm';

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${sizeClasses} rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50 group ${className}`}
      >
        <span className="group-hover:hidden">팔로잉</span>
        <span className="hidden group-hover:inline">언팔로우</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} rounded-full bg-[#E85A6B] text-white font-medium hover:bg-[#D14A5B] transition-colors disabled:opacity-50 ${className}`}
    >
      팔로우
    </button>
  );
}
