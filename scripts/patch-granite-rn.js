#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

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
