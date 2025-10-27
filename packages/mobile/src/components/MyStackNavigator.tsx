import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MyScreen from '../screens/MyScreen';
// TODO: Temporarily removed to isolate rendering issue
// import NailMeasurement from '../screens/NailMeasurement';
// import NailSizesScreen from '../screens/NailSizesScreen';

export type MyStackParamList = {
  MyMain: undefined;
  NailMeasurement: undefined;
  NailSizes: undefined;
};

const Stack = createNativeStackNavigator<MyStackParamList>();

const MyStackNavigator: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // NavigateService로부터 이벤트 수신
    const measurementListener = DeviceEventEmitter.addListener(
      'navigateToMeasurement',
      () => {
        console.log('📍 [MY_STACK] navigateToMeasurement event received');
        navigation.navigate('NailMeasurement');
      }
    );

    const sizesListener = DeviceEventEmitter.addListener(
      'navigateToSizes',
      () => {
        console.log('📍 [MY_STACK] navigateToSizes event received');
        navigation.navigate('NailSizes');
      }
    );

    const backListener = DeviceEventEmitter.addListener('navigateBack', () => {
      console.log('📍 [MY_STACK] navigateBack event received');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    });

    return () => {
      measurementListener.remove();
      sizesListener.remove();
      backListener.remove();
    };
  }, [navigation]);

  const handleCloseMeasurement = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNavigateToSizes = () => {
    navigation.navigate('NailSizes');
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="MyMain"
    >
      {/* 마이페이지 - WebView */}
      <Stack.Screen
        name="MyMain"
        component={MyScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* TODO: 나중에 추가
      <Stack.Screen
        name="NailMeasurement"
        component={NailMeasurement}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="NailSizes"
        component={NailSizesScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      */}
    </Stack.Navigator>
  );
};

export default MyStackNavigator;
