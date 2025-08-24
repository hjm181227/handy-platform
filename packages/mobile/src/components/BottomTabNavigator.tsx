import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import CategoryScreen from '../screens/CategoryScreen';
import SnapScreen from '../screens/SnapScreen';
import HomeScreen from '../screens/HomeScreen';
import LikeScreen from '../screens/LikeScreen';
import MyScreen from '../screens/MyScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          title: '카테고리',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🗂️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Snap"
        component={SnapScreen}
        options={{
          title: '스냅',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📸</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Like"
        component={LikeScreen}
        options={{
          title: '좋아요',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>❤️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;