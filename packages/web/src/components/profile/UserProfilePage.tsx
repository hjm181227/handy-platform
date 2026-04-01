import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../services/apiService';
import SnapCard from '../snap/SnapCard';
import SnapDetailModal from '../snap/SnapDetailModal';
import FollowButton from './FollowButton';
import { useAuth } from '../../hooks/useAuth';

interface UserProfilePageProps {
  userUuid: string;
  onGo: (path: string) => void;
  onOpen: (productUuid: string) => void;
  initialView?: 'grid' | 'followers' | 'following';
}

export default function UserProfilePage({ userUuid, onGo, onOpen, initialView = 'grid' }: UserProfilePageProps) {
  const { t } = useTranslation(['mypage', 'common']);
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [snaps, setSnaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSnap, setSelectedSnap] = useState<any>(null);
  const [activeView, setActiveView] = useState<'grid' | 'followers' | 'following'>(initialView);
  const [followList, setFollowList] = useState<any[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  const isOwnProfile = currentUser?.userUuid === userUuid;

  useEffect(() => {
    loadProfile();
    if (initialView !== 'grid') {
      loadFollowList(initialView);
    }
  }, [userUuid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await webApiService.snap.getUserProfile(userUuid, { page: 1, limit: 20 });
      if (response.success) {
        setProfile(response.data.profile);
        setSnaps(response.data.snaps || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    try {
      const response = await webApiService.snap.getUserProfile(userUuid, { page: nextPage, limit: 20 });
      if (response.success) {
        setSnaps(prev => [...prev, ...(response.data.snaps || [])]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more snaps:', err);
    }
  };

  const loadFollowList = async (type: 'followers' | 'following') => {
    try {
      setFollowListLoading(true);
      const response = type === 'followers'
        ? await webApiService.follow.getFollowers(userUuid)
        : await webApiService.follow.getFollowing(userUuid);
      if (response.success) {
        setFollowList(response.data.users || []);
      }
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
    } finally {
      setFollowListLoading(false);
    }
  };

  const handleViewChange = (view: 'grid' | 'followers' | 'following') => {
    setActiveView(view);
    if (view !== 'grid') {
      loadFollowList(view);
    }
  };

  if (loading) {
    return (
      <div className="handy-page-content max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="handy-page-content max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">{t('mypage:profile.userNotFound')}</p>
        <button onClick={() => onGo('/')} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
          {t('mypage:profile.goHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="handy-page-content max-w-4xl mx-auto">
      {/* 프로필 헤더 */}
      <div className="py-6">
        <div className="flex items-center gap-6">
          {profile.avatar ? (
            <img src={profile.avatar} className="w-20 h-20 rounded-full border-2 border-gray-200" alt={profile.nickname || ''} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
              {(profile.nickname || profile.name || '?').charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{profile.nickname || profile.name}</h1>
              {!isOwnProfile && (
                <FollowButton
                  userUuid={userUuid}
                  initialIsFollowing={profile.isFollowing || false}
                  onFollowChange={(isFollowing) => {
                    setProfile((prev: any) => ({
                      ...prev,
                      isFollowing,
                      followerCount: prev.followerCount + (isFollowing ? 1 : -1),
                    }));
                  }}
                />
              )}
            </div>
            <div className="flex gap-6 mt-3">
              <button onClick={() => handleViewChange('grid')} className="text-center">
                <span className="font-bold text-gray-900">{profile.snapsCount || 0}</span>
                <span className="text-xs text-gray-500 ml-1">{t('mypage:profile.snaps')}</span>
              </button>
              <button onClick={() => handleViewChange('followers')} className="text-center">
                <span className="font-bold text-gray-900">{profile.followerCount || 0}</span>
                <span className="text-xs text-gray-500 ml-1">{t('mypage:profile.followers')}</span>
              </button>
              <button onClick={() => handleViewChange('following')} className="text-center">
                <span className="font-bold text-gray-900">{profile.followingCount || 0}</span>
                <span className="text-xs text-gray-500 ml-1">{t('mypage:profile.following')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-4">
        <div className="flex">
          {(['grid', 'followers', 'following'] as const).map(view => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`flex-1 py-3 text-sm ${
                activeView === view
                  ? 'text-[#131211] font-bold'
                  : 'text-[#A39E99] font-medium'
              }`}
            >
              {view === 'grid' ? t('mypage:profile.snaps') : view === 'followers' ? t('mypage:profile.followers') : t('mypage:profile.following')}
            </button>
          ))}
        </div>
      </div>

      {/* 스냅 그리드 */}
      {activeView === 'grid' && (
        <>
          {snaps.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {snaps.map(snap => (
                <SnapCard
                  key={snap.id || snap.snapUuid}
                  snap={snap}
                  onSnapClick={setSelectedSnap}
                  onCreatorClick={(uuid) => onGo(`/user/${uuid}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400">{t('mypage:profile.noSnaps')}</p>
            </div>
          )}

          {page < totalPages && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                {t('mypage:profile.loadMore')}
              </button>
            </div>
          )}
        </>
      )}

      {/* 팔로워/팔로잉 목록 */}
      {activeView !== 'grid' && (
        <div className="space-y-2">
          {followListLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : followList.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              {activeView === 'followers' ? t('mypage:profile.noFollowers') : t('mypage:profile.noFollowing')}
            </p>
          ) : (
            followList.map(user => (
              <div key={user.userUuid} className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-lg">
                <button onClick={() => onGo(`/user/${user.userUuid}`)}>
                  {user.avatar ? (
                    <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-400">
                      {(user.nickname || user.name || '?').charAt(0)}
                    </div>
                  )}
                </button>
                <button onClick={() => onGo(`/user/${user.userUuid}`)} className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900">{user.nickname || user.name}</p>
                </button>
                {user.userUuid !== currentUser?.userUuid && (
                  <FollowButton
                    userUuid={user.userUuid}
                    initialIsFollowing={user.isFollowing || false}
                    size="sm"
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 스냅 상세 모달 */}
      {selectedSnap && (
        <SnapDetailModal
          snap={selectedSnap}
          onClose={() => setSelectedSnap(null)}
          onCreatorClick={(uuid) => onGo(`/user/${uuid}`)}
          onProductClick={(uuid) => onOpen(uuid)}
          onDelete={(uuid) => { setSnaps(prev => prev.filter(s => (s.id || s.snapUuid) !== uuid)); setSelectedSnap(null); }}
        />
      )}
    </div>
  );
}
