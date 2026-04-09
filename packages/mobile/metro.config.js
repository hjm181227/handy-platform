const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for monorepo workspace
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const defaultAssetExts = defaultConfig.resolver.assetExts;

  return mergeConfig(defaultConfig, {
    projectRoot: __dirname,
    watchFolders: [
      // 워크스페이스 루트와 shared 패키지를 감시
      path.resolve(__dirname, '../..'),
      path.resolve(__dirname, '../shared'),
    ],
    resolver: {
      // node_modules를 루트에서 찾도록 설정
      nodeModulesPaths: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../node_modules'),
      ],
      // TFLite 모델 파일을 asset으로 인식 (기존 확장자 유지)
      assetExts: [...defaultAssetExts, 'tflite', 'bin'],
    },
  });
};

module.exports = config();