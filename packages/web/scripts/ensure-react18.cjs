/**
 * ensure-react18.js
 *
 * 모노레포 루트에 React 19가 설치되어 있어서 npm workspace hoisting으로 인해
 * packages/web이 React 19를 사용하게 되는 문제를 방지합니다.
 *
 * 이 스크립트는 postinstall 시 packages/web/node_modules에
 * React 18.2.0과 react-dom 18.2.0이 있는지 확인하고, 없으면 설치합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(webDir, 'node_modules');
const REACT_VERSION = '18.2.0';

function getInstalledVersion(pkg) {
  try {
    const pkgJson = path.join(nodeModulesDir, pkg, 'package.json');
    if (fs.existsSync(pkgJson)) {
      const { version } = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      return version;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const reactVersion = getInstalledVersion('react');
const reactDomVersion = getInstalledVersion('react-dom');

if (reactVersion === REACT_VERSION && reactDomVersion === REACT_VERSION) {
  console.log(`[ensure-react18] React ${REACT_VERSION} already installed in packages/web/node_modules`);
  process.exit(0);
}

console.log(`[ensure-react18] Installing react@${REACT_VERSION} and react-dom@${REACT_VERSION} in packages/web/node_modules...`);
console.log(`  Current: react@${reactVersion || 'not found'}, react-dom@${reactDomVersion || 'not found'}`);

try {
  // npm pack으로 tarball 다운로드 후 수동 설치 (workspace hoisting 우회)
  fs.mkdirSync(nodeModulesDir, { recursive: true });

  const tmpDir = path.join(webDir, '.react-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  // npm pack을 사용하여 tarball 다운로드
  execSync(`npm pack react@${REACT_VERSION} --pack-destination .`, { cwd: tmpDir, stdio: 'pipe' });
  execSync(`npm pack react-dom@${REACT_VERSION} --pack-destination .`, { cwd: tmpDir, stdio: 'pipe' });

  // 기존 설치 삭제
  const reactDir = path.join(nodeModulesDir, 'react');
  const reactDomDir = path.join(nodeModulesDir, 'react-dom');
  if (fs.existsSync(reactDir)) fs.rmSync(reactDir, { recursive: true });
  if (fs.existsSync(reactDomDir)) fs.rmSync(reactDomDir, { recursive: true });

  // tarball 추출
  execSync(`tar xzf react-${REACT_VERSION}.tgz`, { cwd: tmpDir, stdio: 'pipe' });
  fs.renameSync(path.join(tmpDir, 'package'), reactDir);

  execSync(`tar xzf react-dom-${REACT_VERSION}.tgz`, { cwd: tmpDir, stdio: 'pipe' });
  fs.renameSync(path.join(tmpDir, 'package'), reactDomDir);

  // scheduler (react-dom의 dependency) 설치 확인
  const schedulerDir = path.join(nodeModulesDir, 'scheduler');
  if (!fs.existsSync(schedulerDir)) {
    execSync(`npm pack scheduler@0.23.0 --pack-destination .`, { cwd: tmpDir, stdio: 'pipe' });
    execSync(`tar xzf scheduler-0.23.0.tgz`, { cwd: tmpDir, stdio: 'pipe' });
    fs.renameSync(path.join(tmpDir, 'package'), schedulerDir);
  }

  // 임시 디렉토리 삭제
  fs.rmSync(tmpDir, { recursive: true });

  console.log(`[ensure-react18] Successfully installed react@${REACT_VERSION} and react-dom@${REACT_VERSION}`);
} catch (error) {
  console.error(`[ensure-react18] Failed to install React 18:`, error.message);
  process.exit(1);
}
