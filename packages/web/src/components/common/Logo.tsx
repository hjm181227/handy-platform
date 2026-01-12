import { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface LogoData {
  imageUrl?: string;
  text: string;
  altText: string;
}

// 임시 로고 데이터 (나중에 DB에서 가져올 예정)
const TEMP_LOGO_DATA: LogoData = {
  imageUrl: 'https://handy-images-stage.s3.ap-northeast-2.amazonaws.com/logo/logo-black.png',
  text: 'HANDY',
  altText: 'Handy 로고'
};

// 나중에 API에서 로고 정보를 가져오는 함수
const fetchLogoFromDB = async (): Promise<LogoData> => {
  // TODO: 실제 API 호출로 교체
  // const response = await apiService.getLogo();
  // return response.data;
  
  // 임시로 하드코딩된 데이터 반환
  return TEMP_LOGO_DATA;
};

export function Logo({ className = '', onClick, size = 'md' }: LogoProps) {
  const [logoData, setLogoData] = useState<LogoData>(TEMP_LOGO_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // 사이즈별 스타일 (텍스트 로고용)
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-sm rounded',
    md: 'px-3 py-1 text-lg rounded',
    lg: 'px-4 py-2 text-2xl rounded-md',
    xl: 'px-5 py-2.5 text-3xl rounded-lg',
  };

  // 사이즈별 이미지 높이
  const imageSizeStyles = {
    sm: 'h-5',
    md: 'h-7',
    lg: 'h-10',
    xl: 'h-14',
  };

  useEffect(() => {
    const loadLogo = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLogoFromDB();
        setLogoData(data);
      } catch (error) {
        console.error('로고 로딩 실패:', error);
        // 에러 시 임시 로고 사용
        setLogoData(TEMP_LOGO_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer select-none ${className}`}
      onClick={onClick}
    >
      {logoData.imageUrl ? (
        <img
          src={logoData.imageUrl}
          alt={logoData.altText}
          className={`${imageSizeStyles[size]} w-auto object-contain`}
        />
      ) : (
        /* 임시 텍스트 로고: 검은색 배경에 흰색 글씨 */
        <div className={`bg-black text-white font-bold tracking-tight ${sizeStyles[size]}`}>
          {logoData.text}
        </div>
      )}
    </div>
  );
}