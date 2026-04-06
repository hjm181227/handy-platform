import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SellerLayout } from '../../layout/SellerLayout';
import { sellerService, imageService } from '../../../services/apiService';
import * as XLSX from 'xlsx';
import type { BulkCreateProductRequest } from '../../../types';

interface ParsedProduct extends BulkCreateProductRequest {
  _rowIndex: number;
  _errors: string[];
  _isValid: boolean;
  _selected: boolean;
  _mainImageFile?: File;
}

interface UploadedImage {
  file: File;
  url: string;
  filename: string;
}

interface BulkCreateResultItem {
  rowIndex: number;
  success: boolean;
  productUuid?: string;
  productName: string;
  error?: string;
}

// Excel 행 데이터 → ParsedProduct 변환
function parseExcelRow(row: Record<string, any>, rowIndex: number): ParsedProduct {
  const errors: string[] = [];

  const name = String(row['상품명 *'] || '').trim();
  const description = String(row['상품 설명 *'] || '').trim();
  const shortDescription = String(row['짧은 설명'] || '').trim();
  const price = Number(row['가격 *']) || 0;
  const salePrice = row['할인가'] ? Number(row['할인가']) : undefined;
  const stockQuantity = row['재고 수량'] !== undefined && row['재고 수량'] !== '' ? Number(row['재고 수량']) : 100;
  const processingDays = Number(row['제작 소요일 *']) || 0;
  const nailShape = String(row['네일 모양'] || 'ROUND').trim().toUpperCase();
  const nailLength = String(row['네일 길이'] || 'MEDIUM').trim().toUpperCase();
  const nation = String(row['국가 스타일'] || 'kr').trim();
  const status = String(row['상태'] || 'active').trim();

  // 콤마 구분 필드 파싱
  const parseCommaSeparated = (val: any): string[] => {
    if (!val) return [];
    return String(val).split(',').map(s => s.trim()).filter(Boolean);
  };

  const style = parseCommaSeparated(row['스타일 (콤마 구분)']);
  const color = parseCommaSeparated(row['컬러 (콤마 구분)']);
  const texture = parseCommaSeparated(row['텍스처 (콤마 구분)']);
  const tpo = parseCommaSeparated(row['TPO (콤마 구분)']);
  const tags = parseCommaSeparated(row['태그 (콤마 구분)']);

  // 유효성 검사
  if (!name || name.length < 2 || name.length > 200) {
    errors.push('상품명은 2~200자 사이여야 합니다.');
  }
  if (!description || description.length < 10) {
    errors.push('상품 설명은 10자 이상이어야 합니다.');
  }
  if (description.length > 2000) {
    errors.push('상품 설명은 2000자 이하여야 합니다.');
  }
  if (!price || price <= 0) {
    errors.push('가격은 0보다 큰 숫자여야 합니다.');
  }
  if (salePrice !== undefined && salePrice >= price) {
    errors.push('할인 가격은 정가보다 낮아야 합니다.');
  }
  if (processingDays < 0 || processingDays > 365) {
    errors.push('제작 소요일은 0~365 사이여야 합니다.');
  }
  if (stockQuantity < 0) {
    errors.push('재고 수량은 0 이상이어야 합니다.');
  }

  const validShapes = ['ROUND', 'ALMOND', 'OVAL', 'STILETTO', 'SQUARE', 'COFFIN'];
  if (nailShape && !validShapes.includes(nailShape)) {
    errors.push(`유효하지 않은 네일 모양: ${nailShape}`);
  }

  const validLengths = ['SHORT', 'MEDIUM', 'LONG'];
  if (nailLength && !validLengths.includes(nailLength)) {
    errors.push(`유효하지 않은 네일 길이: ${nailLength}`);
  }

  if (style.length > 3) errors.push('스타일은 최대 3개 선택 가능합니다.');
  if (color.length > 3) errors.push('컬러는 최대 3개 선택 가능합니다.');
  if (tags.length > 20) errors.push('태그는 최대 20개입니다.');

  return {
    _rowIndex: rowIndex,
    _errors: errors,
    _isValid: errors.length === 0,
    _selected: true,
    name,
    description,
    shortDescription: shortDescription || undefined,
    price,
    salePrice,
    stockQuantity,
    processingDays,
    nailShape,
    nailLength,
    nailCategories: { style, color, texture, tpo, nation },
    tags: tags.length > 0 ? tags : undefined,
    status,
    mainImageUrl: '', // 이미지는 별도 업로드
  };
}

export function BulkProductUpload({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('seller');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 상태
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState<BulkCreateResultItem[] | null>(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const blob = await sellerService.getBulkCreateTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-product-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('템플릿 다운로드에 실패했습니다. 다시 시도해주세요.');
      console.error('Template download error:', error);
    } finally {
      setTemplateDownloading(false);
    }
  };

  // Excel 파일 파싱
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    setSubmitResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet);

        if (rows.length === 0) {
          alert('데이터가 없습니다. Excel 파일에 상품 데이터를 입력해주세요.');
          setIsUploading(false);
          return;
        }

        if (rows.length > 50) {
          alert(`최대 50개까지 등록 가능합니다. (현재 ${rows.length}개)`);
          setIsUploading(false);
          return;
        }

        const products = rows.map((row, i) => parseExcelRow(row, i + 1));
        setParsedProducts(products);
      } catch (error) {
        alert('Excel 파일을 파싱하는 데 실패했습니다. 템플릿 형식에 맞는지 확인해주세요.');
        console.error('Excel parse error:', error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 드래그앤드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  // 이미지 일괄 업로드
  const handleImageUpload = async (files: FileList) => {
    setImageUploading(true);
    const newImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        try {
          // presigned URL 요청
          const presignedResponse = await imageService.getPresignedUrl({
            filename: file.name,
            contentType: file.type,
            uploadType: 'product-main',
          });

          // S3에 업로드
          const uploadResponse = await fetch(presignedResponse.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
              ...(presignedResponse.uploadHeaders || {}),
            },
          });

          if (!uploadResponse.ok) {
            console.error(`Image upload failed for ${file.name}: ${uploadResponse.status}`);
            continue;
          }

          newImages.push({
            file,
            url: presignedResponse.imageUrl,
            filename: file.name,
          });
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      setUploadedImages(prev => [...prev, ...newImages]);

      // 자동 매핑: 파일명이 "{행번호}_main" 패턴이면 자동 매핑
      if (parsedProducts.length > 0 && newImages.length > 0) {
        setParsedProducts(prev => {
          const updated = [...prev];
          for (const img of newImages) {
            const match = img.filename.match(/^(\d+)_main/i);
            if (match) {
              const rowIndex = parseInt(match[1]);
              const productIdx = updated.findIndex(p => p._rowIndex === rowIndex);
              if (productIdx !== -1 && !updated[productIdx].mainImageUrl) {
                updated[productIdx] = {
                  ...updated[productIdx],
                  mainImageUrl: img.url,
                  _errors: updated[productIdx]._errors.filter(e => e !== '메인 이미지가 필요합니다.'),
                };
                updated[productIdx]._isValid = updated[productIdx]._errors.length === 0;
              }
            }
          }
          return updated;
        });
      }
    } finally {
      setImageUploading(false);
    }
  };

  // 이미지 수동 매핑
  const handleImageMapping = (productIndex: number, imageUrl: string) => {
    setParsedProducts(prev => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        mainImageUrl: imageUrl,
        _errors: updated[productIndex]._errors.filter(e => e !== '메인 이미지가 필요합니다.'),
      };
      updated[productIndex]._isValid = updated[productIndex]._errors.length === 0;
      return updated;
    });
  };

  // 행 선택 토글
  const toggleRowSelection = (index: number) => {
    setParsedProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _selected: !updated[index]._selected };
      return updated;
    });
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    const allSelected = parsedProducts.every(p => p._selected);
    setParsedProducts(prev => prev.map(p => ({ ...p, _selected: !allSelected })));
  };

  // 등록 실행
  const handleSubmit = async () => {
    // 이미지 없는 상품 확인
    const selectedProducts = parsedProducts.filter(p => p._selected && p._isValid);
    const noImageProducts = selectedProducts.filter(p => !p.mainImageUrl);

    if (noImageProducts.length > 0) {
      alert(`메인 이미지가 없는 상품이 ${noImageProducts.length}개 있습니다. 이미지를 먼저 업로드해주세요.`);
      return;
    }

    if (selectedProducts.length === 0) {
      alert('등록할 상품이 없습니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitResults(null);

    try {
      // 서버로 전송할 데이터 정리 (internal fields 제거)
      const productsToSubmit: BulkCreateProductRequest[] = selectedProducts.map(p => ({
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        salePrice: p.salePrice,
        stockQuantity: p.stockQuantity,
        processingDays: p.processingDays,
        nailShape: p.nailShape,
        nailLength: p.nailLength,
        nailCategories: p.nailCategories,
        tags: p.tags,
        status: p.status,
        mainImageUrl: p.mainImageUrl,
        detailImages: p.detailImages,
      }));

      const response = await sellerService.bulkCreateProducts(productsToSubmit);
      if (response.success && response.data) {
        setSubmitResults(response.data.results);
      } else {
        alert('대량 등록에 실패했습니다.');
      }
    } catch (error: any) {
      alert(error.message || '대량 등록 중 오류가 발생했습니다.');
      console.error('Bulk submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 통계
  const totalRows = parsedProducts.length;
  const validRows = parsedProducts.filter(p => p._isValid && p.mainImageUrl).length;
  const selectedValidRows = parsedProducts.filter(p => p._selected && p._isValid && p.mainImageUrl).length;
  const errorRows = parsedProducts.filter(p => !p._isValid || !p.mainImageUrl).length;

  return (
    <SellerLayout currentPage="products" onGo={onGo}>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대량 상품 등록</h1>
            <p className="mt-1 text-sm text-gray-500">
              Excel 템플릿을 사용하여 최대 50개의 상품을 한 번에 등록할 수 있습니다.
            </p>
          </div>
          <button
            onClick={() => onGo('/seller/products')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 상품 목록
          </button>
        </div>

        {/* Step 1: 템플릿 다운로드 */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E85A6B] text-white text-sm font-bold mr-2">1</span>
            Excel 템플릿 다운로드
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            템플릿을 다운로드하여 상품 정보를 입력하세요. "입력 안내" 시트에서 각 필드의 설명과 유효한 값을 확인할 수 있습니다.
          </p>
          <button
            onClick={handleDownloadTemplate}
            disabled={templateDownloading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {templateDownloading ? '다운로드 중...' : '템플릿 다운로드 (.xlsx)'}
          </button>
        </div>

        {/* Step 2: Excel 파일 업로드 */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E85A6B] text-white text-sm font-bold mr-2">2</span>
            Excel 파일 업로드
          </h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[#E85A6B] bg-[#FFF1F2]' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <svg className="mx-auto w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 font-medium">
              {isUploading ? '파일을 처리하고 있습니다...' : 'Excel 파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-sm text-gray-400 mt-1">지원 형식: .xlsx, .xls</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        </div>

        {/* Step 3: 이미지 일괄 업로드 (Excel 파싱 후 표시) */}
        {parsedProducts.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E85A6B] text-white text-sm font-bold mr-2">3</span>
              이미지 일괄 업로드
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              상품 이미지를 업로드하세요. 파일명이 <code className="bg-gray-100 px-1 rounded">행번호_main.jpg</code> 형식이면 자동으로 매핑됩니다.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              예: 1_main.jpg → 1번 행 상품의 메인 이미지, 2_main.png → 2번 행 상품의 메인 이미지
            </p>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
                imageDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImageDragOver(false);
                if (e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files);
              }}
            >
              {imageUploading ? (
                <p className="text-gray-600">이미지 업로드 중...</p>
              ) : (
                <>
                  <svg className="mx-auto w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">이미지 파일을 드래그하거나 클릭하여 업로드 (복수 선택 가능)</p>
                </>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
            </div>

            {/* 업로드된 이미지 목록 */}
            {uploadedImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지 ({uploadedImages.length}개)</p>
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <p className="text-xs text-gray-500 mt-1 max-w-[80px] truncate">{img.filename}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 미리보기 테이블 */}
        {parsedProducts.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E85A6B] text-white text-sm font-bold mr-2">4</span>
                미리보기 및 검증
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">전체: <b>{totalRows}</b></span>
                <span className="text-green-600">유효: <b>{validRows}</b></span>
                <span className="text-red-600">오류: <b>{errorRows}</b></span>
                <span className="text-blue-600">선택됨: <b>{selectedValidRows}</b></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={parsedProducts.every(p => p._selected)}
                        onChange={toggleAllSelection}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-gray-600">#</th>
                    <th className="px-3 py-2 text-left text-gray-600">상태</th>
                    <th className="px-3 py-2 text-left text-gray-600">이미지</th>
                    <th className="px-3 py-2 text-left text-gray-600 min-w-[200px]">상품명</th>
                    <th className="px-3 py-2 text-right text-gray-600">가격</th>
                    <th className="px-3 py-2 text-right text-gray-600">할인가</th>
                    <th className="px-3 py-2 text-right text-gray-600">재고</th>
                    <th className="px-3 py-2 text-left text-gray-600">네일 모양</th>
                    <th className="px-3 py-2 text-left text-gray-600">네일 길이</th>
                    <th className="px-3 py-2 text-left text-gray-600">오류</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedProducts.map((product, idx) => {
                    const hasImage = !!product.mainImageUrl;
                    const isFullyValid = product._isValid && hasImage;
                    const resultItem = submitResults?.find(r => r.rowIndex === product._rowIndex);

                    return (
                      <tr
                        key={idx}
                        className={`border-b ${
                          resultItem?.success ? 'bg-green-50' :
                          resultItem && !resultItem.success ? 'bg-red-50' :
                          !isFullyValid ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={product._selected}
                            onChange={() => toggleRowSelection(idx)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-500">{product._rowIndex}</td>
                        <td className="px-3 py-2">
                          {resultItem?.success ? (
                            <span className="text-green-600 font-medium">✓ 등록됨</span>
                          ) : resultItem ? (
                            <span className="text-red-600 font-medium">✗ 실패</span>
                          ) : isFullyValid ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {hasImage ? (
                            <img src={product.mainImageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <select
                              className="text-xs border rounded px-1 py-0.5"
                              value=""
                              onChange={(e) => handleImageMapping(idx, e.target.value)}
                            >
                              <option value="">이미지 선택</option>
                              {uploadedImages.map((img, i) => (
                                <option key={i} value={img.url}>{img.filename}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">{product.name}</td>
                        <td className="px-3 py-2 text-right">{product.price.toLocaleString()}원</td>
                        <td className="px-3 py-2 text-right text-red-500">
                          {product.salePrice ? `${product.salePrice.toLocaleString()}원` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">{product.stockQuantity}</td>
                        <td className="px-3 py-2">{product.nailShape}</td>
                        <td className="px-3 py-2">{product.nailLength}</td>
                        <td className="px-3 py-2">
                          {!hasImage && <span className="text-red-500 text-xs block">메인 이미지 필요</span>}
                          {product._errors.map((err, i) => (
                            <span key={i} className="text-red-500 text-xs block">{err}</span>
                          ))}
                          {resultItem?.error && (
                            <span className="text-red-500 text-xs block">{resultItem.error}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 등록 버튼 */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                {submitResults ? (
                  <span>
                    결과: 성공 <b className="text-green-600">{submitResults.filter(r => r.success).length}</b>개,
                    실패 <b className="text-red-600">{submitResults.filter(r => !r.success).length}</b>개
                  </span>
                ) : (
                  <span>
                    선택된 유효 상품 <b className="text-[#E85A6B]">{selectedValidRows}</b>개를 등록합니다.
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {submitResults && submitResults.some(r => !r.success) && (
                  <button
                    onClick={() => {
                      // 실패한 행만 선택하고 나머지 해제
                      const failedRowIndices = new Set(submitResults.filter(r => !r.success).map(r => r.rowIndex));
                      setParsedProducts(prev => prev.map(p => ({
                        ...p,
                        _selected: failedRowIndices.has(p._rowIndex),
                      })));
                      setSubmitResults(null);
                    }}
                    className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50"
                  >
                    실패한 항목만 재시도
                  </button>
                )}
                <button
                  onClick={() => onGo('/seller/products')}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedValidRows === 0}
                  className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      등록 중...
                    </>
                  ) : (
                    `${selectedValidRows}개 상품 등록`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
