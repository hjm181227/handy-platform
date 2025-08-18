import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

interface WebViewBridgeProps {
  url: string;
  onNavigationStateChange?: (navState: any) => void;
}

const WebViewBridge: React.FC<WebViewBridgeProps> = ({
  url,
  onNavigationStateChange,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(url).origin) return;
      
      try {
        const message = JSON.parse(event.data);
        console.log('Received message from web:', message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [url]);

  const sendMessageToWeb = (message: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*');
    }
  };

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        src={url}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Handy Platform Web"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default WebViewBridge;