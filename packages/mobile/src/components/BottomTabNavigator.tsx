import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../styles/colors';
import { DeviceEventEmitter } from 'react-native';

import CategoryScreen from '../screens/CategoryScreen';
import SnapScreen from '../screens/SnapScreen';
import HomeScreen from '../screens/HomeScreen';
import LikeScreen from '../screens/LikeScreen';
import MyScreen from '../screens/MyScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color, opacity: focused ? 1 : 0.7 }}>⊞</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Snap"
        component={SnapScreen}
        options={{
          title: '스냅',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color, opacity: focused ? 1 : 0.7 }}>○</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color, opacity: focused ? 1 : 0.7 }}>▲</Text>
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
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color, opacity: focused ? 1 : 0.7 }}>{focused ? '♥' : '♡'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, color, opacity: focused ? 1 : 0.7 }}>◉</Text>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            console.log('🔵 [NAVIGATOR] MY tab pressed!');
            console.log('🔵 [NAVIGATOR] Navigation state:', navigation.getState());
            
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            console.log('🔵 [NAVIGATOR] Current route before MY tab press:', currentRoute.name);
            console.log('🔵 [NAVIGATOR] Switching to MY tab');
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;