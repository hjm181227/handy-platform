import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/apiService';
import type { AdminCategory, CategoryType } from '@handy-platform/shared';
import { ImageUploadManager, createImagePreview, revokeImagePreview } from '@handy-platform/shared';
import { API_BASE_URL, getWebAuthHeaders } from '@handy-platform/shared/config/api';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiSearch, FiUpload, FiImage } from 'react-icons/fi';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  // 필터
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    type: 'style' as CategoryType,
    name: '',
    value: '',
    iconUrl: '',
    hexColor: '',
    description: '',
  });

  // 이미지 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const categoryTypes: { value: CategoryType; label: string }[] = [
    { value: 'style', label: '스타일' },
    { value: 'color', label: '컬러' },
    { value: 'texture', label: '텍스쳐' },
    { value: 'shape', label: '모양' },
    { value: 'length', label: '길이' },
    { value: 'tpo', label: 'TPO' },
    { value: 'nation', label: '국가별' },
  ];

  useEffect(() => {
    loadCategories();
  }, [page, typeFilter, isActiveFilter, searchQuery]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategories({
        page,
        limit: 50,
        type: typeFilter || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
        search: searchQuery || undefined,
        sortBy: 'type',
        sortOrder: 'asc',
      });

      if (response.success) {
        setCategories(response.categories);
        setTotalPages(response.pagination.totalPages);
        setTotalCategories(response.pagination.totalCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // 이미지가 선택되었다면 먼저 업로드
      let iconUrl = formData.iconUrl;
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          return; // 업로드 실패 시 중단
        }
        iconUrl = uploadedUrl;
      }

      const response = await adminService.createCategory({
        ...formData,
        iconUrl: iconUrl || undefined,
      });

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        loadCategories();
        alert('카테고리가 생성되었습니다.');
      }
    } catch (error: any) {
      alert(`카테고리 생성 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    try {
      // 새 이미지가 선택되었다면 먼저 업로드
      let iconUrl = formData.iconUrl;
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          return; // 업로드 실패 시 중단
        }
        iconUrl = uploadedUrl;
      }

      const response = await adminService.updateCategory(selectedCategory._id, {
        name: formData.name,
        value: formData.value,
        iconUrl: iconUrl || undefined,
        hexColor: formData.hexColor || undefined,
        description: formData.description || undefined,
      });

      if (response.success) {
        setShowEditModal(false);
        setSelectedCategory(null);
        resetForm();
        loadCategories();
        alert('카테고리가 수정되었습니다.');
      }
    } catch (error: any) {
      alert(`카테고리 수정 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleToggle = async (category: AdminCategory) => {
    try {
      const response = await adminService.toggleCategory(category._id, !category.isActive);
      if (response.success) {
        loadCategories();
      }
    } catch (error: any) {
      alert(`상태 변경 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      const response = await adminService.deleteCategory(selectedCategory._id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedCategory(null);
        loadCategories();
        alert('카테고리가 삭제되었습니다.');
      }
    } catch (error: any) {
      alert(`카테고리 삭제 실패: ${error.message || error.details || '알 수 없는 오류'}`);
    }
  };

  const openEditModal = (category: AdminCategory) => {
    setSelectedCategory(category);
    setFormData({
      type: category.type,
      name: category.name,
      value: category.value,
      iconUrl: category.iconUrl || '',
      hexColor: category.hexColor || '',
      description: category.description || '',
    });
    // 기존 이미지가 있다면 미리보기 설정
    if (category.iconUrl) {
      setImagePreview(category.iconUrl);
    }
    setShowEditModal(true);
  };

  const openDeleteModal = (category: AdminCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'style',
      name: '',
      value: '',
      iconUrl: '',
      hexColor: '',
      description: '',
    });
    // 이미지 관련 상태 초기화
    setImageFile(null);
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 검증 (10MB, JPG/PNG/WebP만)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('파일 크기가 10MB를 초과합니다.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)');
      return;
    }

    // 미리보기 생성
    const preview = await createImagePreview(file);
    setImageFile(file);
    setImagePreview(preview);

    // 파일 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await imageUploadManager.uploadImage({
        file: imageFile,
        uploadType: 'category',
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result.success && result.imageUrl) {
        return result.imageUrl;
      } else {
        throw new Error('이미지 업로드에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(`이미지 업로드 실패: ${error.message || '알 수 없는 오류'}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 이미지 제거 핸들러
  const handleImageRemove = () => {
    setImageFile(null);
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview(null);
    setFormData({ ...formData, iconUrl: '' });
  };

  const getCategoryTypeLabel = (type: string) => {
    return categoryTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-600">총 {totalCategories}개의 카테고리</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          새 카테고리 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            {categoryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="이름 또는 값 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 카테고리 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  값
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  미리보기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용 중
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    카테고리가 없습니다.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getCategoryTypeLabel(category.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.iconUrl ? (
                        <img
                          src={category.iconUrl}
                          alt={category.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : category.hexColor ? (
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: category.hexColor }}
                          title={category.hexColor}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.usageCount}개 상품
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(category)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="수정"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(category)}
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

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">새 카테고리 추가</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categoryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 (한글) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 심플"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    값 (영문 소문자) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
                    placeholder="예: simple"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 아이콘
                  </label>

                  {/* 이미지 미리보기 */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="미리보기"
                        className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* 파일 선택 버튼 */}
                  {!imagePreview && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FiUpload className="mr-2" />
                        이미지 선택
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG, WebP 파일 (최대 10MB)
                      </p>
                    </div>
                  )}

                  {/* 업로드 진행률 */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">업로드 중... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {formData.type === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      색상 코드 (컬러 타입만)
                    </label>
                    <input
                      type="text"
                      value={formData.hexColor}
                      onChange={(e) => setFormData({ ...formData, hexColor: e.target.value })}
                      placeholder="#FF0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.hexColor && (
                      <div
                        className="mt-2 w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: formData.hexColor }}
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiX className="inline mr-1" />
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.name || !formData.value}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheck className="inline mr-1" />
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리 수정</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                  <input
                    type="text"
                    value={getCategoryTypeLabel(formData.type)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">타입은 변경할 수 없습니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 (한글) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    값 (영문 소문자) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 아이콘
                  </label>

                  {/* 이미지 미리보기 */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="미리보기"
                        className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* 파일 선택 버튼 */}
                  {!imagePreview && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FiUpload className="mr-2" />
                        이미지 선택
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG, WebP 파일 (최대 10MB)
                      </p>
                    </div>
                  )}

                  {/* 업로드 진행률 */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">업로드 중... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {formData.type === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      색상 코드 (컬러 타입만)
                    </label>
                    <input
                      type="text"
                      value={formData.hexColor}
                      onChange={(e) => setFormData({ ...formData, hexColor: e.target.value })}
                      placeholder="#FF0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.hexColor && (
                      <div
                        className="mt-2 w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: formData.hexColor }}
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCategory(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiX className="inline mr-1" />
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!formData.name || !formData.value}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheck className="inline mr-1" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리 삭제</h2>
            <p className="text-gray-600 mb-2">
              정말로 이 카테고리를 삭제하시겠습니까?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                <span className="font-medium">이름:</span> {selectedCategory.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">값:</span> {selectedCategory.value}
              </p>
              <p className="text-sm">
                <span className="font-medium">사용 중인 상품:</span> {selectedCategory.usageCount}개
              </p>
            </div>
            {selectedCategory.usageCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  이 카테고리는 현재 {selectedCategory.usageCount}개의 상품에서 사용 중입니다. 삭제할 수 없습니다.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedCategory.usageCount > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
