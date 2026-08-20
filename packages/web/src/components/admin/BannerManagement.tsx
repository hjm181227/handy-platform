import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/apiService';
import type { AdminBanner, BannerDetailImage } from '@handy-platform/shared';
import { ImageUploadManager, createImagePreview, revokeImagePreview, resizeImage } from '@handy-platform/shared';
import { API_BASE_URL } from '@handy-platform/shared';

interface BannerFormData {
  title: string;
  description: string;
  imageUrl: string;
  redirectUrl: string;
  startDate: string;
  endDate: string;
  detailImages: Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }>;
}

interface DetailImagePreview {
  imageUrl: string;
  imageS3Key?: string;
  displayOrder: number;
  isUploading?: boolean;
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<AdminBanner | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    description: '',
    imageUrl: '',
    redirectUrl: '',
    startDate: '',
    endDate: '',
    detailImages: [],
  });

  // 이미지 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 상세 이미지 상태
  const [detailImagePreviews, setDetailImagePreviews] = useState<DetailImagePreview[]>([]);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // ImageUploadManager 인스턴스
  const imageUploadManager = new ImageUploadManager(
    (import.meta as any).env?.VITE_API_BASE_URL || API_BASE_URL,
    async () => {
      const token = localStorage.getItem('accessToken');
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
    }
  );

  useEffect(() => {
    fetchBanners();
  }, [currentPage, searchQuery, filterActive]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
        sortBy: 'displayOrder',
        sortOrder: 'asc' as const,
      };

      if (filterActive !== 'all') {
        params.isActive = filterActive === 'active';
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminService.getBanners(params);

      if (response.success) {
        setBanners(response.eventBanners || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch banners:', error);
      alert('배너 목록을 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await imageUploadManager.uploadImage({
        file: imageFile,
        uploadType: 'banner' as any, // 서버에서 banner 타입 지원 필요
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result.success && result.imageUrl) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || '이미지 업로드 실패');
      }
    } catch (error: any) {
      alert(`이미지 업로드 실패: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 상세 이미지 선택 및 즉시 업로드
  const handleDetailImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = detailImagePreviews.length;
    const maxImages = 10;
    const remaining = maxImages - currentCount;

    if (remaining <= 0) {
      alert('상세 이미지는 최대 10장까지 추가할 수 있습니다.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기는 10MB를 초과할 수 없습니다.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
        continue;
      }

      // 미리보기 + 업로드 중 표시
      const reader = new FileReader();
      reader.onloadend = () => {
        const tempPreview: DetailImagePreview = {
          imageUrl: reader.result as string,
          displayOrder: detailImagePreviews.length,
          isUploading: true,
        };
        setDetailImagePreviews(prev => [...prev, tempPreview]);
      };
      reader.readAsDataURL(file);

      // 1080px 초과 시 자동 리사이즈
      let fileToUpload: File | Blob = file;
      if (file instanceof File) {
        fileToUpload = await resizeImage(file, 1080, 4000, 0.85);
      }

      // 업로드 실행
      try {
        const result = await imageUploadManager.uploadImage({
          file: fileToUpload,
          uploadType: 'banner' as any,
        });

        if (result.success && result.imageUrl) {
          setDetailImagePreviews(prev => {
            const updated = [...prev];
            // 마지막으로 추가된 uploading 상태인 항목 찾기
            const idx = updated.findIndex(img => img.isUploading);
            if (idx !== -1) {
              updated[idx] = {
                imageUrl: result.imageUrl,
                displayOrder: idx,
                isUploading: false,
              };
            }
            return updated;
          });
        } else {
          // 업로드 실패 시 제거
          setDetailImagePreviews(prev => prev.filter(img => !img.isUploading));
          alert(`이미지 업로드 실패: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (error: any) {
        setDetailImagePreviews(prev => prev.filter(img => !img.isUploading));
        alert(`이미지 업로드 실패: ${error.message}`);
      }
    }

    // input 초기화
    if (detailFileInputRef.current) {
      detailFileInputRef.current.value = '';
    }
  };

  const handleDetailImageRemove = (index: number) => {
    setDetailImagePreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((img, i) => ({ ...img, displayOrder: i }));
    });
  };

  const handleDetailImageMoveUp = (index: number) => {
    if (index === 0) return;
    setDetailImagePreviews(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((img, i) => ({ ...img, displayOrder: i }));
    });
  };

  const handleDetailImageMoveDown = (index: number) => {
    setDetailImagePreviews(prev => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((img, i) => ({ ...img, displayOrder: i }));
    });
  };

  const getDetailImagesForSubmit = (): Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }> => {
    return detailImagePreviews
      .filter(img => !img.isUploading)
      .map((img, i) => ({
        imageUrl: img.imageUrl,
        imageS3Key: img.imageS3Key,
        displayOrder: i,
      }));
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      redirectUrl: '',
      startDate: '',
      endDate: '',
      detailImages: [],
    });
    setImageFile(null);
    setImagePreview(null);
    setDetailImagePreviews([]);
    setShowCreateModal(true);
  };

  const openEditModal = (banner: AdminBanner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      redirectUrl: banner.redirectUrl || '',
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      detailImages: banner.detailImages || [],
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl);
    setDetailImagePreviews(
      (banner.detailImages || []).map((img, i) => ({
        imageUrl: img.imageUrl,
        imageS3Key: img.imageS3Key,
        displayOrder: i,
        isUploading: false,
      }))
    );
    setShowEditModal(true);
  };

  const openDeleteModal = (banner: AdminBanner) => {
    setSelectedBanner(banner);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    let iconUrl = formData.imageUrl;

    // 이미지가 선택된 경우 업로드
    if (imageFile) {
      const uploadedUrl = await handleImageUpload();
      if (!uploadedUrl) {
        return; // 업로드 실패
      }
      iconUrl = uploadedUrl;
    }

    if (!iconUrl) {
      alert('배너 이미지를 선택해주세요.');
      return;
    }

    try {
      const detailImages = getDetailImagesForSubmit();
      const response = await adminService.createBanner({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: iconUrl,
        redirectUrl: formData.redirectUrl.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        detailImages: detailImages.length > 0 ? detailImages : undefined,
      });

      if (response.success) {
        alert('배너가 성공적으로 생성되었습니다.');
        setShowCreateModal(false);
        fetchBanners();
      } else {
        alert(`배너 생성 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('Create banner error:', error);
      alert(`배너 생성 실패: ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBanner) return;

    if (!formData.title.trim()) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    let imageUrl = formData.imageUrl;

    // 새 이미지가 선택된 경우 업로드
    if (imageFile) {
      const uploadedUrl = await handleImageUpload();
      if (!uploadedUrl) {
        return; // 업로드 실패
      }
      imageUrl = uploadedUrl;
    }

    try {
      const detailImages = getDetailImagesForSubmit();
      const response = await adminService.updateBanner(selectedBanner._id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageUrl,
        redirectUrl: formData.redirectUrl.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        detailImages,
      });

      if (response.success) {
        alert('배너가 성공적으로 수정되었습니다.');
        setShowEditModal(false);
        fetchBanners();
      } else {
        alert(`배너 수정 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('Update banner error:', error);
      alert(`배너 수정 실패: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;

    try {
      const response = await adminService.deleteBanner(selectedBanner._id);

      if (response.success) {
        alert('배너가 성공적으로 삭제되었습니다.');
        setShowDeleteModal(false);
        fetchBanners();
      } else {
        alert(`배너 삭제 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('Delete banner error:', error);
      alert(`배너 삭제 실패: ${error.message}`);
    }
  };

  const handleToggleActive = async (banner: AdminBanner) => {
    try {
      const response = await adminService.toggleBanner(banner._id, !banner.isActive);

      if (response.success) {
        alert(`배너가 ${!banner.isActive ? '활성화' : '비활성화'}되었습니다.`);
        fetchBanners();
      } else {
        alert(`상태 변경 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('Toggle banner error:', error);
      alert(`상태 변경 실패: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p className="text-sm text-muted mt-1">이벤트 배너를 관리합니다</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand text-white rounded-full hover:bg-brand-600 transition-colors font-medium"
        >
          + 배너 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <div className="flex gap-4 flex-wrap">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          {/* 검색 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              placeholder="제목 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 배너 리스트 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">순서</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">미리보기</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">링크 URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">기간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">클릭수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-line">
            {banners.map((banner) => (
              <tr key={banner._id} className="hover:bg-surface">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {banner.displayOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-16 w-32 object-cover rounded border border-line"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                  {banner.description && (
                    <div className="text-xs text-muted mt-1 line-clamp-2">{banner.description}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {banner.redirectUrl ? (
                    <a
                      href={banner.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
                    >
                      {banner.redirectUrl}
                    </a>
                  ) : (
                    <span className="text-sm text-muted">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {banner.startDate || banner.endDate ? (
                    <div>
                      {banner.startDate && <div>{new Date(banner.startDate).toLocaleDateString()}</div>}
                      {banner.endDate && <div>~ {new Date(banner.endDate).toLocaleDateString()}</div>}
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {banner.clickCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      banner.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-surface text-gray-800'
                    }`}
                  >
                    {banner.isActive ? '활성' : '비활성'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => openDeleteModal(banner)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted">
                  배너가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-line rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
          >
            이전
          </button>
          <span className="px-4 py-2 text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-line rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
          >
            다음
          </button>
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">배너 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="배너 제목"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="배너 설명"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배너 이미지 *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-line rounded-lg"
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded border" />
                    <button
                      onClick={handleImageRemove}
                      className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      제거
                    </button>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-surface-strong rounded-full h-2">
                      <div
                        className="bg-brand h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted mt-1">업로드 중... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* 상세 이미지 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 이미지 (이벤트 페이지)
                  <span className="text-xs text-muted ml-1">최대 10장</span>
                </label>
                <p className="text-xs text-muted mb-2">배너 클릭 시 보여질 상세 페이지 이미지입니다. 권장: 너비 1080px, 장당 2MB 이하 (1080px 초과 시 자동 축소)</p>
                <input
                  ref={detailFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDetailImageSelect}
                  className="w-full px-3 py-2 border border-line rounded-lg"
                />
                {detailImagePreviews.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {detailImagePreviews.map((img, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-surface rounded-lg border">
                        <span className="text-xs text-muted font-medium w-6 text-center">{index + 1}</span>
                        <img
                          src={img.imageUrl}
                          alt={`상세 ${index + 1}`}
                          className="h-16 w-24 object-cover rounded border"
                        />
                        <div className="flex-1" />
                        {img.isUploading && (
                          <span className="text-xs text-blue-500">업로드 중...</span>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleDetailImageMoveUp(index)}
                            disabled={index === 0}
                            className="text-muted hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleDetailImageMoveDown(index)}
                            disabled={index === detailImagePreviews.length - 1}
                            className="text-muted hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => handleDetailImageRemove(index)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
                <input
                  type="text"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="https://example.com 또는 /design-tool 같은 내부 경로"
                />
                <p className="text-xs text-muted mt-1">상세 이미지가 없을 때 배너를 누르면 이 URL로 이동합니다. (외부 URL은 새 탭에서 열림)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-line rounded-lg hover:bg-surface"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={isUploading || detailImagePreviews.some(img => img.isUploading)}
                className="px-4 py-2 bg-brand text-white rounded-full hover:bg-brand-600 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && selectedBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">배너 수정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배너 이미지</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-line rounded-lg"
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded border" />
                    {imageFile && (
                      <button
                        onClick={handleImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                      >
                        제거
                      </button>
                    )}
                  </div>
                )}
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-surface-strong rounded-full h-2">
                      <div
                        className="bg-brand h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted mt-1">업로드 중... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* 상세 이미지 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 이미지 (이벤트 페이지)
                  <span className="text-xs text-muted ml-1">최대 10장</span>
                </label>
                <p className="text-xs text-muted mb-2">배너 클릭 시 보여질 상세 페이지 이미지입니다. 권장: 너비 1080px, 장당 2MB 이하 (1080px 초과 시 자동 축소)</p>
                <input
                  ref={detailFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDetailImageSelect}
                  className="w-full px-3 py-2 border border-line rounded-lg"
                />
                {detailImagePreviews.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {detailImagePreviews.map((img, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-surface rounded-lg border">
                        <span className="text-xs text-muted font-medium w-6 text-center">{index + 1}</span>
                        <img
                          src={img.imageUrl}
                          alt={`상세 ${index + 1}`}
                          className="h-16 w-24 object-cover rounded border"
                        />
                        <div className="flex-1" />
                        {img.isUploading && (
                          <span className="text-xs text-blue-500">업로드 중...</span>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleDetailImageMoveUp(index)}
                            disabled={index === 0}
                            className="text-muted hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleDetailImageMoveDown(index)}
                            disabled={index === detailImagePreviews.length - 1}
                            className="text-muted hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => handleDetailImageRemove(index)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
                <input
                  type="text"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="https://example.com 또는 /design-tool 같은 내부 경로"
                />
                <p className="text-xs text-muted mt-1">상세 이미지가 없을 때 배너를 누르면 이 URL로 이동합니다. (외부 URL은 새 탭에서 열림)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-line rounded-lg hover:bg-surface"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUploading || detailImagePreviews.some(img => img.isUploading)}
                className="px-4 py-2 bg-brand text-white rounded-full hover:bg-brand-600 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && selectedBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">배너 삭제</h2>
            <p className="text-gray-700 mb-6">
              <strong>{selectedBanner.title}</strong> 배너를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-line rounded-lg hover:bg-surface"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
