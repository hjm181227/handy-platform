const path = require('path');

module.exports = {
  reactNativePath: path.resolve(__dirname, '../../node_modules/react-native'),
  project: {
    android: {
      sourceDir: './android',
      appName: 'app',
      packageName: 'com.handyapp',
    },
    ios: {
      sourceDir: './ios',
    },
  },
  dependencies: {
    '@bam.tech/react-native-image-resizer': {
      platforms: {
        android: null, // Excluded: AGP 8.12+ incompatible, using react-native-image-resizer shim
      },
    },
  },
  assets: ['../../node_modules/react-native-vector-icons/Fonts'],
};
