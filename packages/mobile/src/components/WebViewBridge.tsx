import React, { useRef, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid, Linking, DeviceEventEmitter } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cameraService } from '../services/cameraService';
import { WebViewMessage } from '@handy-platform/shared';
import { mobileApiService } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@handy-platform/shared/src/config/api';
import { getAppEnvironment } from '../config/environment';

interface WebViewBridgeProps {
  url: string;
  onNavigationStateChange?: (navState: any) => void;
  additionalJavaScript?: string;
  onShowNativeFeatures?: () => void;
}

const WebViewBridge = React.forwardRef<WebView, WebViewBridgeProps>((
  { url, onNavigationStateChange, additionalJavaScript = '', onShowNativeFeatures },
  ref
) => {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  // forwardRef로 전달받은 ref를 내부 ref와 동기화
  React.useImperativeHandle(ref, () => webViewRef.current as WebView);

  const handleMessage = async (event: any) => {
    try {
      console.log('🟢 [BRIDGE] 메시지 수신:', event.nativeEvent.data);
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('🟢 [BRIDGE] 파싱된 메시지:', message);

      switch (message.type) {
        case 'API_CALL':
          await handleApiCall(message.data);
          break;
        case 'AUTH':
          await handleAuth(message.data);
          break;
        case 'STORE_AUTH_TOKEN':
          await handleStoreAuthToken(message.data);
          break;
        case 'CART':
          await handleCart(message.data);
          break;
        case 'NOTIFICATION':
          handleNotification(message.data);
          break;
        case 'CAMERA':
          await handleCamera(message.data);
          break;
        case 'PAYMENT':
          await handlePayment(message.data);
          break;
        case 'PERMISSIONS':
          await handlePermissions(message.data);
          break;
        case 'SHOW_NATIVE_FEATURES':
          console.log('🟢 [BRIDGE] SHOW_NATIVE_FEATURES 메시지 처리');
          if (onShowNativeFeatures) {
            console.log('🟢 [BRIDGE] onShowNativeFeatures 콜백 호출');
            onShowNativeFeatures();
          } else {
            console.log('🔴 [BRIDGE] onShowNativeFeatures 콜백이 없음');
          }
          break;
        case 'REQUEST_TOKEN':
          await handleRequestToken();
          break;
        case 'NAVIGATE_TO_MEASUREMENT':
          handleNavigateToMeasurement(message.data);
          break;
        case 'NAVIGATE_TO_SIZES':
          handleNavigateToSizes(message.data);
          break;
        case 'NAVIGATE_BACK':
          handleNavigateBack();
          break;
        case 'OAUTH':
          await handleOAuth(message.data);
          break;
        case 'CHAT':
          await handleChat(message.data);
          break;
        case 'closeChat':
          console.log('🔵 [BRIDGE] closeChat 메시지 수신');
          DeviceEventEmitter.emit('closeChat');
          break;
        default:
          console.log('🔴 [BRIDGE] 알 수 없는 메시지 타입:', message.type);
      }
    } catch (error) {
      console.error('🔴 [BRIDGE] WebView 메시지 처리 오류:', error);
    }
  };

  const handleApiCall = async (data: any) => {
    try {
      let result;
      switch (data.endpoint) {
        case 'getProducts':
          result = await mobileApiService.product.getProducts({ page: data.page, limit: data.limit });
          break;
        case 'getProduct':
          result = await mobileApiService.product.getProduct(data.id);
          break;
        case 'getCart':
          result = await mobileApiService.cart.getCart();
          break;
        case 'getOrders':
          result = await mobileApiService.order.getOrders();
          break;
        default:
          throw new Error(`Unknown API endpoint: ${data.endpoint}`);
      }

      sendMessageToWebView({
        type: 'API_RESPONSE',
        data: { success: true, result, requestId: data.requestId },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'API_RESPONSE',
        data: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: data.requestId 
        },
      });
    }
  };

  const handleAuth = async (data: any) => {
    try {
      let result;
      switch (data.action) {
        case 'login':
          result = await mobileApiService.loginAndStoreToken({ email: data.email, password: data.password });
          break;
        case 'register':
          result = await mobileApiService.registerAndStoreToken(data);
          break;
        case 'logout':
          console.log('🔵 [BRIDGE] 로그아웃 처리 시작');
          await mobileApiService.logoutAndClearToken();
          result = { success: true };

          // WebView의 인증 정보만 클리어 (리다이렉트는 네이티브에서 처리)
          console.log('🔵 [BRIDGE] WebView 인증 정보 클리어');
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              (function() {
                console.log('🔵 [WEBVIEW] 인증 정보 클리어 시작');

                // 인증 관련 키만 삭제 (다른 설정/캐시는 유지)
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');

                // sessionStorage의 인증 관련 정보도 삭제
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('user');

                console.log('✅ [WEBVIEW] 인증 정보 클리어 완료');

                // authStateChanged 이벤트 발생
                window.dispatchEvent(new CustomEvent('authStateChanged'));
              })();
              true;
            `);
          }

          // 홈 탭으로 이동 및 로그인 화면 표시 이벤트 발생
          console.log('🔵 [BRIDGE] navigateToHomeAndLogin 이벤트 발생');
          DeviceEventEmitter.emit('navigateToHomeAndLogin');
          console.log('✅ [BRIDGE] 로그아웃 처리 완료');
          break;
        default:
          throw new Error(`Unknown auth action: ${data.action}`);
      }

      sendMessageToWebView({
        type: 'AUTH_RESPONSE',
        data: { success: true, result },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'AUTH_RESPONSE',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        },
      });
    }
  };

  const handleStoreAuthToken = async (data: any) => {
    try {
      console.log('🟢 [BRIDGE] 웹에서 토큰 저장 요청:', { hasToken: !!data.token, hasUser: !!data.user });

      if (!data.token) {
        throw new Error('Token is required');
      }

      // AsyncStorage에 토큰과 사용자 정보 저장
      await AsyncStorage.setItem('@handy_platform:accessToken', data.token);

      if (data.user) {
        await AsyncStorage.setItem('@handy_platform:user', JSON.stringify(data.user));
      }

      console.log('🟢 [BRIDGE] 토큰이 AsyncStorage에 저장됨');

      sendMessageToWebView({
        type: 'STORE_AUTH_TOKEN_RESPONSE',
        data: { success: true },
      });
    } catch (error) {
      console.error('🔴 [BRIDGE] 토큰 저장 실패:', error);
      sendMessageToWebView({
        type: 'STORE_AUTH_TOKEN_RESPONSE',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to store token'
        },
      });
    }
  };

  const handleRequestToken = async () => {
    try {
      console.log('🟢 [BRIDGE] 웹에서 토큰 요청');

      // AsyncStorage에서 토큰과 사용자 정보 조회
      const token = await AsyncStorage.getItem('@handy_platform:accessToken');
      const userStr = await AsyncStorage.getItem('@handy_platform:user');

      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.warn('🔴 [BRIDGE] 사용자 정보 파싱 실패:', e);
        }
      }

      console.log('🟢 [BRIDGE] 토큰 응답:', { hasToken: !!token, hasUser: !!user });

      sendMessageToWebView({
        type: 'TOKEN_RESPONSE',
        data: {
          success: true,
          token,
          user
        },
      });
    } catch (error) {
      console.error('🔴 [BRIDGE] 토큰 조회 실패:', error);
      sendMessageToWebView({
        type: 'TOKEN_RESPONSE',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get token'
        },
      });
    }
  };

  /**
   * 손톱 사이즈 측정 화면으로 네비게이션
   */
  const handleNavigateToMeasurement = (data: any) => {
    console.log('🔵 [BRIDGE] Navigate to Measurement screen:', data);
    DeviceEventEmitter.emit('navigateToMeasurement', data);
  };

  /**
   * 손톱 사이즈 목록 화면으로 네비게이션
   */
  const handleNavigateToSizes = (data: any) => {
    console.log('🔵 [BRIDGE] Navigate to Sizes screen:', data);
    DeviceEventEmitter.emit('navigateToSizes', data);
  };

  /**
   * 뒤로가기
   */
  const handleNavigateBack = () => {
    console.log('🔵 [BRIDGE] Navigate back');
    DeviceEventEmitter.emit('navigateBack');
  };

  /**
   * OAuth 처리 - InAppBrowser로 OAuth 실행
   * Google은 WebView 내 OAuth를 차단하므로 Chrome Custom Tabs / ASWebAuthenticationSession 사용
   *
   * Android: InAppBrowser.open() + preferredBrowserPackage로 Chrome 강제 지정
   *          콜백은 App.tsx의 Deep Link 리스너가 처리
   * iOS: InAppBrowser.openAuth()로 ASWebAuthenticationSession 사용
   */
  const handleOAuth = async (data: any) => {
    const { provider, url: interceptedUrl } = data;
    // 가로챈 URL이 있으면 사용, 없으면 API_CONFIG에서 생성
    const oauthUrl = interceptedUrl
      || (() => {
        const env = getAppEnvironment();
        const apiBaseUrl = API_CONFIG[env]?.baseURL || API_CONFIG.stage.baseURL;
        return `${apiBaseUrl}/api/auth/oauth/${provider}/login?source=app`;
      })();
    const redirectUrl = 'handyapp://oauth-callback';

    console.log(`🔵 [BRIDGE] Opening InAppBrowser for ${provider} OAuth:`, oauthUrl);

    try {
      if (await InAppBrowser.isAvailable()) {
        if (Platform.OS === 'android') {
          // Android: Chrome Custom Tab을 Chrome으로 강제 지정
          // 콜백은 App.tsx Deep Link 리스너가 handyapp://oauth-callback을 캐치
          await InAppBrowser.open(oauthUrl, {
            preferredBrowserPackage: 'com.android.chrome',
            showTitle: true,
            enableUrlBarHiding: false,
            enableDefaultShare: false,
            forceCloseOnRedirection: false,
          });
          // Android: InAppBrowser.open()은 브라우저가 닫힌 후 resolve됨
          // 성공 콜백은 App.tsx Deep Link 리스너가 처리하므로
          // 여기서는 취소(뒤로가기)된 경우를 처리
          console.log(`🟡 [BRIDGE] ${provider} Android InAppBrowser closed`);
          sendMessageToWebView({
            type: 'OAUTH_CANCELLED',
            data: { provider },
          });
        } else {
          // iOS: ASWebAuthenticationSession 사용
          const result = await InAppBrowser.openAuth(oauthUrl, redirectUrl, {
            ephemeralWebSession: false,
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          });

          if (result.type === 'success' && result.url) {
            // 성공: stateId 추출 후 콜백 페이지로 이동
            const queryString = result.url.split('?')[1] || '';
            const stateId = queryString.split('&').reduce((acc: string | null, pair: string) => {
              const [key, value] = pair.split('=');
              return key === 'stateId' ? decodeURIComponent(value) : acc;
            }, null as string | null);
            if (stateId) {
              DeviceEventEmitter.emit('navigateToUrl', {
                url: `/auth/${provider}/callback?stateId=${stateId}`
              });
            }
          } else {
            // 취소/실패: 웹에 취소 알림
            console.log(`🟡 [BRIDGE] ${provider} OAuth cancelled/dismissed`);
            sendMessageToWebView({
              type: 'OAUTH_CANCELLED',
              data: { provider },
            });
          }
        }
      } else {
        Linking.openURL(oauthUrl);
      }
    } catch (error) {
      console.error(`🔴 [BRIDGE] ${provider} OAuth error:`, error);
      sendMessageToWebView({
        type: 'OAUTH_CANCELLED',
        data: { provider, error: 'InAppBrowser error' },
      });
    }
  };

  const handleCart = async (data: any) => {
    try {
      let result;
      switch (data.action) {
        case 'add':
          result = await mobileApiService.cart.addToCart(data.productId, data.quantity);
          break;
        case 'createOrder':
          result = await mobileApiService.order.createOrder({
            shippingAddress: data.shippingAddress,
            paymentMethod: data.paymentMethod,
            items: data.items,
            notes: data.notes
          });
          break;
        default:
          throw new Error(`Unknown cart action: ${data.action}`);
      }

      sendMessageToWebView({
        type: 'CART_RESPONSE',
        data: { success: true, result },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'CART_RESPONSE',
        data: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Cart operation failed' 
        },
      });
    }
  };

  const handleNotification = (data: any) => {
    Alert.alert(data.title || '알림', data.message);
  };

  const handleCamera = async (data: any) => {
    try {
      let result;

      switch (data.action) {
        case 'takePhoto':
          if (data.productId) {
            result = await cameraService.takeProductPhoto(data.productId, true);
          } else {
            result = await cameraService.takePhoto({ includeBase64: true });
          }
          break;
        case 'choosePhoto':
          if (data.productId) {
            result = await cameraService.chooseProductPhoto(data.productId, true);
          } else {
            result = await cameraService.chooseFromGallery({ includeBase64: true });
          }
          break;
        case 'scanQR':
          const qrResult = await cameraService.scanQRCode();
          sendMessageToWebView({
            type: 'CAMERA_RESPONSE',
            data: {
              success: true,
              result: {
                type: 'QR_SCAN',
                data: qrResult.data,
                qrType: qrResult.type,
                format: qrResult.format
              },
              requestId: data.requestId
            },
          });
          return;
        default:
          throw new Error(`지원하지 않는 카메라 액션: ${data.action}`);
      }

      // Validate image if it's a photo
      if (result && 'uri' in result) {
        if (!cameraService.validateImageType(result.type)) {
          throw new Error('지원하지 않는 이미지 형식입니다.');
        }

        if (cameraService.isImageTooLarge(result.fileSize, 10)) {
          throw new Error('이미지 크기가 너무 큽니다. (최대 10MB)');
        }
      }

      sendMessageToWebView({
        type: 'CAMERA_RESPONSE',
        data: {
          success: true,
          result,
          requestId: data.requestId
        },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'CAMERA_RESPONSE',
        data: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Camera error',
          requestId: data.requestId 
        },
      });
    }
  };

  const handlePayment = async (data: any) => {
    try {
      let result;
      
      switch (data.method) {
        case 'card':
          // Integrate with payment gateway (e.g., Iamport, Toss Payments)
          result = await processCardPayment(data);
          break;
        case 'bank_transfer':
          result = await processBankTransfer(data);
          break;
        case 'mobile':
          result = await processMobilePayment(data);
          break;
        case 'kakaopay':
        case 'naverpay':
        case 'payco':
          result = await processThirdPartyPayment(data);
          break;
        default:
          throw new Error(`지원하지 않는 결제 방법: ${data.method}`);
      }

      sendMessageToWebView({
        type: 'PAYMENT_RESPONSE',
        data: { success: true, result, requestId: data.requestId },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'PAYMENT_RESPONSE',
        data: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Payment failed',
          requestId: data.requestId 
        },
      });
    }
  };

  const handleChat = async (data: any) => {
    try {
      const chatService = mobileApiService.chat;
      let result: any = {};

      switch (data.action) {
        case 'connect':
          // 토큰 가져오기
          const token = await AsyncStorage.getItem('@handy_platform:accessToken');
          const chatEnv = getAppEnvironment();
          await chatService.connect({
            serverUrl: API_CONFIG[chatEnv]?.chatURL || API_CONFIG.stage.chatURL,
            token: token || undefined,
          });
          result = { connected: true };
          break;

        case 'disconnect':
          chatService.disconnect();
          result = { disconnected: true };
          break;

        case 'joinRoom':
          await chatService.joinRoom(data.roomId);
          result = { roomId: data.roomId, joined: true };
          break;

        case 'leaveRoom':
          await chatService.leaveRoom(data.roomId);
          result = { roomId: data.roomId, left: true };
          break;

        case 'sendMessage':
          const message = await chatService.sendMessage(data.roomId, data.text);
          result = { message };
          break;

        case 'sendTyping':
          chatService.sendTyping(data.roomId, data.isTyping);
          result = { roomId: data.roomId, isTyping: data.isTyping };
          break;

        case 'isConnected':
          result = { connected: chatService.isConnected() };
          break;

        case 'getCurrentRoom':
          result = { roomId: chatService.getCurrentRoomId() };
          break;

        default:
          throw new Error(`Unknown chat action: ${data.action}`);
      }

      sendMessageToWebView({
        type: 'CHAT_RESPONSE',
        data: {
          success: true,
          result,
          action: data.action,
          requestId: data.requestId,
        },
      });
    } catch (error) {
      console.error('🔴 [BRIDGE] Chat error:', error);
      sendMessageToWebView({
        type: 'CHAT_RESPONSE',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Chat error',
          action: data.action,
          requestId: data.requestId,
        },
      });
    }
  };

  const handlePermissions = async (data: any) => {
    try {
      let granted = false;

      switch (data.type) {
        case 'camera':
          granted = await cameraService.requestCameraPermission();
          break;
        case 'storage':
          granted = await cameraService.requestStoragePermission();
          break;
        case 'location':
          granted = await requestLocationPermission();
          break;
        default:
          throw new Error(`Unknown permission type: ${data.type}`);
      }

      sendMessageToWebView({
        type: 'PERMISSIONS_RESPONSE',
        data: {
          success: true,
          granted,
          type: data.type,
          requestId: data.requestId
        },
      });
    } catch (error) {
      sendMessageToWebView({
        type: 'PERMISSIONS_RESPONSE',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Permission error',
          requestId: data.requestId
        },
      });
    }
  };

  // Permission helpers
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '위치 권한',
          message: '배송지 설정을 위해 위치 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Payment processing helpers
  const processCardPayment = async (data: any) => {
    // This would integrate with actual payment gateway
    // For demo purposes, we'll simulate the process
    return new Promise((resolve, reject) => {
      Alert.alert(
        '카드 결제',
        `결제 금액: ${data.amount}원\n상품: ${data.orderInfo.items.length}개 상품`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => reject(new Error('사용자가 결제를 취소했습니다.'))
          },
          {
            text: '결제',
            onPress: () => {
              // Simulate payment success
              resolve({
                transactionId: `txn_${Date.now()}`,
                amount: data.amount,
                method: 'card',
                status: 'completed',
                timestamp: new Date().toISOString()
              });
            }
          }
        ]
      );
    });
  };

  const processBankTransfer = async (data: any) => {
    return {
      transactionId: `bank_${Date.now()}`,
      amount: data.amount,
      method: 'bank_transfer',
      status: 'pending',
      bankInfo: {
        bank: '국민은행',
        account: '123-456-789012',
        holder: 'Handy Platform'
      },
      timestamp: new Date().toISOString()
    };
  };

  const processMobilePayment = async (data: any) => {
    // Mobile payment integration would go here
    return {
      transactionId: `mobile_${Date.now()}`,
      amount: data.amount,
      method: 'mobile',
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  };

  const processThirdPartyPayment = async (data: any) => {
    // Third-party payment integration (KakaoPay, NaverPay, etc.)
    const appScheme = {
      kakaopay: 'kakaotalk://',
      naverpay: 'naversearchapp://',
      payco: 'payco://'
    }[data.method];

    if (appScheme) {
      const supported = await Linking.canOpenURL(appScheme);
      if (!supported) {
        throw new Error(`${data.method} 앱이 설치되어 있지 않습니다.`);
      }
      // In a real implementation, you would redirect to the payment app
    }

    return {
      transactionId: `${data.method}_${Date.now()}`,
      amount: data.amount,
      method: data.method,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  };

  const sendMessageToWebView = (message: WebViewMessage) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  const injectedJavaScript = `
    console.log('🟢 [INJECT] JavaScript 주입됨');

    // 줌 방지를 위한 viewport 메타 태그 강제 설정
    (function() {
      const metaTag = document.querySelector('meta[name="viewport"]');
      if (metaTag) {
        metaTag.setAttribute('content',
          'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no'
        );
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'viewport';
        newMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no';
        document.head.appendChild(newMeta);
      }
      console.log('🔒 [INJECT] Zoom disabled');
    })();

    // WebView 환경 감지하여 body에 클래스 추가
    if (window.ReactNativeWebView) {
      document.body.classList.add('webview-mode');
      console.log('🟢 [INJECT] WebView 모드 활성화: webview-mode 클래스 추가됨');
      
      // 네이티브 safe area 값을 CSS 변수로 주입 (Android WebView는 env() 미지원)
      const style = document.createElement('style');
      style.textContent = \`
        :root {
          --safe-area-inset-top: 0px;
          --safe-area-inset-bottom: ${insets.bottom}px;
        }

        .webview-mode {
          /* 상단은 네이티브 SafeAreaView가 처리 */
          padding-top: 0;
          /* 하단은 제스처 바 영역만큼 콘텐츠 여백 확보 */
          padding-bottom: ${insets.bottom}px;
        }
      \`;
      document.head.appendChild(style);
      console.log('🟢 [INJECT] Safe area CSS 변수 추가됨');
    }

    // localStorage.setItem을 후킹하여 토큰 자동 동기화
    (function() {
      const originalSetItem = localStorage.setItem.bind(localStorage);

      localStorage.setItem = function(key, value) {
        // 1단계: 원본 localStorage 저장 (최우선, 반드시 성공해야 함)
        try {
          originalSetItem(key, value);
          console.log('🟢 [INJECT] localStorage 저장 성공:', key);
        } catch (e) {
          console.error('🔴 [INJECT] localStorage 저장 실패:', e);
          throw e; // 원본 에러는 그대로 throw - 웹 앱이 에러를 처리하도록
        }

        // 2단계: 네이티브 동기화 (선택적, 실패해도 웹 저장은 이미 성공함)
        try {
          // accessToken 저장 감지
          if (key === 'accessToken' || key === '@handy_platform:accessToken') {
            console.log('🟢 [INJECT] accessToken 저장 감지, 네이티브로 동기화 시작');

            const token = value;
            let user = null;

            // 사용자 정보 가져오기 시도
            try {
              const userStr = localStorage.getItem('user') || localStorage.getItem('@handy_platform:user');
              if (userStr) {
                user = JSON.parse(userStr);
              }
            } catch (e) {
              console.warn('🔴 [INJECT] 사용자 정보 파싱 실패 (네이티브 동기화는 계속):', e);
            }

            // 네이티브로 토큰 전송
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'STORE_AUTH_TOKEN',
                data: { token, user }
              }));
              console.log('🟢 [INJECT] 토큰 네이티브 동기화 완료');
            }
          }
          // user 저장 감지
          else if (key === 'user' || key === '@handy_platform:user') {
            console.log('🟢 [INJECT] user 저장 감지, 네이티브로 동기화 시작');

            const token = localStorage.getItem('accessToken') || localStorage.getItem('@handy_platform:accessToken');
            let user = null;

            // 사용자 정보 파싱 시도
            try {
              user = JSON.parse(value);
            } catch (e) {
              console.warn('🔴 [INJECT] 사용자 정보 파싱 실패 (네이티브 동기화는 계속):', e);
            }

            // 토큰이 있으면 네이티브로 전송
            if (token && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'STORE_AUTH_TOKEN',
                data: { token, user }
              }));
              console.log('🟢 [INJECT] 사용자 정보 네이티브 동기화 완료');
            }
          }
        } catch (e) {
          // 네이티브 동기화 실패는 무시 (웹 저장은 이미 성공했으므로)
          console.warn('🔴 [INJECT] 네이티브 동기화 실패 (웹 저장은 성공):', e);
        }
      };

      console.log('🟢 [INJECT] localStorage 후킹 완료 - 토큰 자동 동기화 활성화');

      // 페이지 로드 시 기존 토큰 동기화
      try {
        const existingToken = localStorage.getItem('accessToken') || localStorage.getItem('@handy_platform:accessToken');
        if (existingToken) {
          console.log('🟢 [INJECT] 기존 토큰 발견, 네이티브로 동기화');

          let user = null;
          try {
            const userStr = localStorage.getItem('user') || localStorage.getItem('@handy_platform:user');
            if (userStr) {
              user = JSON.parse(userStr);
            }
          } catch (e) {
            console.warn('🔴 [INJECT] 기존 사용자 정보 파싱 실패:', e);
          }

          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'STORE_AUTH_TOKEN',
              data: { token: existingToken, user }
            }));
            console.log('🟢 [INJECT] 기존 토큰 동기화 완료');
          }
        } else {
          console.log('🟡 [INJECT] 기존 토큰 없음');
        }
      } catch (e) {
        console.warn('🔴 [INJECT] 기존 토큰 동기화 실패:', e);
      }
    })();

    // 네이티브로 돌아가기 함수 (전역으로 노출)
    window.goToNativeApp = function() {
      console.log('🟢 [INJECT] window.goToNativeApp 호출됨');
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        console.log('🟢 [INJECT] postMessage 전송');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SHOW_NATIVE_FEATURES',
          data: {}
        }));
      } else {
        console.log('🔴 [INJECT] ReactNativeWebView.postMessage 없음');
      }
    };
    
    // 네이티브 postMessage를 바인딩하여 저장 (this 컨텍스트 보존)
    var nativePostMessage = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);

    // 기존 객체에 헬퍼 메서드 추가 (네이티브 객체를 덮어쓰지 않음)
    window.ReactNativeWebView.callAPI = function(endpoint, data = {}, requestId = Date.now()) {
      nativePostMessage(JSON.stringify({
        type: 'API_CALL',
        data: { endpoint, ...data, requestId }
      }));
    };

    window.ReactNativeWebView.auth = function(action, data = {}) {
      nativePostMessage(JSON.stringify({
        type: 'AUTH',
        data: { action, ...data }
      }));
    };

    window.ReactNativeWebView.storeAuthToken = function(token, user) {
      console.log('🟢 [WEB→NATIVE] 토큰 저장 요청:', { hasToken: !!token, hasUser: !!user });
      nativePostMessage(JSON.stringify({
        type: 'STORE_AUTH_TOKEN',
        data: { token, user }
      }));
    };

    window.ReactNativeWebView.cart = function(action, data = {}) {
      nativePostMessage(JSON.stringify({
        type: 'CART',
        data: { action, ...data }
      }));
    };

    window.ReactNativeWebView.showNotification = function(title, message) {
      nativePostMessage(JSON.stringify({
        type: 'NOTIFICATION',
        data: { title, message }
      }));
    };

    window.ReactNativeWebView.camera = function(action, data = {}) {
      const requestId = Date.now().toString();
      nativePostMessage(JSON.stringify({
        type: 'CAMERA',
        data: { action, ...data, requestId }
      }));
      return requestId;
    };

    window.ReactNativeWebView.payment = function(method, data = {}) {
      const requestId = Date.now().toString();
      nativePostMessage(JSON.stringify({
        type: 'PAYMENT',
        data: { method, ...data, requestId }
      }));
      return requestId;
    };

    window.ReactNativeWebView.requestPermission = function(type) {
      const requestId = Date.now().toString();
      nativePostMessage(JSON.stringify({
        type: 'PERMISSIONS',
        data: { type, requestId }
      }));
      return requestId;
    };
    
    // 응답 리스너 등록
    window.addEventListener('message', function(event) {
      if (event.data) {
        const message = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('nativeMessage', { detail: message }));
      }
    });
    
    ${additionalJavaScript}

    true;
  `;

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: url }}
      onMessage={handleMessage}
      injectedJavaScript={injectedJavaScript}
      onShouldStartLoadWithRequest={(request) => {
        // 모든 백엔드 OAuth 로그인 URL을 인터셉트하여 InAppBrowser로 열기
        const oauthMatch = request.url.match(/\/api\/auth\/oauth\/(google|kakao|naver|apple)\/login/);
        if (oauthMatch) {
          const provider = oauthMatch[1];
          console.log(`🔵 [WEBVIEW] Intercepting ${provider} OAuth URL:`, request.url);
          const separator = request.url.includes('?') ? '&' : '?';
          handleOAuth({ provider, url: `${request.url}${separator}source=app` });
          return false;
        }
        return true;
      }}
      onNavigationStateChange={(navState) => {
        // 특별한 URL 감지
        if (navState.url.includes('action=goToNative')) {
          if (onShowNativeFeatures) {
            onShowNativeFeatures();
          }
          return; // 실제 페이지 이동은 하지 않음
        }

        if (onNavigationStateChange) {
          onNavigationStateChange(navState);
        }
      }}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('❌ [WEBVIEW] Error:', nativeEvent);
        Alert.alert(
          'WebView 로딩 에러',
          `URL: ${nativeEvent.url}\n\nDescription: ${nativeEvent.description}\n\nCode: ${nativeEvent.code}`,
          [{ text: '확인', style: 'default' }]
        );
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('❌ [WEBVIEW] HTTP Error:', nativeEvent);
        Alert.alert(
          'HTTP 에러',
          `URL: ${nativeEvent.url}\n\nStatus Code: ${nativeEvent.statusCode}`,
          [{ text: '확인', style: 'default' }]
        );
      }}
      onLoadEnd={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log('✅ [WEBVIEW] Load End:', {
          url: nativeEvent.url,
          loading: nativeEvent.loading,
          title: nativeEvent.title
        });
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={false}
      allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
      {...Platform.select({
        android: {
          setSupportZoom: false,
          builtInZoomControls: false,
          displayZoomControls: false,
        }
      })}
    />
  );
});
WebViewBridge.displayName = 'WebViewBridge';

export default WebViewBridge;