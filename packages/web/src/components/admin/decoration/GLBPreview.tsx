import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FiEye, FiRefreshCw } from 'react-icons/fi';

export function GLBPreview({ modelUrl, color, onCapture }: {
  modelUrl: string;
  color?: [number, number, number];
  onCapture: (blob: Blob) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameRef = useRef<number>(0);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);

  const captureCanvas = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    const captureSize = 512;

    // Save original state
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalAspect = camera.aspect;

    // Set square for capture
    renderer.setSize(captureSize, captureSize);
    camera.aspect = 1;

    // Reset rotation to initial state for capture
    const savedRotations: { child: THREE.Object3D; y: number }[] = [];
    if (modelRef.current) {
      scene.traverse((child) => {
        if (child.type === 'Group' && child.parent === scene) {
          savedRotations.push({ child, y: child.rotation.y });
          child.rotation.y = 0;
        }
      });
    }

    // Tight-fit camera for square capture — fill frame with no margin
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const visibleDim = Math.max(size.x, size.y);
      const fov = camera.fov * (Math.PI / 180);
      const dist = visibleDim / (2 * Math.tan(fov / 2)) * 1.05;
      camera.position.set(center.x, center.y, center.z + size.z / 2 + dist);
      camera.lookAt(center);
    }
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    renderer.domElement.toBlob((blob) => {
      if (blob) onCapture(blob);

      // Restore rotation
      for (const saved of savedRotations) {
        saved.child.rotation.y = saved.y;
      }

      // Restore original state
      renderer.setSize(originalSize.x, originalSize.y);
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();
    }, 'image/png');
  };

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Environment map for PBR materials
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.4;
    pmremGenerator.dispose();

    // Lights (subtle — environment map handles most illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.2);
    dirLight1.position.set(2, 3, 5);
    scene.add(dirLight1);

    // Load GLB
    let autoCaptureTimer: ReturnType<typeof setTimeout> | null = null;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        modelRef.current = model;

        // Apply initial color
        if (color) {
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && mat.color) {
                mat.color.setRGB(color[0], color[1], color[2]);
              }
            }
          });
        }

        // Auto-fit camera
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const dist = maxDim / (2 * Math.tan(fov / 2)) * 1.8;
        camera.position.set(center.x, center.y + dist * 0.15, center.z + dist);
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
      if (scene.environment) {
        scene.environment.dispose();
        scene.environment = null;
      }
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [modelUrl]);

  useEffect(() => {
    if (!modelRef.current || !color) return;
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.color) {
          mat.color.setRGB(color[0], color[1], color[2]);
        }
      }
    });
  }, [color]);

  const handleCapture = () => {
    captureCanvas();
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full border border-gray-300 rounded-lg overflow-hidden"
        style={{
          height: 300,
          backgroundImage: 'repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%)',
          backgroundSize: '16px 16px',
        }}
      />
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
