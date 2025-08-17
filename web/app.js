// Shopping Mall Web App
class ShoppingApp {
    constructor() {
        this.currentPage = 'home';
        this.currentUser = null;
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.pendingRequests = new Map(); // Track pending requests
        this.currentFilters = {
            category: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: 12
        };
        
        this.init();
    }

    init() {
        this.setupNativeBridge();
        this.loadInitialData();
        this.setupEventListeners();
        this.showHome();
    }

    // Native Bridge Communication
    setupNativeBridge() {
        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleNativeMessage(message);
            } catch (error) {
                console.error('Error parsing native message:', error);
            }
        });

        // Listen for custom native message events
        window.addEventListener('nativeMessage', (event) => {
            this.handleNativeMessage(event.detail);
        });
    }

    handleNativeMessage(message) {
        switch (message.type) {
            case 'API_RESPONSE':
                this.handleApiResponse(message.data);
                break;
            case 'AUTH_RESPONSE':
                this.handleAuthResponse(message.data);
                break;
            case 'CART_RESPONSE':
                this.handleCartResponse(message.data);
                break;
            case 'CAMERA_RESPONSE':
                this.handleCameraResponse(message.data);
                break;
            case 'PAYMENT_RESPONSE':
                this.handlePaymentResponse(message.data);
                break;
            case 'PERMISSIONS_RESPONSE':
                this.handlePermissionsResponse(message.data);
                break;
            default:
                console.log('Unknown native message:', message);
        }
    }

    // API Communication with React Native
    callNativeAPI(endpoint, data = {}) {
        if (window.ReactNativeWebView) {
            const requestId = Date.now().toString();
            window.ReactNativeWebView.callAPI(endpoint, data, requestId);
            return requestId;
        } else {
            // Fallback for web-only testing
            console.log('Native API call:', endpoint, data);
            return this.mockApiCall(endpoint, data);
        }
    }

    // Mock API for web testing
    mockApiCall(endpoint, data) {
        setTimeout(() => {
            let mockResponse = { success: true, result: {} };
            
            switch (endpoint) {
                case 'getProducts':
                    mockResponse.result = this.getMockProducts(data);
                    break;
                case 'getCategories':
                    mockResponse.result = { categories: this.getMockCategories() };
                    break;
                case 'getFeaturedProducts':
                    mockResponse.result = { products: this.getMockFeaturedProducts() };
                    break;
                case 'getCart':
                    mockResponse.result = { cart: { items: this.cart, totalItems: this.cart.length, totalAmount: this.calculateCartTotal() } };
                    break;
                default:
                    mockResponse.result = { message: 'Mock response' };
            }
            
            this.handleApiResponse(mockResponse);
        }, 500);
    }

    // Event Handlers
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchProducts();
                }
            });
        }

        // Close side menu when clicking outside
        document.addEventListener('click', (e) => {
            const sideMenu = document.getElementById('sideMenu');
            const menuBtn = document.querySelector('.menu-btn');
            if (sideMenu && !sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                this.closeSideMenu();
            }
        });
    }

    // Navigation Functions
    showHome() {
        this.switchPage('homeSection');
        this.currentPage = 'home';
        this.loadHomeData();
    }

    showProducts() {
        this.switchPage('productsSection');
        this.currentPage = 'products';
        this.loadProducts();
    }

    showProductDetail(productId) {
        this.switchPage('productDetailSection');
        this.currentPage = 'productDetail';
        this.loadProductDetail(productId);
    }

    showCart() {
        this.switchPage('cartSection');
        this.currentPage = 'cart';
        this.loadCart();
    }

    showProfile() {
        this.switchPage('profileSection');
        this.currentPage = 'profile';
        this.loadProfile();
    }

    switchPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }

    // Data Loading Functions
    loadInitialData() {
        this.callNativeAPI('getCategories');
        this.callNativeAPI('getFeaturedProducts');
        this.loadCartCount();
    }

    loadHomeData() {
        this.callNativeAPI('getCategories');
        this.callNativeAPI('getFeaturedProducts');
        this.loadCategories();
    }

    loadProducts() {
        this.showLoading();
        this.callNativeAPI('getProducts', this.currentFilters);
    }

    loadProductDetail(productId) {
        this.showLoading();
        this.callNativeAPI('getProduct', { id: productId });
    }

    loadCart() {
        this.callNativeAPI('getCart');
    }

    loadProfile() {
        if (this.currentUser) {
            this.renderProfile();
        } else {
            this.renderLoginForm();
        }
    }

    loadCartCount() {
        this.callNativeAPI('getCartCount');
    }

    // Search Functions
    showSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        
        if (searchContainer.style.display === 'none') {
            searchContainer.style.display = 'block';
            searchInput.focus();
        } else {
            searchContainer.style.display = 'none';
        }
    }

    searchProducts() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();
        
        if (query) {
            this.currentFilters.search = query;
            this.currentFilters.page = 1;
            this.showProducts();
        }
    }

    // Filter Functions
    filterProducts() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        this.currentFilters.category = categoryFilter.value;
        
        if (sortFilter.value) {
            const [sortBy, sortOrder] = sortFilter.value.split('_');
            this.currentFilters.sortBy = sortBy;
            this.currentFilters.sortOrder = sortOrder;
        }
        
        this.currentFilters.page = 1;
        this.loadProducts();
    }

    // Cart Functions
    addToCart(productId, quantity = 1) {
        this.callNativeAPI('addToCart', { productId, quantity });
        this.showToast('상품이 장바구니에 추가되었습니다.');
    }

    updateCartItem(productId, quantity) {
        this.callNativeAPI('updateCartItem', { productId, quantity });
    }

    removeFromCart(productId) {
        this.callNativeAPI('removeFromCart', { productId });
    }

    clearCart() {
        if (confirm('장바구니를 비우시겠습니까?')) {
            this.callNativeAPI('clearCart');
        }
    }

    calculateCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    // Auth Functions
    login(email, password) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.auth('login', { email, password });
        } else {
            // Mock login for web testing
            this.currentUser = { name: '테스트 사용자', email: email };
            this.updateUserDisplay();
            this.showToast('로그인되었습니다.');
        }
    }

    logout() {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.auth('logout');
        } else {
            this.currentUser = null;
            this.updateUserDisplay();
            this.showToast('로그아웃되었습니다.');
        }
    }

    updateUserDisplay() {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = this.currentUser ? this.currentUser.name : '게스트';
        }
    }

    // Menu Functions
    toggleMenu() {
        const sideMenu = document.getElementById('sideMenu');
        sideMenu.classList.toggle('open');
    }

    closeSideMenu() {
        const sideMenu = document.getElementById('sideMenu');
        sideMenu.classList.remove('open');
    }

    // UI Helper Functions
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.add('show');
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('show');
    }

    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 3000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(price);
    }

    // Response Handlers
    handleApiResponse(data) {
        this.hideLoading();
        
        if (data.success) {
            // Handle different API responses based on the current context
            if (data.result.products) {
                this.renderProducts(data.result.products, data.result.pagination);
            } else if (data.result.product) {
                this.renderProductDetail(data.result.product);
            } else if (data.result.categories) {
                this.categories = data.result.categories;
                this.renderCategories();
                this.updateCategoryFilter();
            } else if (data.result.cart) {
                this.cart = data.result.cart.items || [];
                this.renderCart();
                this.updateCartCount(data.result.cart.totalItems || 0);
            } else if (data.result.count !== undefined) {
                this.updateCartCount(data.result.count);
            }
        } else {
            this.showToast(data.error || 'API 오류가 발생했습니다.', 'error');
        }
    }

    handleAuthResponse(data) {
        if (data.success) {
            this.currentUser = data.result.user;
            this.updateUserDisplay();
            this.showToast('인증이 완료되었습니다.');
        } else {
            this.showToast(data.error || '인증에 실패했습니다.', 'error');
        }
    }

    handleCartResponse(data) {
        if (data.success) {
            this.loadCartCount();
            if (this.currentPage === 'cart') {
                this.loadCart();
            }
        } else {
            this.showToast(data.error || '장바구니 작업에 실패했습니다.', 'error');
        }
    }

    handleCameraResponse(data) {
        this.hideLoading();
        
        if (data.success) {
            const result = data.result;
            
            // Handle QR code scan results
            if (result.type === 'QR_SCAN') {
                this.handleQRCodeResult(result);
                return;
            }
            
            // Handle photo capture results
            this.showToast('사진이 성공적으로 처리되었습니다.');
            
            // Display the captured image if we're on product detail page
            if (this.currentPage === 'productDetail' && result.productId) {
                this.displayCapturedImage(result);
            }
            
            // You could also upload the image to the server here
            if (result.base64) {
                console.log('Image captured:', result.fileName, result.fileSize);
                // this.uploadProductImage(result.productId, result.base64);
            }
        } else {
            this.showToast(data.error || '카메라 작업에 실패했습니다.', 'error');
        }
        
        // Clean up pending request
        if (data.requestId) {
            this.pendingRequests.delete(data.requestId);
        }
    }

    handleQRCodeResult(qrResult) {
        this.showToast('QR 코드를 스캔했습니다!');
        
        // Parse QR code data
        const qrData = qrResult.data;
        console.log('QR Code Data:', qrData, 'Type:', qrResult.qrType);
        
        // Handle different types of QR codes
        if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
            // URL QR code
            if (qrData.includes('/product/')) {
                // Product URL - extract product ID and navigate
                const productId = this.extractProductIdFromUrl(qrData);
                if (productId) {
                    this.showProductDetail(productId);
                    return;
                }
            }
            
            // Generic URL - show confirmation dialog
            if (confirm(`다음 링크로 이동하시겠습니까?\\n${qrData}`)) {
                window.open(qrData, '_blank');
            }
        } else if (this.isProductBarcode(qrData)) {
            // Product barcode - search for product
            this.searchProductByBarcode(qrData);
        } else {
            // Generic QR code data
            alert(`QR 코드 내용:\\n${qrData}`);
        }
    }

    extractProductIdFromUrl(url) {
        const match = url.match(/\/product\/([^\/\?]+)/);
        return match ? match[1] : null;
    }

    isProductBarcode(data) {
        // Simple check for product barcode format (8-13 digits)
        return /^\\d{8,13}$/.test(data);
    }

    searchProductByBarcode(barcode) {
        this.showToast('바코드로 상품을 검색합니다...');
        this.currentFilters.barcode = barcode;
        this.currentFilters.page = 1;
        this.showProducts();
    }

    handlePaymentResponse(data) {
        this.hideLoading();
        
        if (data.success) {
            const result = data.result;
            this.showToast('결제가 완료되었습니다!');
            
            // Clear cart on successful payment
            this.cart = [];
            this.updateCartCount(0);
            
            // Show payment success details
            this.showPaymentSuccess(result);
            
            // Navigate to order confirmation or home
            this.showHome();
        } else {
            this.showToast(data.error || '결제에 실패했습니다.', 'error');
        }
        
        // Clean up pending request
        if (data.requestId) {
            this.pendingRequests.delete(data.requestId);
        }
    }

    handlePermissionsResponse(data) {
        if (data.success && data.granted) {
            this.showToast(`${this.getPermissionName(data.type)} 권한이 허용되었습니다.`);
        } else {
            this.showToast(`${this.getPermissionName(data.type)} 권한이 거부되었습니다.`, 'warning');
        }
        
        // Clean up pending request
        if (data.requestId) {
            this.pendingRequests.delete(data.requestId);
        }
    }

    // Helper methods for enhanced functionality
    trackRequest(requestId, type) {
        this.pendingRequests.set(requestId, { type, timestamp: Date.now() });
    }

    displayCapturedImage(imageData) {
        const container = document.getElementById('productDetailContent');
        if (container && imageData.uri) {
            const imagePreview = document.createElement('div');
            imagePreview.className = 'captured-image-preview';
            imagePreview.innerHTML = `
                <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                    <h4>촬영된 사진</h4>
                    <img src="${imageData.uri}" alt="촬영된 상품 사진" style="max-width: 100%; height: auto; border-radius: 6px; margin-top: 8px;">
                    <p style="margin-top: 8px; font-size: 14px; color: #666;">
                        파일명: ${imageData.fileName || 'photo.jpg'} 
                        ${imageData.fileSize ? `(${(imageData.fileSize / 1024).toFixed(1)}KB)` : ''}
                    </p>
                </div>
            `;
            
            // Remove any existing preview
            const existing = container.querySelector('.captured-image-preview');
            if (existing) {
                existing.remove();
            }
            
            // Insert after product detail header
            const headerElement = container.querySelector('.product-detail-header');
            if (headerElement) {
                headerElement.parentNode.insertBefore(imagePreview, headerElement.nextSibling);
            } else {
                container.appendChild(imagePreview);
            }
        }
    }

    showPaymentSuccess(paymentResult) {
        const message = `
            결제가 완료되었습니다!
            
            거래번호: ${paymentResult.transactionId}
            결제금액: ${this.formatPrice(paymentResult.amount)}
            결제수단: ${this.getPaymentMethodName(paymentResult.method)}
            결제시간: ${new Date(paymentResult.timestamp).toLocaleString('ko-KR')}
        `;
        
        alert(message);
    }

    getPermissionName(type) {
        const names = {
            camera: '카메라',
            storage: '저장소',
            location: '위치'
        };
        return names[type] || type;
    }

    getPaymentMethodName(method) {
        const names = {
            card: '신용카드',
            bank_transfer: '계좌이체',
            mobile: '휴대폰',
            kakaopay: '카카오페이',
            naverpay: '네이버페이',
            payco: '페이코'
        };
        return names[method] || method;
    }

    // Render Functions
    renderCategories() {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;

        const categoryIcons = {
            'electronics': '📱',
            'clothing': '👕',
            'books': '📚',
            'home': '🏠',
            'sports': '⚽',
            'beauty': '💄',
            'toys': '🧸',
            'food': '🍔',
            'other': '📦'
        };

        container.innerHTML = this.categories.map(category => `
            <div class="category-card" onclick="app.filterByCategory('${category}')">
                <div class="category-icon">${categoryIcons[category] || '📦'}</div>
                <div class="category-name">${this.getCategoryName(category)}</div>
            </div>
        `).join('');
    }

    renderProducts(products, pagination) {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div class="no-products">상품이 없습니다.</div>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="app.showProductDetail('${product.id}')">
                <div class="product-image">
                    ${product.mainImage ? `<img src="${product.mainImage.url}" alt="${product.name}">` : '📦'}
                </div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">${this.formatPrice(product.price)}</div>
                    <div class="product-rating">⭐ ${product.rating.average} (${product.rating.count})</div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.addToCart('${product.id}')">
                            장바구니
                        </button>
                        <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); app.addToWishlist('${product.id}')">
                            ❤️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Render pagination
        if (pagination) {
            this.renderPagination(pagination);
        }
    }

    renderProductDetail(product) {
        const container = document.getElementById('productDetailContent');
        if (!container) return;

        container.innerHTML = `
            <div class="product-detail">
                <button class="btn btn-outline" onclick="app.showProducts()" style="margin-bottom: 20px;">← 상품 목록으로</button>
                <div class="product-detail-header">
                    <div class="product-detail-image">
                        ${product.mainImage ? `<img src="${product.mainImage.url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '📦'}
                    </div>
                    <div class="product-detail-info">
                        <h2>${product.name}</h2>
                        <div class="product-detail-price">${this.formatPrice(product.price)}</div>
                        <div class="product-detail-rating">⭐ ${product.rating.average} (${product.rating.count}개 리뷰)</div>
                        <div class="product-detail-actions">
                            <button class="btn btn-primary" onclick="app.addToCart('${product.id}')">장바구니 담기</button>
                            <button class="btn btn-outline" onclick="app.addToWishlist('${product.id}')">위시리스트</button>
                            <div class="camera-actions" style="display: flex; gap: 8px; margin-top: 12px;">
                                <button class="btn btn-outline" onclick="app.takeProductPhoto('${product.id}')">📷 사진 촬영</button>
                                <button class="btn btn-outline" onclick="app.chooseFromGallery('${product.id}')">🖼️ 갤러리에서 선택</button>
                            </div>
                        </div>
                        <div class="product-seller">
                            <strong>판매자:</strong> ${product.seller.sellerInfo.companyName}
                        </div>
                    </div>
                </div>
                <div class="product-detail-description">
                    <h3>상품 설명</h3>
                    <p>${product.description}</p>
                    ${product.specifications ? this.renderSpecifications(product.specifications) : ''}
                </div>
                ${product.reviews ? this.renderReviews(product.reviews) : ''}
            </div>
        `;
    }

    renderCart() {
        const container = document.getElementById('cartContent');
        const summary = document.getElementById('cartSummary');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<div class="empty-cart">장바구니가 비어있습니다.</div>';
            summary.style.display = 'none';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.product.mainImage ? `<img src="${item.product.mainImage.url}" alt="${item.product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">` : '📦'}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.product.name}</div>
                    <div class="cart-item-price">${this.formatPrice(item.product.price)}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="app.updateCartItem('${item.product.id}', ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="app.updateCartItem('${item.product.id}', this.value)">
                        <button class="quantity-btn" onclick="app.updateCartItem('${item.product.id}', ${item.quantity + 1})">+</button>
                        <button class="btn btn-outline btn-small" onclick="app.removeFromCart('${item.product.id}')" style="margin-left: 12px;">삭제</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update cart summary
        const subtotal = this.calculateCartTotal();
        const shipping = subtotal >= 50000 ? 0 : 3000; // Free shipping over 50,000원
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);
        document.getElementById('shipping').textContent = this.formatPrice(shipping);
        document.getElementById('total').textContent = this.formatPrice(total);
        
        summary.style.display = 'block';
    }

    renderProfile() {
        const container = document.getElementById('profileContent');
        if (!container) return;

        if (this.currentUser) {
            container.innerHTML = `
                <div class="profile-section">
                    <h3>프로필 정보</h3>
                    <div class="profile-info">
                        <p><strong>이름:</strong> ${this.currentUser.name}</p>
                        <p><strong>이메일:</strong> ${this.currentUser.email}</p>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-primary" onclick="app.showOrders()">주문 내역</button>
                        <button class="btn btn-outline" onclick="app.logout()">로그아웃</button>
                    </div>
                </div>
            `;
        } else {
            this.renderLoginForm();
        }
    }

    renderLoginForm() {
        const container = document.getElementById('profileContent');
        if (!container) return;

        container.innerHTML = `
            <div class="login-form">
                <h3>로그인</h3>
                <form onsubmit="app.handleLogin(event)">
                    <div class="form-group">
                        <label>이메일:</label>
                        <input type="email" name="email" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-top: 4px;">
                    </div>
                    <div class="form-group" style="margin-top: 16px;">
                        <label>비밀번호:</label>
                        <input type="password" name="password" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-top: 4px;">
                    </div>
                    <button type="submit" class="btn btn-primary full-width" style="margin-top: 20px;">로그인</button>
                </form>
            </div>
        `;
    }

    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container || !pagination) return;

        const { currentPage, totalPages, hasNext, hasPrev } = pagination;
        let paginationHTML = '';

        // Previous button
        paginationHTML += `<button ${!hasPrev ? 'disabled' : ''} onclick="app.goToPage(${currentPage - 1})">이전</button>`;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="app.goToPage(${i})">${i}</button>`;
        }

        // Next button
        paginationHTML += `<button ${!hasNext ? 'disabled' : ''} onclick="app.goToPage(${currentPage + 1})">다음</button>`;

        container.innerHTML = paginationHTML;
    }

    // Helper Functions
    getCategoryName(category) {
        const names = {
            'electronics': '전자제품',
            'clothing': '의류',
            'books': '도서',
            'home': '홈&리빙',
            'sports': '스포츠',
            'beauty': '뷰티',
            'toys': '완구',
            'food': '식품',
            'other': '기타'
        };
        return names[category] || category;
    }

    filterByCategory(category) {
        this.currentFilters.category = category;
        this.currentFilters.page = 1;
        this.showProducts();
    }

    goToPage(page) {
        this.currentFilters.page = page;
        this.loadProducts();
    }

    updateCartCount(count) {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = count || 0;
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && this.categories) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">모든 카테고리</option>' +
                this.categories.map(category => 
                    `<option value="${category}">${this.getCategoryName(category)}</option>`
                ).join('');
            categoryFilter.value = currentValue;
        }
    }

    handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        this.login(email, password);
    }

    takeProductPhoto(productId) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.camera) {
            const requestId = window.ReactNativeWebView.camera('takePhoto', { productId });
            this.trackRequest(requestId, 'camera');
        } else {
            this.showToast('카메라 기능은 앱에서만 사용 가능합니다.', 'warning');
        }
    }

    chooseFromGallery(productId) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.camera) {
            const requestId = window.ReactNativeWebView.camera('choosePhoto', { productId });
            this.trackRequest(requestId, 'camera');
        } else {
            this.showToast('갤러리 기능은 앱에서만 사용 가능합니다.', 'warning');
        }
    }

    requestPermission(type) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.requestPermission) {
            const requestId = window.ReactNativeWebView.requestPermission(type);
            this.trackRequest(requestId, 'permission');
        } else {
            this.showToast('권한 요청은 앱에서만 사용 가능합니다.', 'warning');
        }
    }

    processPayment(paymentData) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.payment) {
            const requestId = window.ReactNativeWebView.payment(paymentData.method, paymentData);
            this.trackRequest(requestId, 'payment');
            this.showLoading();
        } else {
            // Fallback for web testing
            this.showToast('결제 기능을 구현 중입니다.', 'warning');
        }
    }

    scanQRCode() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.camera) {
            const requestId = window.ReactNativeWebView.camera('scanQR');
            this.trackRequest(requestId, 'qr_scan');
            this.showLoading();
        } else {
            this.showToast('QR 코드 스캔은 앱에서만 사용 가능합니다.', 'warning');
        }
    }

    scanProductBarcode() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.camera) {
            const requestId = window.ReactNativeWebView.camera('scanQR');
            this.trackRequest(requestId, 'barcode_scan');
            this.showLoading();
        } else {
            this.showToast('바코드 스캔은 앱에서만 사용 가능합니다.', 'warning');
        }
    }

    addToWishlist(productId) {
        this.callNativeAPI('addToWishlist', { productId });
        this.showToast('위시리스트에 추가되었습니다.');
    }

    showOrders() {
        // Implementation for showing orders
        this.showToast('주문 내역 기능을 구현 중입니다.', 'warning');
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showToast('장바구니가 비어있습니다.', 'warning');
            return;
        }
        
        // Show payment method selection
        this.showPaymentMethodSelection();
    }

    showPaymentMethodSelection() {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 2001;
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="margin-bottom: 20px;">결제 방법 선택</h3>
                <div class="payment-methods" style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="payment-method-btn" onclick="app.selectPaymentMethod('card')" style="
                        padding: 16px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        text-align: left;
                        transition: background-color 0.2s;
                    ">
                        💳 신용카드/체크카드
                    </button>
                    <button class="payment-method-btn" onclick="app.selectPaymentMethod('kakaopay')" style="
                        padding: 16px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        text-align: left;
                        transition: background-color 0.2s;
                    ">
                        💛 카카오페이
                    </button>
                    <button class="payment-method-btn" onclick="app.selectPaymentMethod('naverpay')" style="
                        padding: 16px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        text-align: left;
                        transition: background-color 0.2s;
                    ">
                        💚 네이버페이
                    </button>
                    <button class="payment-method-btn" onclick="app.selectPaymentMethod('bank_transfer')" style="
                        padding: 16px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        text-align: left;
                        transition: background-color 0.2s;
                    ">
                        🏦 계좌이체
                    </button>
                </div>
                <button onclick="app.closePaymentModal()" style="
                    margin-top: 20px;
                    width: 100%;
                    padding: 12px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                ">취소</button>
            </div>
            <div class="payment-modal-backdrop" onclick="app.closePaymentModal()" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 2000;
            "></div>
        `;
        
        document.body.appendChild(modal);
    }

    selectPaymentMethod(method) {
        this.closePaymentModal();
        
        const subtotal = this.calculateCartTotal();
        const shipping = subtotal >= 50000 ? 0 : 3000;
        const total = subtotal + shipping;
        
        const paymentData = {
            method: method,
            amount: total,
            orderInfo: {
                items: this.cart,
                subtotal: subtotal,
                shipping: shipping,
                total: total
            },
            customerInfo: this.currentUser,
            timestamp: new Date().toISOString()
        };
        
        this.processPayment(paymentData);
    }

    closePaymentModal() {
        const modal = document.querySelector('.payment-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    // Mock Data for Web Testing
    getMockProducts(filters = {}) {
        const mockProducts = [
            {
                id: '1',
                name: '스마트폰 갤럭시 S23',
                price: 899000,
                category: 'electronics',
                rating: { average: 4.5, count: 120 },
                mainImage: null,
                seller: { sellerInfo: { companyName: '삼성전자' } }
            },
            {
                id: '2',
                name: '무선 이어폰 에어팟',
                price: 249000,
                category: 'electronics',
                rating: { average: 4.8, count: 89 },
                mainImage: null,
                seller: { sellerInfo: { companyName: '애플코리아' } }
            },
            {
                id: '3',
                name: '캐주얼 티셔츠',
                price: 29000,
                category: 'clothing',
                rating: { average: 4.2, count: 45 },
                mainImage: null,
                seller: { sellerInfo: { companyName: '유니클로' } }
            }
        ];

        return {
            products: mockProducts.slice(0, filters.limit || 12),
            pagination: {
                currentPage: filters.page || 1,
                totalPages: 3,
                hasNext: true,
                hasPrev: false
            }
        };
    }

    getMockCategories() {
        return ['electronics', 'clothing', 'books', 'home', 'sports'];
    }

    getMockFeaturedProducts() {
        return this.getMockProducts().products.slice(0, 3);
    }

    renderSpecifications(specs) {
        return `
            <div class="specifications">
                <h4>상품 사양</h4>
                <ul>
                    ${Object.entries(specs).map(([key, value]) => 
                        `<li><strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }

    renderReviews(reviews) {
        return `
            <div class="reviews">
                <h4>리뷰 (${reviews.length}개)</h4>
                ${reviews.map(review => `
                    <div class="review-item" style="border-bottom: 1px solid #eee; padding: 16px 0;">
                        <div class="review-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>${review.user.name}</strong>
                            <span>⭐ ${review.rating}</span>
                        </div>
                        <p>${review.comment}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Global Functions for HTML onclick handlers
function toggleMenu() { app.toggleMenu(); }
function showSearch() { app.showSearch(); }
function showCart() { app.showCart(); }
function showProfile() { app.showProfile(); }
function showHome() { app.showHome(); }
function showProducts() { app.showProducts(); }
function showFeatured() { app.showProducts(); }
function searchProducts() { app.searchProducts(); }
function filterProducts() { app.filterProducts(); }
function clearCart() { app.clearCart(); }
function logout() { app.logout(); }
function showOrders() { app.showOrders(); }
function checkout() { app.checkout(); }

// New enhanced functionality
function selectPaymentMethod(method) { app.selectPaymentMethod(method); }
function closePaymentModal() { app.closePaymentModal(); }
function takeProductPhoto(productId) { app.takeProductPhoto(productId); }
function chooseFromGallery(productId) { app.chooseFromGallery(productId); }
function requestPermission(type) { app.requestPermission(type); }
function scanQRCode() { app.scanQRCode(); }
function scanProductBarcode() { app.scanProductBarcode(); }

// Initialize the app when the page loads
const app = new ShoppingApp();