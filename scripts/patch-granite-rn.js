#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

/** Metro가 exports 조건 react-native 를 요구할 때 "." 진입점 추가 */
function patchExportsDot(pkgDir, pkg) {
  const dot = pkg.exports && pkg.exports['.'];
  if (!dot || typeof dot !== 'object' || dot['react-native']) return false;
  const candidates = ['./dist/index.js', './dist/index.cjs', './dist/index.mjs'];
  let entry = null;
  for (const c of candidates) {
    if (fs.existsSync(path.join(pkgDir, c))) {
      entry = c;
      break;
    }
  }
  if (!entry && typeof dot.import === 'string') entry = dot.import;
  if (!entry && typeof dot.require === 'string') entry = dot.require;
  if (!entry && dot.require && typeof dot.require.default === 'string') {
    entry = dot.require.default;
  }
  if (!entry && dot.import && typeof dot.import.default === 'string') {
    const d = dot.import.default;
    entry = d.endsWith('.mjs')
      ? fs.existsSync(path.join(pkgDir, './dist/index.js'))
        ? './dist/index.js'
        : d
      : d;
  }
  if (!entry) return false;
  if (entry.endsWith('.cjs')) {
    const js = './dist/index.js';
    if (fs.existsSync(path.join(pkgDir, js))) entry = js;
  }
  dot['react-native'] = entry;
  dot['default'] = entry;
  return true;
}

// -1. 중복 설치된 react-native-screens 제거 (RNSScreen 중복 등록 방지)
// @granite-js/native 내부에 별도 버전이 설치되면 Metro 번들에 2개가 들어가며
// "Tried to register two views with the same name RNSScreen"가 발생한다.
for (const p of [
  path.join(root, 'node_modules/@granite-js/native/node_modules/react-native-screens'),
  path.join(root, 'node_modules/@granite-js/native/node_modules/@react-navigation/native-stack/node_modules/react-native-screens'),
]) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`Removed nested react-native-screens: ${path.relative(root, p)}`);
    }
  } catch (e) {
    // ignore
  }
}

// 0. @apps-in-toss/* 전부 패치 (native-modules, types, plugins 등)
const appsInTossDir = path.join(root, 'node_modules/@apps-in-toss');
if (fs.existsSync(appsInTossDir)) {
  for (const name of fs.readdirSync(appsInTossDir)) {
    const dir = path.join(appsInTossDir, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (patchExportsDot(dir, pkg)) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`Patched @apps-in-toss/${name} exports: react-native, default`);
    }
  }
}

// 0-1. es-toolkit, es-hangul (Metro exports 조건)
for (const name of ['es-toolkit', 'es-hangul']) {
  const pkgPath = path.join(root, 'node_modules', name, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  const dir = path.dirname(pkgPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (patchExportsDot(dir, pkg)) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`Patched ${name} exports: react-native, default`);
  }
}

// 0-2. @toss/* (tds-react-native 등 require.import 중첩 exports)
const tossDir = path.join(root, 'node_modules/@toss');
if (fs.existsSync(tossDir)) {
  for (const name of fs.readdirSync(tossDir)) {
    const dir = path.join(tossDir, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (patchExportsDot(dir, pkg)) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`Patched @toss/${name} exports: react-native, default`);
    }
  }
}

// 1. Patch @granite-js/react-native
const pkgPath = path.join(root, 'node_modules/@granite-js/react-native/package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.main === './dist/index.js') {
    pkg.main = './src/index.ts';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Patched @granite-js/react-native main -> src/index.ts');
  }
}

// 1-1. Patch @babel/runtime helpers exports for RN
// Metro가 @babel/runtime helper의 exports에서 import(ESM)를 잡으면
// require 호출과 섞여 "Object is not a function"으로 터질 수 있다.
// RN에서는 react-native 조건을 CJS(default)로 고정해준다.
const babelRuntimePkgPath = path.join(root, 'node_modules/@babel/runtime/package.json');
if (fs.existsSync(babelRuntimePkgPath)) {
  const babelDir = path.dirname(babelRuntimePkgPath);
  const pkg = JSON.parse(fs.readFileSync(babelRuntimePkgPath, 'utf8'));
  let patched = false;

  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const [key, val] of Object.entries(pkg.exports)) {
      if (!key.startsWith('./helpers/')) continue;
      if (!Array.isArray(val) || !val[0] || typeof val[0] !== 'object') continue;
      const first = val[0];
      // first: { node, import, default, ... }
      if (typeof first.default === 'string') {
        if (!first['react-native']) {
          // 기본적으로 CJS(default) 쪽으로 붙이기
          first['react-native'] = first.default;
          patched = true;
        }
        // Metro가 import 조건을 우선 선택해 ESM helper로 빠지는 것을 방지:
        // import도 CJS(default)로 덮어쓴다.
        if (first.import !== first.default) {
          first.import = first.default;
          patched = true;
        }
      } else if (!first['react-native'] && typeof first.node === 'string') {
        // 안전장치
        first['react-native'] = first.node;
        patched = true;
      }
    }
  }

  if (patched) {
    fs.writeFileSync(babelRuntimePkgPath, JSON.stringify(pkg, null, 2));
    console.log('Patched @babel/runtime exports: helpers react-native -> CJS(default)');
  }
}

// 2. Metro가 Firebase 의존성에서 crypto/ 요청 시 찾을 수 있도록 crypto 패키지 생성
const cryptoDir = path.join(root, 'node_modules/crypto');
const cryptoIndex = path.join(cryptoDir, 'index.js');
const shimPath = path.join(root, 'shims/crypto.js');
if (!fs.existsSync(cryptoIndex) && fs.existsSync(shimPath)) {
  fs.mkdirSync(cryptoDir, { recursive: true });
  fs.writeFileSync(
    path.join(cryptoDir, 'package.json'),
    JSON.stringify({ name: 'crypto', main: 'index.js', version: '1.0.0' }, null, 2)
  );
  fs.writeFileSync(cryptoIndex, `module.exports = require(${JSON.stringify(shimPath)});\n`);
  console.log('Created node_modules/crypto shim for Metro');
}
