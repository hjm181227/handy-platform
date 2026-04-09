import React from 'react';
import type { MembershipLevel } from '@handy-platform/shared';
import { MEMBERSHIP_LEVELS, MEMBERSHIP_STYLES, getMembershipStyle } from '../../utils/membershipUtils';

interface MembershipInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel?: MembershipLevel;
}

export const MembershipInfoModal: React.FC<MembershipInfoModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">회원등급 안내</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 등급 목록 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {MEMBERSHIP_LEVELS.map((level) => {
              const style = MEMBERSHIP_STYLES[level];
              const isCurrentLevel = level === currentLevel;

              return (
                <div
                  key={level}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrentLevel
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* 등급 아이콘 */}
                    <div
                      className={`w-10 h-10 ${style.bg} text-white rounded-full flex items-center justify-center font-bold`}
                    >
                      {style.label}
                    </div>

                    {/* 등급명 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${style.textColor}`}>
                          {style.fullName}
                        </span>
                        {isCurrentLevel && (
                          <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                            현재 등급
                          </span>
                        )}
                      </div>
                      {style.description && (
                        <p className="text-sm text-gray-600">{style.description}</p>
                      )}
                    </div>
                  </div>

                  {/* 혜택 및 조건 */}
                  {(style.benefit || style.requirement) && (
                    <div className="ml-13 pl-13 space-y-1 text-sm">
                      {style.benefit && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0">혜택:</span>
                          <span className="text-gray-700">{style.benefit}</span>
                        </div>
                      )}
                      {style.requirement && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0">조건:</span>
                          <span className="text-gray-700">{style.requirement}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipInfoModal;
