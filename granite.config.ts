import 'dotenv/config';
import path from 'path';
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';
import { env } from '@granite-js/plugin-env';

// @firebase/firestore가 Node 빌드(crypto 의존) 대신 RN 빌드를 쓰도록 강제
const FIREBASE_FIRESTORE_RN_PATH = path.join(
  path.dirname(require.resolve('@firebase/firestore/package.json')),
  'dist',
  'index.rn.js'
);

// culori (TDS 의존) – ESM 소스(type:module)가 Hermes에서 동작하지 않으므로 CJS 번들 강제
const CULORI_CJS_PATH = path.join(
  path.dirname(require.resolve('culori/package.json')),
  'bundled',
  'culori.cjs'
);

// @granite-js/react-native는 dist/index.js 없이 src를 사용 (패키지 이슈)
const GRANITE_RN_PATH = path.join(
  path.dirname(require.resolve('@granite-js/react-native/package.json')),
  'src',
  'index.ts'
);

// @granite-js/native 서브경로 - Metro가 package exports를 해석하지 못해 수동 매핑
const NATIVE_PKG_ROOT = path.dirname(require.resolve('@granite-js/native/package.json'));
const join = (...seg: string[]) => path.join(NATIVE_PKG_ROOT, 'src', ...seg);
const GRANITE_NATIVE_SUBPATHS: Record<string, string> = {
  '@granite-js/native/@react-navigation/native': join('@react-navigation', 'native.ts'),
  '@granite-js/native/@react-navigation/native-stack': join('@react-navigation', 'native-stack.ts'),
  '@granite-js/native/@react-navigation/elements': join('@react-navigation', 'elements.ts'),
  '@granite-js/native/@react-native-community/blur': join('@react-native-community', 'blur.ts'),
  '@granite-js/native/@shopify/flash-list': join('@shopify', 'flash-list.ts'),
  '@granite-js/native/@react-native-async-storage/async-storage': join('@react-native-async-storage', 'async-storage', 'index.ts'),
  '@granite-js/native/react-native-svg': join('react-native-svg.ts'),
  '@granite-js/native/react-native-video': join('react-native-video.ts'),
  '@granite-js/native/react-native-fast-image': join('react-native-fast-image.ts'),
  '@granite-js/native/react-native-safe-area-context': join('react-native-safe-area-context', 'index.ts'),
  '@granite-js/native/react-native-screens': join('react-native-screens.ts'),
  '@granite-js/native/react-native-webview': join('react-native-webview.ts'),
  '@granite-js/native/react-native-gesture-handler': join('react-native-gesture-handler', 'index.ts'),
  '@granite-js/native/react-native-pager-view': join('react-native-pager-view.ts'),
  '@granite-js/native/lottie-react-native': join('lottie-react-native.ts'),
};

// @apps-in-toss/native-modules 서브경로 - Metro가 package exports 미해석
const NATIVE_MODULES_ROOT = path.dirname(require.resolve('@apps-in-toss/native-modules/package.json'));
const APPS_IN_TOSS_NATIVE_SUBPATHS: Record<string, string> = {
  '@apps-in-toss/native-modules/async-bridges': path.join(NATIVE_MODULES_ROOT, 'src', 'async-bridges.ts'),
  '@apps-in-toss/native-modules/constant-bridges': path.join(NATIVE_MODULES_ROOT, 'src', 'constant-bridges.ts'),
  '@apps-in-toss/native-modules/event-bridges': path.join(NATIVE_MODULES_ROOT, 'src', 'event-bridges.ts'),
};

// @toss/tds-react-native/private - package exports 미해석 시
const TDS_RN_PRIVATE_PATH = path.join(
  path.dirname(require.resolve('@toss/tds-react-native/package.json')),
  'dist',
  'cjs',
  'private',
  'index.js'
);

export default defineConfig({
  appName: 'bamboo-app',
  scheme: 'intoss', // 앱인토스 스킴 (intoss://bamboo-app)
  metro: {
    resolver: {
      conditionNames: ['react-native', 'browser', 'require', 'import', 'default'],
      extraNodeModules: {
        crypto: path.join(__dirname, 'shims', 'crypto.js'),
        'crypto/': path.join(__dirname, 'shims', 'crypto.js'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        '@toss/tds-react-native/private': TDS_RN_PRIVATE_PATH,
        'culori': CULORI_CJS_PATH,
      },
      resolveRequest: (context, moduleName, platform) => {
        if (moduleName === 'crypto' || moduleName === 'crypto/' || moduleName.startsWith('crypto/')) {
          return { type: 'sourceFile' as const, filePath: path.join(__dirname, 'shims', 'crypto.js') };
        }
        if (moduleName === 'firebase/firestore' || moduleName === '@firebase/firestore') {
          return { type: 'sourceFile' as const, filePath: FIREBASE_FIRESTORE_RN_PATH };
        }
        if (moduleName === 'culori') {
          return { type: 'sourceFile' as const, filePath: CULORI_CJS_PATH };
        }
        if (moduleName === '@granite-js/react-native') {
          return { type: 'sourceFile' as const, filePath: GRANITE_RN_PATH };
        }
        const nativeSubpath = GRANITE_NATIVE_SUBPATHS[moduleName];
        if (nativeSubpath) {
          return { type: 'sourceFile' as const, filePath: nativeSubpath };
        }
        if (moduleName === '@toss/tds-react-native/private') {
          return { type: 'sourceFile' as const, filePath: TDS_RN_PRIVATE_PATH };
        }
        const nativeModulesSubpath = APPS_IN_TOSS_NATIVE_SUBPATHS[moduleName];
        if (nativeModulesSubpath) {
          return { type: 'sourceFile' as const, filePath: nativeModulesSubpath };
        }
        return context.resolveRequest(context, moduleName, platform);
      },
    },
  },
  plugins: [
    appsInToss({
      brand: {
        displayName: '대나무숲',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/22627/6c776e21-a54a-4bff-b786-1e38fda2b5a2.png',
      },
      permissions: [],
      navigationBar: {
        withBackButton: true,
        withHomeButton: true,
      },
    }),
    env({
      VITE_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? '',
      VITE_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? '',
      VITE_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
      VITE_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? '',
      VITE_FIREBASE_MESSAGING_SENDER_ID:
        process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
      VITE_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? '',
    }),
  ],
});
