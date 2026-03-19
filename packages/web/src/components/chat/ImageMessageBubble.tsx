import React, { useState } from 'react';

interface ImageMessageBubbleProps {
  fileUrl: string;
  isMe: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const ImageMessageBubble: React.FC<ImageMessageBubbleProps> = ({
  fileUrl,
  isMe,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [isError, setIsError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (isError) {
    return (
      <div
        className={`
          flex items-center justify-center w-[200px] h-[150px] rounded-2xl
          ${isMe ? 'bg-[#FFF1F2] rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'}
        `}
      >
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span className="text-xs">이미지를 불러올 수 없습니다</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer transition-shadow hover:shadow-md
          ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}
        `}
        onClick={() => !isUploading && setIsLightboxOpen(true)}
      >
        <img
          src={fileUrl}
          alt="채팅 이미지"
          className={`
            max-w-[240px] max-h-[320px] object-cover block
            ${isUploading ? 'blur-sm' : ''}
          `}
          onError={() => setIsError(true)}
        />

        {/* 업로드 중 오버레이 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-2">
              <svg className="animate-spin text-white w-full h-full" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(uploadProgress)}%
            </span>
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={fileUrl}
            alt="채팅 이미지 (확대)"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
