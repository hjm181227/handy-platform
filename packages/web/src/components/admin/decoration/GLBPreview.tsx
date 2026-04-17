import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FiEye, FiRefreshCw } from 'react-icons/fi';

export function GLBPreview({ modelUrl, onCapture }: { modelUrl: string; onCapture: (blob: Blob) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);

  const captureCanvas = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    renderer.domElement.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, 'image/png');
  };

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Load GLB
    let autoCaptureTimer: ReturnType<typeof setTimeout> | null = null;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Auto-fit camera
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const dist = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
        camera.position.set(center.x + dist * 0.5, center.y + dist * 0.3, center.z + dist);
        camera.lookAt(center);
        camera.updateProjectionMatrix();

        // Auto-capture after a short delay to ensure rendering is complete
        setIsAutoCapturing(true);
        autoCaptureTimer = setTimeout(() => {
          captureCanvas();
          setIsAutoCapturing(false);
        }, 500);
      },
      undefined,
      (err) => console.error('GLB load error:', err)
    );

    // Animation loop
    let rotationY = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      rotationY += 0.005;
      scene.traverse((child) => {
        if (child.type === 'Group' && child.parent === scene) {
          child.rotation.y = rotationY;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (autoCaptureTimer) clearTimeout(autoCaptureTimer);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [modelUrl]);

  const handleCapture = () => {
    captureCanvas();
  };

  return (
    <div>
      <div ref={containerRef} className="w-full border border-gray-300 rounded-lg overflow-hidden" style={{ height: 300 }} />
      <div className="mt-2 flex items-center gap-2">
        {isAutoCapturing && (
          <span className="inline-flex items-center text-sm text-indigo-600">
            <FiRefreshCw className="mr-1 animate-spin" />
            자동 캡처 중...
          </span>
        )}
        <button
          type="button"
          onClick={handleCapture}
          disabled={isAutoCapturing}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiEye className="mr-1" />
          다시 캡처
        </button>
      </div>
    </div>
  );
}
