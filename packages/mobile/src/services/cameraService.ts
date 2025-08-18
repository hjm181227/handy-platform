import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, ImagePickerOptions } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface CameraResult {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  base64?: string;
  width?: number;
  height?: number;
}

export interface QRCodeResult {
  data: string;
  type: 'QR_CODE' | 'BARCODE';
  format?: string;
}

class CameraService {
  private defaultOptions: ImagePickerOptions = {
    mediaType: 'photo' as MediaType,
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    includeBase64: false,
  };

  // Permission methods
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: '카메라 권한',
            message: '사진을 촬영하기 위해 카메라 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }

  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '저장소 권한',
            message: '사진을 저장하기 위해 저장소 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true;
  }

  // Camera methods
  async takePhoto(options?: Partial<ImagePickerOptions>): Promise<CameraResult> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('카메라 권한이 필요합니다.');
    }

    const finalOptions = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      launchCamera(finalOptions, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          reject(new Error('사용자가 카메라를 취소했습니다.'));
          return;
        }

        if (response.errorMessage) {
          reject(new Error(response.errorMessage));
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          reject(new Error('사진을 촬영할 수 없습니다.'));
          return;
        }

        resolve({
          uri: asset.uri,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
          base64: asset.base64,
          width: asset.width,
          height: asset.height,
        });
      });
    });
  }

  async chooseFromGallery(options?: Partial<ImagePickerOptions>): Promise<CameraResult> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      throw new Error('저장소 권한이 필요합니다.');
    }

    const finalOptions = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      launchImageLibrary(finalOptions, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          reject(new Error('사용자가 갤러리 선택을 취소했습니다.'));
          return;
        }

        if (response.errorMessage) {
          reject(new Error(response.errorMessage));
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          reject(new Error('이미지를 선택할 수 없습니다.'));
          return;
        }

        resolve({
          uri: asset.uri,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
          base64: asset.base64,
          width: asset.width,
          height: asset.height,
        });
      });
    });
  }

  // QR Code scanning methods
  async scanQRCode(): Promise<QRCodeResult> {
    // Note: This would typically integrate with react-native-camera or similar
    // For now, we'll return a mock implementation
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('카메라 권한이 필요합니다.');
    }

    return new Promise((resolve, reject) => {
      Alert.alert(
        'QR 코드 스캔',
        'QR 코드 스캔 기능은 현재 개발 중입니다. 테스트용 QR 코드를 반환합니다.',
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => reject(new Error('사용자가 QR 코드 스캔을 취소했습니다.'))
          },
          {
            text: '테스트 스캔',
            onPress: () => resolve({
              data: 'https://example.com/product/12345',
              type: 'QR_CODE',
              format: 'QR_CODE'
            })
          }
        ]
      );
    });
  }

  // Product photo helpers
  async takeProductPhoto(productId: string, includeBase64: boolean = false): Promise<CameraResult & { productId: string }> {
    try {
      const result = await this.takePhoto({ includeBase64 });
      return {
        ...result,
        productId
      };
    } catch (error) {
      throw new Error(`상품 사진 촬영 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async chooseProductPhoto(productId: string, includeBase64: boolean = false): Promise<CameraResult & { productId: string }> {
    try {
      const result = await this.chooseFromGallery({ includeBase64 });
      return {
        ...result,
        productId
      };
    } catch (error) {
      throw new Error(`상품 사진 선택 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // Image processing helpers
  async resizeImage(uri: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> {
    // Note: This would typically use react-native-image-resizer or similar
    // For now, we'll return the original URI
    console.log(`Resizing image: ${uri} to ${maxWidth}x${maxHeight}`);
    return uri;
  }

  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    // Note: This would typically use image compression libraries
    // For now, we'll return the original URI
    console.log(`Compressing image: ${uri} with quality ${quality}`);
    return uri;
  }

  // Utility methods
  getImageSizeText(fileSize?: number): string {
    if (!fileSize) return '';
    
    if (fileSize < 1024) {
      return `${fileSize}B`;
    } else if (fileSize < 1024 * 1024) {
      return `${(fileSize / 1024).toFixed(1)}KB`;
    } else {
      return `${(fileSize / (1024 * 1024)).toFixed(1)}MB`;
    }
  }

  isImageTooLarge(fileSize?: number, maxSizeMB: number = 5): boolean {
    if (!fileSize) return false;
    return fileSize > maxSizeMB * 1024 * 1024;
  }

  validateImageType(type?: string): boolean {
    if (!type) return false;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(type.toLowerCase());
  }
}

export const cameraService = new CameraService();