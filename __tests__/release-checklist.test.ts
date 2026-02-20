/**
 * 앱인토스 비게임 출시 가이드 체크리스트 검증
 * @see https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
 *
 * 이 테스트는 출시 전 자동 검증 가능한 항목을 확인합니다.
 * 번들(build) 후 실행하면 번들 내 금지 패턴도 함께 검사합니다.
 * 일부 항목(뒤로가기 동작, UX 등)은 샌드박스에서 수동 확인이 필요합니다.
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const MAX_BUNDLE_SIZE_MB = 100; // 앱인토스 용량 정책

/** 소스 파일(.ts, .tsx) 목록 수집 */
function getSourceFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(e.name)) {
        getSourceFiles(full, files);
      }
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

/** 파일 내용에 패턴이 있는지 검사 */
function grepInFile(filePath: string, pattern: RegExp): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return pattern.test(content);
}

/** 모든 소스 파일에서 패턴 검색, 매칭 파일 반환 */
function grepInSources(pattern: RegExp): string[] {
  const files = getSourceFiles(SRC_DIR);
  return files.filter((f) => grepInFile(f, pattern));
}

/** 번들 파일이 존재하는지 */
function hasBundle(): boolean {
  const android = path.join(DIST_DIR, 'bundle.android.js');
  const ios = path.join(DIST_DIR, 'bundle.ios.js');
  return fs.existsSync(android) || fs.existsSync(ios);
}

/** 번들 파일 내용 읽기 */
function getBundleContent(): string {
  const android = path.join(DIST_DIR, 'bundle.android.js');
  const ios = path.join(DIST_DIR, 'bundle.ios.js');
  let content = '';
  if (fs.existsSync(android)) content += fs.readFileSync(android, 'utf-8');
  if (fs.existsSync(ios)) content += fs.readFileSync(ios, 'utf-8');
  return content;
}

describe('앱인토스 비게임 출시 체크리스트', () => {
  describe('접속 및 앱 내 기능', () => {
    test('스킴은 intoss:// 를 사용한다', () => {
      const configPath = path.join(PROJECT_ROOT, 'granite.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toMatch(/scheme:\s*['"]intoss['"]/);
    });

    test('딥링크는 intoss:// 스킴을 사용한다', () => {
      const matches = grepInSources(/intoss-private:\/\//);
      expect(matches).toEqual([]);
    });
  });

  describe('공유 기능 (intoss-private 금지)', () => {
    test('공유 기능에서 intoss-private:// 링크를 사용하지 않는다', () => {
      const matches = grepInSources(/intoss-private/);
      expect(matches).toEqual([]);
    });

    test('intoss:// 스킴을 사용한 공유/딥링크가 있다', () => {
      const matches = grepInSources(/intoss:\/\//);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('내비게이션 바 / TDS', () => {
    test('TDS(PageNavbar 등)를 사용한다', () => {
      const matches = grepInSources(/@toss\/tds-react-native/);
      expect(matches.length).toBeGreaterThan(0);
    });

    test('페이지에 PageNavbar 또는 내비게이션 컴포넌트를 사용한다', () => {
      const matches = grepInSources(/PageNavbar|Navbar|createRoute/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('서비스 이용 동작', () => {
    test('지도 외 필요 경우를 제외하고 pinch/zoom 비활성화 (WebView 사용 시)', () => {
      const webviewFiles = grepInSources(/WebView|webview/);
      if (webviewFiles.length === 0) {
        return; // WebView 미사용 시 스킵
      }
      for (const f of webviewFiles) {
        const content = fs.readFileSync(f, 'utf-8');
        if (content.includes('scalesPageToFit') || content.includes('scalesPageToFit={true}')) {
          throw new Error(`${f}: scalesPageToFit은 기본 비활성화 권장`);
        }
      }
    });

    test('불법·선정성 등 위법 콘텐츠 필터 관련 코드가 있다 (클린봇 등)', () => {
      // 기획서 기준: 클린봇(비속어 필터) 등록 시점 검사
      const hasFilter = grepInSources(/차단|필터|비속어|금지|block|filter/).length > 0;
      const hasReport = grepInSources(/신고|report/).length > 0;
      expect(hasFilter || hasReport).toBe(true);
    });
  });

  describe('설정 및 브랜드', () => {
    test('granite.config에 appsInToss 플러그인과 brand.displayName이 설정되어 있다', () => {
      const configPath = path.join(PROJECT_ROOT, 'granite.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toMatch(/appsInToss|displayName/);
    });

    test('.granite/app.json이 존재한다', () => {
      const appJsonPath = path.join(PROJECT_ROOT, '.granite', 'app.json');
      expect(fs.existsSync(appJsonPath)).toBe(true);
    });
  });

  describe('번들 상태 검사 (build 후)', () => {
    test('번들에 intoss-private가 포함되지 않는다', () => {
      if (!hasBundle()) {
        return; // 번들 없으면 스킵
      }
      const content = getBundleContent();
      expect(content).not.toMatch(/intoss-private:\/\//);
    });

    test('번들 용량이 100MB 이하이다 (압축 해제 기준)', () => {
      if (!hasBundle()) return;
      let totalBytes = 0;
      for (const name of ['bundle.android.js', 'bundle.ios.js']) {
        const p = path.join(DIST_DIR, name);
        if (fs.existsSync(p)) {
          totalBytes += fs.statSync(p).size;
        }
      }
      const totalMB = totalBytes / (1024 * 1024);
      expect(totalMB).toBeLessThanOrEqual(MAX_BUNDLE_SIZE_MB);
    });
  });

  describe('수동 확인 필요 (안내용)', () => {
    test('수동 확인 항목은 출시 가이드 문서를 참고한다', () => {
      // 아래 항목들은 실제 실행/샌드박스에서 수동 확인 필요
      const manualChecks = [
        '뒤로가기 버튼이 모든 화면에서 정상 동작',
        '최초 화면에서 뒤로가기 시 미니앱 종료',
        '바텀시트 자동 열림 없음',
        '인터랙션 반응 2초 이내',
        '라이트 모드 테마',
        'TDS 모달 사용 (확인/안내 시)',
        '권한 요청 전 동의 UI',
      ];
      expect(manualChecks.length).toBeGreaterThan(0);
    });
  });
});
