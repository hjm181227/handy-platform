import { useState, useEffect, useCallback } from 'react';
import { webApiService } from '../../../services/apiService';
import type { Announcement, AnnouncementCategory, AnnouncementTarget, AnnouncementStatus } from '@handy-platform/shared';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import { AnnouncementFormModal } from './AnnouncementFormModal';

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  notice: '공지',
  event: '이벤트',
  update: '업데이트',
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: '전체',
  'design-tool': '디자인 툴',
  platform: '플랫폼',
};

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '초안',
  published: '발행됨',
  archived: '보관됨',
};

const STATUS_COLORS: Record<AnnouncementStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
};

interface Filters {
  category: string;
  target: string;
  status: string;
  search: string;
}

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    category: '',
    target: '',
    status: '',
    search: '',
  });

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await webApiService.announcement.getAdminAnnouncements({
        category: filters.category || undefined,
        target: filters.target || undefined,
        status: filters.status || undefined,
        page,
        limit: 20,
      });
      if (response.success) {
        // 검색 필터를 클라이언트에서 적용 (서버에 search param이 없는 경우 대비)
        let items = response.announcements || [];
        if (filters.search.trim()) {
          const q = filters.search.trim().toLowerCase();
          items = items.filter(
            (a) => {
              const title = typeof a.title === 'string' ? a.title : (a.title?.ko || a.title?.en || a.title?.ja || '');
              const summary = typeof a.summary === 'string' ? a.summary : (a.summary?.ko || a.summary?.en || a.summary?.ja || '');
              return title.toLowerCase().includes(q) || summary.toLowerCase().includes(q);
            }
          );
        }
        setAnnouncements(items);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || items.length);
      }
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
      alert('공지사항 목록을 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.target, filters.status, filters.search]);

  // Handlers
  const handleCreate = () => {
    setFormMode('create');
    setSelectedAnnouncement(null);
    setShowFormModal(true);
  };

  const handleEdit = (item: Announcement) => {
    setFormMode('edit');
    setSelectedAnnouncement(item);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (data: Partial<Announcement>) => {
    if (formMode === 'create') {
      await webApiService.announcement.createAnnouncement(data);
      alert('공지사항이 생성되었습니다.');
    } else if (selectedAnnouncement) {
      await webApiService.announcement.updateAnnouncement(selectedAnnouncement.announcementUuid, data);
      alert('공지사항이 수정되었습니다.');
    }
    setShowFormModal(false);
    loadAnnouncements();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await webApiService.announcement.deleteAnnouncement(deleteTarget.announcementUuid);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadAnnouncements();
      alert('공지사항이 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleStatusChange = async (item: Announcement, newStatus: AnnouncementStatus) => {
    try {
      await webApiService.announcement.updateAnnouncementStatus(item.announcementUuid, newStatus);
      loadAnnouncements();
    } catch (error: any) {
      alert(`상태 변경 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleTogglePin = async (item: Announcement) => {
    try {
      await webApiService.announcement.toggleAnnouncementPin(item.announcementUuid);
      loadAnnouncements();
    } catch (error: any) {
      alert(`고정 토글 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
        <p className="mt-1 text-sm text-gray-600">공지사항을 생성, 수정, 발행 및 관리합니다.</p>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">총 {totalItems}개의 공지사항</p>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          새 공지 작성
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="notice">공지</option>
            <option value="event">이벤트</option>
            <option value="update">업데이트</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="draft">초안</option>
            <option value="published">발행됨</option>
            <option value="archived">보관됨</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대상 앱</label>
          <select
            value={filters.target}
            onChange={(e) => updateFilter('target', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="all">전체 앱</option>
            <option value="design-tool">디자인 툴</option>
            <option value="platform">플랫폼</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="제목/요약 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대상앱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">팝업</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배너</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고정</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발행일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    공지사항이 없습니다.
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr key={item.announcementUuid} className="hover:bg-gray-50">
                    {/* 제목 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const titleText = typeof item.title === 'string' ? item.title : (item.title?.ko || item.title?.en || item.title?.ja || '');
                        const summaryText = typeof item.summary === 'string' ? item.summary : (item.summary?.ko || item.summary?.en || item.summary?.ja || '');
                        return (
                          <>
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={titleText}>
                              {titleText}
                            </div>
                            {summaryText && (
                              <div className="text-xs text-gray-400 max-w-xs truncate" title={summaryText}>
                                {summaryText}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* 카테고리 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </td>

                    {/* 대상앱 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {TARGET_LABELS[item.target] || item.target}
                    </td>

                    {/* 상태 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                        {/* 상태 변경 드롭다운 */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(item, e.target.value as AnnouncementStatus);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-500 cursor-pointer"
                          title="상태 변경"
                        >
                          <option value="">변경</option>
                          {item.status !== 'published' && <option value="published">발행</option>}
                          {item.status !== 'archived' && <option value="archived">보관</option>}
                          {item.status !== 'draft' && <option value="draft">초안</option>}
                        </select>
                      </div>
                    </td>

                    {/* 팝업 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isPopup ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isPopup ? 'ON' : 'OFF'}
                      </span>
                    </td>

                    {/* 배너 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isBanner ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isBanner ? '✓' : '-'}
                      </span>
                    </td>

                    {/* 고정 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleTogglePin(item)}
                        className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          item.isPinned
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={item.isPinned ? '고정 해제' : '상단 고정'}
                      >
                        {item.isPinned ? '고정됨' : '-'}
                      </button>
                    </td>

                    {/* 발행일 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>

                    {/* 조회수 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.viewCount?.toLocaleString() || 0}
                    </td>

                    {/* 액션 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="수정"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {page} / {totalPages} 페이지
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnnouncementFormModal
        isOpen={showFormModal}
        mode={formMode}
        initialData={selectedAnnouncement}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">공지사항 삭제</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{typeof deleteTarget.title === 'string' ? deleteTarget.title : (deleteTarget.title?.ko || deleteTarget.title?.en || deleteTarget.title?.ja || '')}</strong> 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
