
export function FooterMega({ onGo }: { onGo: (to: string) => void }) {
  return (
    <footer className="mt-20 bg-gray-50 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-lg mb-4">HANDY</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              네일아트의 새로운 기준을 제시하는 핸디와 함께 
              나만의 스타일을 완성하세요.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">쇼핑</h4>
            <div className="space-y-2 text-sm">
              <a href="/brands" onClick={(e) => {e.preventDefault(); onGo("/brands");}} className="block text-gray-600 hover:text-black">브랜드</a>
              <a href="/new" onClick={(e) => {e.preventDefault(); onGo("/new");}} className="block text-gray-600 hover:text-black">신상품</a>
              <a href="/sale" onClick={(e) => {e.preventDefault(); onGo("/sale");}} className="block text-gray-600 hover:text-black">세일</a>
              <a href="/ranking" onClick={(e) => {e.preventDefault(); onGo("/ranking");}} className="block text-gray-600 hover:text-black">랭킹</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">고객지원</h4>
            <div className="space-y-2 text-sm">
              <a href="/help" onClick={(e) => {e.preventDefault(); onGo("/help");}} className="block text-gray-600 hover:text-black">고객센터</a>
              <a href="/help" onClick={(e) => {e.preventDefault(); onGo("/help");}} className="block text-gray-600 hover:text-black">FAQ</a>
              <a href="tel:1544-7199" className="block text-gray-600 hover:text-black">1544-7199</a>
              <a href="mailto:cs@handy.com" className="block text-gray-600 hover:text-black">cs@handy.com</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">소식</h4>
            <div className="space-y-2 text-sm">
              <a href="/news" onClick={(e) => {e.preventDefault(); onGo("/news");}} className="block text-gray-600 hover:text-black">뉴스</a>
              <a href="/snap" onClick={(e) => {e.preventDefault(); onGo("/snap");}} className="block text-gray-600 hover:text-black">SNAP</a>
              <div className="pt-2">
                <p className="text-gray-500 text-xs mb-2">팔로우</p>
                <div className="flex gap-2">
                  <a href="#" className="text-gray-400 hover:text-gray-600">Instagram</a>
                  <a href="#" className="text-gray-400 hover:text-gray-600">YouTube</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p>© 2025 HANDY. All rights reserved.</p>
              <p>사업자등록번호: 000-00-00000 | 통신판매업신고: 제2025-서울-0000호</p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-700">이용약관</a>
              <a href="#" className="hover:text-gray-700">개인정보처리방침</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}