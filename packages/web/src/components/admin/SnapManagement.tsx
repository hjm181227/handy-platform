import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';

interface AdminSnap {
  id: string;
  snapId: string;
  title?: string;
  description?: string;
  imageUrl: string;
  images: Array<{ imageUrl: string; sortOrder: number }>;
  creator: {
    userUuid: string;
    name: string;
    nickname: string;
    email: string;
    avatar?: string;
  };
  tags: string[];
  status: 'active' | 'hidden' | 'pending';
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

const SnapManagement: React.FC = () => {
  const [snaps, setSnaps] = useState<AdminSnap[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSnap, setSelectedSnap] = useState<AdminSnap | null>(null);

  const fetchSnaps = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await adminService.getAdminSnaps(params);
      if (response.success) {
        setSnaps(response.data.snaps);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Failed to fetch snaps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnaps();
  }, [currentPage, filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSnaps();
  };

  const handleStatusChange = async (snapUuid: string, newStatus: string) => {
    try {
      await adminService.updateSnapStatus(snapUuid, newStatus);
      setSnaps(prev => prev.map(s => s.id === snapUuid ? { ...s, status: newStatus as any } : s));
    } catch (error) {
      console.error('Failed to update snap status:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (snapUuid: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련 댓글도 모두 삭제됩니다.')) return;
    try {
      await adminService.deleteAdminSnap(snapUuid);
      setSnaps(prev => prev.filter(s => s.id !== snapUuid));
      setSelectedSnap(null);
    } catch (error) {
      console.error('Failed to delete snap:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      hidden: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      active: '활성',
      hidden: '숨김',
      pending: '대기',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">스냅 관리</h1>
        <p className="mt-1 text-sm text-gray-500">총 {totalItems}개의 스냅</p>
      </div>

      {/* 필터 & 검색 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 설명, 태그 검색..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            검색
          </button>
        </form>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="hidden">숨김</option>
          <option value="pending">대기</option>
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : snaps.length === 0 ? (
        <div className="text-center py-10 text-gray-500">스냅이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이미지</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">좋아요/조회/댓글</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {snaps.map((snap) => (
                <tr key={snap.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={snap.imageUrl}
                      className="w-12 h-16 object-cover rounded-lg"
                      alt={snap.title || ''}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{snap.title || '(제목 없음)'}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {snap.tags?.map(t => `#${t}`).join(' ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{snap.creator?.nickname || snap.creator?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{snap.creator?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(snap.status)}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {snap.likesCount} / {snap.viewsCount} / {snap.commentsCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(snap.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <select
                        value={snap.status}
                        onChange={(e) => handleStatusChange(snap.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="active">활성</option>
                        <option value="hidden">숨김</option>
                        <option value="pending">대기</option>
                      </select>
                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default SnapManagement;
