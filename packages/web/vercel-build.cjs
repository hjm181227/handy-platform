#!/usr/bin/env node

const { execSync } = require('child_process');

// 환경 변수 읽기
const vercelEnv = process.env.VERCEL_ENV || 'development';
const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || 'unknown';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏗️  Handy Platform - Vercel Build Environment Detector');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 VERCEL_ENV: ${vercelEnv}`);
console.log(`🌿 Git Branch: ${gitBranch}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let buildCommand;
let environmentName;

// 빌드 명령어 결정 로직
// Note: Vercel builds from repository root (no Root Directory set)
if (vercelEnv === 'production' || gitBranch === 'main') {
  buildCommand = 'npm run build:shared && cd packages/web && npm run build:prod';
  environmentName = '🚀 PRODUCTION';
} else if (gitBranch === 'develop') {
  buildCommand = 'npm run build:shared && cd packages/web && npm run build:stage';
  environmentName = '🧪 STAGING';
} else {
  buildCommand = 'npm run build:shared && cd packages/web && npm run build:stage';
  environmentName = '👀 PREVIEW (using stage config)';
}

console.log(`✅ Selected Environment: ${environmentName}`);
console.log(`📦 Build Command: ${buildCommand}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔨 Step 1: Building Shared Package...\n');

// 빌드 실행
try {
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Build completed successfully!');
  console.log(`   Environment: ${environmentName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
} catch (error) {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ Build failed!');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`Environment: ${environmentName}`);
  console.error(`Command: ${buildCommand}`);
  console.error(`Error: ${error.message}`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}
