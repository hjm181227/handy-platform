import type { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';

export interface NailSizeChartOptions {
  format: 'png' | 'jpeg';
  quality?: number;
  scale?: number;
}

const FINGERS = ['엄지', '검지', '중지', '약지', '새끼'] as const;
const FINGER_KEYS = ['thumb', 'index', 'middle', 'ring', 'little'] as const;

const COLORS = {
  bg: '#FFFFFF',
  cardBg: '#FAFAFA',
  text: '#131211',
  textSecondary: '#71717A',
  textTertiary: '#D0C9C3',
  border: '#E5E0DC',
  leftHand: '#FF4D6D',
  rightHand: '#991B1B',
  brand: '#FF4D6D',
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHandSection(
  ctx: CanvasRenderingContext2D,
  data: NailSizeData['leftHand'],
  label: string,
  badge: string,
  color: string,
  yOffset: number,
  canvasWidth: number,
) {
  const startX = 60;
  const usableWidth = canvasWidth - 120;
  const gap = 12;
  const cellWidth = (usableWidth - gap * 4) / 5;

  // Badge circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(startX + 14, yOffset + 14, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, startX + 14, yOffset + 15);

  // Hand label
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, startX + 38, yOffset + 20);

  // Finger cells
  const cellY = yOffset + 40;
  const cellHeight = 76;

  FINGER_KEYS.forEach((key, i) => {
    const cellX = startX + i * (cellWidth + gap);
    const value = data[key];

    // Cell background
    ctx.fillStyle = COLORS.cardBg;
    drawRoundRect(ctx, cellX, cellY, cellWidth, cellHeight, 12);
    ctx.fill();

    // Cell border
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    drawRoundRect(ctx, cellX, cellY, cellWidth, cellHeight, 12);
    ctx.stroke();

    // Finger name
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(FINGERS[i], cellX + cellWidth / 2, cellY + 28);

    // Value
    if (value > 0) {
      ctx.fillStyle = color;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(value.toFixed(1), cellX + cellWidth / 2, cellY + 58);
    } else {
      ctx.fillStyle = COLORS.textTertiary;
      ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('-', cellX + cellWidth / 2, cellY + 58);
    }

    // Unit
    ctx.fillStyle = COLORS.textTertiary;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('mm', cellX + cellWidth / 2, cellY + 72);
  });
}

function formatDateForChart(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatDateForFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function renderNailSizeChart(
  data: NailSizeData,
  options: NailSizeChartOptions = { format: 'png' },
): Promise<Blob> {
  const { format = 'png', quality = 0.92, scale = 2 } = options;

  const WIDTH = 800;
  const HEIGHT = 520;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * scale;
  canvas.height = HEIGHT * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('손톱 사이즈표', WIDTH / 2, 50);

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('Nail Size Chart', WIDTH / 2, 70);

  // Divider
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 88);
  ctx.lineTo(WIDTH - 60, 88);
  ctx.stroke();

  // Left hand
  drawHandSection(ctx, data.leftHand, '왼손', 'L', COLORS.leftHand, 108, WIDTH);

  // Right hand
  drawHandSection(ctx, data.rightHand, '오른손', 'R', COLORS.rightHand, 248, WIDTH);

  // Footer
  const footerY = 390;

  // Measurement date
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`측정일: ${formatDateForChart(data.measuredAt)}`, WIDTH / 2, footerY);

  // Divider
  ctx.strokeStyle = COLORS.border;
  ctx.beginPath();
  ctx.moveTo(60, footerY + 20);
  ctx.lineTo(WIDTH - 60, footerY + 20);
  ctx.stroke();

  // Brand
  ctx.fillStyle = COLORS.brand;
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('HANDY', WIDTH / 2, footerY + 50);

  ctx.fillStyle = COLORS.textTertiary;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('www.h-andy.com', WIDTH / 2, footerY + 68);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 생성에 실패했습니다.'));
      },
      mimeType,
      format === 'jpeg' ? quality : undefined,
    );
  });
}

function isWebViewEnvironment(): boolean {
  return !!(window as any).ReactNativeWebView;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // data:image/png;base64,xxxx → xxxx 부분만 추출
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadNailSizeChart(blob: Blob, format: 'png' | 'jpeg'): Promise<void> {
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const filename = `handy-nail-sizes-${formatDateForFilename()}.${ext}`;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  if (isWebViewEnvironment()) {
    // 앱 WebView: Bridge를 통해 네이티브 갤러리에 저장
    const base64 = await blobToBase64(blob);
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SAVE_IMAGE',
      data: {
        base64,
        filename,
        mimeType,
        requestId: Date.now().toString(),
      },
    }));
    return;
  }

  // 웹 브라우저: 직접 다운로드
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
