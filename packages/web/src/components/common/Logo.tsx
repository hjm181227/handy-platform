import { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

interface LogoData {
  imageUrl?: string;
  text: string;
  altText: string;
}

// 임시 로고 데이터 (나중에 DB에서 가져올 예정)
const TEMP_LOGO_DATA: LogoData = {
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

export function Logo({ className = '', onClick }: LogoProps) {
  const [logoData, setLogoData] = useState<LogoData>(TEMP_LOGO_DATA);
  const [isLoading, setIsLoading] = useState(false);

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
          className="h-full w-auto object-contain"
        />
      ) : (
        /* 임시 텍스트 로고: 검은색 배경에 흰색 글씨 */
        <div className="bg-black text-white px-3 py-1 rounded font-bold text-lg tracking-tight">
          {logoData.text}
        </div>
      )}
    </div>
  );
}