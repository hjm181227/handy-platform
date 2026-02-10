import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { alertService } from '@handy-platform/shared/src/services/utils/AlertService';
import { ToastState } from '@handy-platform/shared/src/services/utils/AlertTypes';

const VARIANT_CONFIG: Record<string, { bg: string; icon: string; iconName: string }> = {
  success: { bg: '#10B981', icon: '#FFFFFF', iconName: 'check' },
  danger: { bg: '#EF4444', icon: '#FFFFFF', iconName: 'x' },
  info: { bg: '#8B5CF6', icon: '#FFFFFF', iconName: 'info' },
  warning: { bg: '#F59E0B', icon: '#FFFFFF', iconName: 'alert-triangle' },
  default: { bg: '#71717A', icon: '#FFFFFF', iconName: 'info' },
};

const CustomToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = alertService.subscribeToast((newToast: ToastState) => {
      // Clear any existing dismiss timer
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }

      setToast(newToast);

      // Reset animation values
      translateY.setValue(-100);
      opacity.setValue(0);

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const duration = newToast.options.duration || 3000;
      dismissTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast(null);
        });
      }, duration);
    });

    return () => {
      unsubscribe();
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [translateY, opacity]);

  if (!toast) return null;

  const variant = toast.options.variant || 'default';
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
  const title = toast.options.title;

  return (
    <View style={[styles.wrapper, { top: insets.top + 12 }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateY }], opacity },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
          <Icon name={config.iconName} size={16} color={config.icon} />
        </View>
        <View style={styles.textContainer}>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: 320,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
  },
  message: {
    fontSize: 13,
    color: '#71717A',
  },
});

export default CustomToast;
