import 'dotenv/config';
import path from 'path';
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';
import { env } from '@granite-js/plugin-env';

const BABEL_RUNTIME_ROOT = path.dirname(require.resolve('@babel/runtime/package.json'));
const RN_SCREENS_ROOT = path.dirname(require.resolve('react-native-screens/package.json'));

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
    transformer: {
      unstable_allowRequireContext: true,
    },
    resolver: {
      // react-native만 쓰면 import/require만 있는 패키지에서 Metro 500 발생.
      // 다만 Metro(특히 require 기반 로더)에서는 ESM(import)보다 CJS(require)를 우선 선택해야
      // @babel/runtime helper 같은 모듈이 "Object is not a function"으로 깨지지 않음.
      // default를 import보다 앞에 두어, @babel/runtime 같이 "import(ESM)" 경로가
      // require 호출과 섞여 깨지는 케이스를 피한다.
      conditionNames: ['react-native', 'require', 'default', 'import', 'browser'],
      extraNodeModules: {
        crypto: path.join(__dirname, 'shims', 'crypto.js'),
        'crypto/': path.join(__dirname, 'shims', 'crypto.js'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        // react-native-screens가 2버전(4.23.x/4.24.x)로 중복 설치되면
        // RNSScreen가 중복 등록되며 "Tried to register two views..."가 발생한다.
        // Metro가 항상 최상위 버전 하나만 보게 고정한다.
        'react-native-screens': RN_SCREENS_ROOT,
        '@toss/tds-react-native/private': TDS_RN_PRIVATE_PATH,
        'culori': CULORI_CJS_PATH,
        // RN 번들에서 `@babel/runtime/helpers/interopRequireDefault`를 require로 호출하는데
        // exports 조건이 import(ESM)로 해석되면 "Object is not a function"으로 터질 수 있어 CJS로 고정
        '@babel/runtime/helpers/interopRequireDefault': path.join(BABEL_RUNTIME_ROOT, 'helpers', 'interopRequireDefault.js'),
        '@babel/runtime/helpers/esm/interopRequireDefault': path.join(BABEL_RUNTIME_ROOT, 'helpers', 'interopRequireDefault.js'),
      },
      resolveRequest: (context, moduleName, platform) => {
        // react-native-screens 중복 설치(@granite-js/native 내부 node_modules 등)로 인해
        // RNSScreen가 2번 등록되는 문제를 막기 위해 항상 최상위 설치본으로 고정한다.
        if (moduleName === 'react-native-screens') {
          return { type: 'sourceFile' as const, filePath: path.join(RN_SCREENS_ROOT, 'src', 'index.tsx') };
        }
        if (moduleName.startsWith('react-native-screens/')) {
          const subpath = moduleName.slice('react-native-screens/'.length);
          return { type: 'sourceFile' as const, filePath: path.join(RN_SCREENS_ROOT, subpath) };
        }
        // @babel/runtime helpers는 ESM 경로(import)를 집으면 interop가 깨져
        // `_interopRequireDefault(...)` 호출 시 "Object is not a function"이 날 수 있어 CJS로 고정한다.
        if (moduleName.startsWith('@babel/runtime/helpers/')) {
          const helperName = moduleName.slice('@babel/runtime/helpers/'.length);
          // ex) @babel/runtime/helpers/interopRequireDefault -> helpers/interopRequireDefault.js
          return {
            type: 'resolved' as const,
            target: path.join(BABEL_RUNTIME_ROOT, 'helpers', `${helperName}.js`),
          };
        }
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
