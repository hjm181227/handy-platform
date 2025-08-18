import React, { useRef, useEffect } from 'react';
import { Alert, BackHandler, Platform, PermissionsAndroid, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { cameraService } from '../services/cameraService';
import { WebViewMessage } from '../types';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WebViewBridgeProps {
  url: string;
  onNavigationStateChange?: (navState: any) => void;
}

const WebViewBridge: React.FC<WebViewBridgeProps> = ({
  url,
  onNavigationStateChange,
}) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'API_CALL':
          await handleApiCall(message.data);
          break;
        case 'AUTH':
          await handleAuth(message.data);
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
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleApiCall = async (data: any) => {
    try {
      let result;
      switch (data.endpoint) {
        case 'getProducts':
          result = await apiService.getProducts({ page: data.page, limit: data.limit });
          break;
        case 'getProduct':
          result = await apiService.getProduct(data.id);
          break;
        case 'getCart':
          result = await apiService.getCart();
          break;
        case 'getOrders':
          result = await apiService.getOrders();
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
          result = await apiService.login({ email: data.email, password: data.password });
          // Native에 토큰과 유저 정보 저장
          await AsyncStorage.setItem('auth_token', (result as any).token);
          if ((result as any).user) {
            await AsyncStorage.setItem('user_info', JSON.stringify((result as any).user));
          }
          break;
        case 'register':
          result = await apiService.register(data);
          // 회원가입 성공 시에도 토큰 저장
          if ((result as any).token) {
            await AsyncStorage.setItem('auth_token', (result as any).token);
            if ((result as any).user) {
              await AsyncStorage.setItem('user_info', JSON.stringify((result as any).user));
            }
          }
          break;
        case 'logout':
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_info');
          result = { success: true };
          break;
        case 'getStoredAuth':
          // WebView에서 저장된 인증 정보 요청 시
          const storedToken = await AsyncStorage.getItem('auth_token');
          const storedUser = await AsyncStorage.getItem('user_info');
          result = {
            token: storedToken,
            user: storedUser ? JSON.parse(storedUser) : null,
            requestId: data.requestId
          };
          break;
        case 'syncToken':
          // WebView에서 토큰 동기화 요청 시
          if (data.token) {
            await AsyncStorage.setItem('auth_token', data.token);
            if (data.user) {
              await AsyncStorage.setItem('user_info', JSON.stringify(data.user));
            }
          }
          result = { success: true };
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

  const handleCart = async (data: any) => {
    try {
      let result;
      switch (data.action) {
        case 'add':
          result = await apiService.addToCart(data.productId, data.quantity);
          break;
        case 'createOrder':
          result = await apiService.createOrder({
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
    window.ReactNativeWebView = {
      postMessage: window.ReactNativeWebView.postMessage,
      
      // API 호출 헬퍼
      callAPI: function(endpoint, data = {}, requestId = Date.now()) {
        this.postMessage(JSON.stringify({
          type: 'API_CALL',
          data: { endpoint, ...data, requestId }
        }));
      },
      
      // 인증 헬퍼 (확장)
      auth: function(action, data = {}) {
        this.postMessage(JSON.stringify({
          type: 'AUTH',
          data: { action, ...data }
        }));
      },
      
      // Native에서 저장된 인증 정보 가져오기
      getStoredAuth: function() {
        return new Promise((resolve) => {
          const requestId = 'auth_' + Date.now();
          const handler = (event) => {
            const message = event.detail;
            if (message.type === 'AUTH_RESPONSE' && message.data.requestId === requestId) {
              window.removeEventListener('nativeMessage', handler);
              resolve(message.data.result);
            }
          };
          window.addEventListener('nativeMessage', handler);
          
          this.postMessage(JSON.stringify({
            type: 'AUTH',
            data: { action: 'getStoredAuth', requestId }
          }));
        });
      },
      
      // Native에 토큰 동기화
      syncToken: function(token, user) {
        this.postMessage(JSON.stringify({
          type: 'AUTH',
          data: { action: 'syncToken', token, user }
        }));
      },
      
      // 카트 헬퍼
      cart: function(action, data = {}) {
        this.postMessage(JSON.stringify({
          type: 'CART',
          data: { action, ...data }
        }));
      },
      
      // 알림 헬퍼
      showNotification: function(title, message) {
        this.postMessage(JSON.stringify({
          type: 'NOTIFICATION',
          data: { title, message }
        }));
      },
      
      // 카메라 헬퍼
      camera: function(action, data = {}) {
        const requestId = Date.now().toString();
        this.postMessage(JSON.stringify({
          type: 'CAMERA',
          data: { action, ...data, requestId }
        }));
        return requestId;
      },
      
      // 결제 헬퍼
      payment: function(method, data = {}) {
        const requestId = Date.now().toString();
        this.postMessage(JSON.stringify({
          type: 'PAYMENT',
          data: { method, ...data, requestId }
        }));
        return requestId;
      },
      
      // 권한 헬퍼
      requestPermission: function(type) {
        const requestId = Date.now().toString();
        this.postMessage(JSON.stringify({
          type: 'PERMISSIONS',
          data: { type, requestId }
        }));
        return requestId;
      }
    };
    
    // 응답 리스너 등록
    window.addEventListener('message', function(event) {
      if (event.data) {
        const message = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('nativeMessage', { detail: message }));
      }
    });
    
    true;
  `;

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: url }}
      onMessage={handleMessage}
      injectedJavaScript={injectedJavaScript}
      onNavigationStateChange={onNavigationStateChange}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
      allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
    />
  );
};

export default WebViewBridge;