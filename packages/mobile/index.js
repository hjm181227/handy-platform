// Buffer 폴리필 (jpeg-js 등 Node.js 라이브러리 호환성)
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import {AppRegistry} from 'react-native';
import App from './App';

AppRegistry.registerComponent('HandyPlatformApp', () => App);