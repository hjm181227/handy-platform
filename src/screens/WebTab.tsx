// src/screens/WebTab.tsx
import React, { useRef, useState, useCallback } from "react";
import { BackHandler, Platform, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import WebViewBridge from "../components/WebViewBridge";

type RootParam = { path?: string; title?: string };
type Props = NativeStackScreenProps<any>;

// Web development server URL
const BASE_WEB = Platform.OS === "android" 
  ? "http://10.0.2.2:3000"  // Android emulator localhost
  : "http://localhost:3000"; // iOS simulator localhost

export default function WebTab({ route, navigation }: Props) {
  const { path = "/", title } = (route.params ?? {}) as RootParam;
  
  // Add app=1 query parameter to indicate mobile app context
  const withAppFlag = (p: string) => (p.includes("?") ? `${p}&app=1` : `${p}?app=1`);
  const uri = `${BASE_WEB}${withAppFlag(path)}`;
  
  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Set screen title
  React.useEffect(() => {
    navigation.setOptions({ title: title ?? "" });
  }, [navigation, title]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Consume the event
        }
        return false; // Let default behavior handle it
      };
      
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => subscription.remove();
    }, [canGoBack])
  );

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // Optional: Handle URL changes for routing
    if (navState.url !== uri) {
      console.log('Navigation to:', navState.url);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <WebViewBridge
        url={uri}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </View>
  );
}