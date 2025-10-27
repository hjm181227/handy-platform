import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { DeviceEventEmitter } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import BiIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CategoryScreen from '../screens/CategoryScreen';
import SnapScreen from '../screens/SnapScreen';
import HomeScreen from '../screens/HomeScreen';
import LikeScreen from '../screens/LikeScreen';
import MyScreen from '../screens/MyScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.primary[100],
          paddingBottom: 5 + insets.bottom,
          paddingTop: 5,
          height: 60 + insets.bottom,
          shadowColor: colors.primary[500],
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'System',
        },
      }}
    >
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          title: '카테고리',
          tabBarIcon: ({ color, focused, size }) => (
            <BiIcon name="view-grid" size={size} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Snap"
        component={SnapScreen}
        options={{
          title: '스냅',
          tabBarIcon: ({ color, focused, size }) => (
            <FontAwesome6 name="camera" size={size} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialIcon name="home" size={size * 1.3} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            console.log('🏠 [NAVIGATOR] HOME tab pressed!');
            console.log('🏠 [NAVIGATOR] Navigation state:', navigation.getState());
            
            // 현재 이미 Home 탭이 활성화되어 있는 경우에만 이벤트 발생
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            
            if (currentRoute.name === 'Home') {
              console.log('🏠 [NAVIGATOR] Already on Home tab, emitting homeTabPressed');
              DeviceEventEmitter.emit('homeTabPressed');
            } else {
              console.log('🏠 [NAVIGATOR] Not on Home tab, switching to Home without event');
            }
          },
        })}
      />
      <Tab.Screen
        name="Like"
        component={LikeScreen}
        options={{
          title: '좋아요',
          tabBarIcon: ({ color, focused, size }) => (
            <FontAwesome name="heart" size={size} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
          ),
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name="person-circle" size={size * 1.3} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            console.log('🔵 [NAVIGATOR] MY tab pressed!');
            console.log('🔵 [NAVIGATOR] Navigation state:', navigation.getState());

            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            console.log('🔵 [NAVIGATOR] Current route before MY tab press:', currentRoute.name);
            console.log('🔵 [NAVIGATOR] Switching to MY tab (MyScreen WebView)');
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;