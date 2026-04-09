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
  dependencies: {},
  assets: ['../../node_modules/react-native-vector-icons/Fonts'],
};
