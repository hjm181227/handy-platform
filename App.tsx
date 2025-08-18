import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid, Permission } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';

const App: React.FC = () => {
  useEffect(() => {
    // 앱 시작 시 초기화
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Android 권한 요청
      if (Platform.OS === 'android') {
        await requestAndroidPermissions();
      }
      
      // 스플래시 스크린 숨기기 (if splash screen package is available)
      // setTimeout(() => {
      //   SplashScreen.hide();
      // }, 1000);
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const requestAndroidPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ].filter(Boolean) as Permission[];

      await PermissionsAndroid.requestMultiple(permissions);
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  return <HomeScreen />;
};

export default App;