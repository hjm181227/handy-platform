const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for monorepo workspace
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
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
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);