import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

const CLAT = -36, CLNG = -71, S = 2.0;
const toScene = (lat, lng, y = 0) => [(lng - CLNG) * S, y, (lat - CLAT) * S];

const CHILE = [
  [-17.5,-70.3],[-18.5,-70.3],[-19.6,-70.1],[-20.2,-70.1],[-21.0,-70.1],[-22.0,-70.1],
  [-23.0,-70.4],[-24.0,-70.5],[-25.0,-70.5],[-26.3,-70.7],[-27.4,-70.9],[-28.5,-71.1],
  [-29.0,-71.3],[-30.0,-71.4],[-31.0,-71.5],[-32.0,-71.5],[-33.0,-71.6],[-34.0,-71.8],
  [-35.0,-72.0],[-36.0,-72.8],[-37.0,-73.2],[-38.0,-73.2],[-38.7,-73.2],[-39.5,-73.3],
  [-40.5,-73.0],[-41.5,-72.9],[-42.5,-72.9],[-43.5,-73.0],[-44.5,-73.0],[-45.5,-72.5],
  [-46.5,-72.0],[-47.5,-72.0],[-48.5,-72.0],[-49.5,-72.0],[-50.5,-72.0],[-51.5,-72.0],
  [-52.5,-71.5],[-53.5,-70.5],[-54.5,-69.0],[-55.5,-67.5],[-56.0,-66.5],
  [-55.0,-67.0],[-54.0,-67.5],[-53.0,-68.5],[-52.0,-69.5],[-51.0,-69.5],[-50.0,-69.5],
  [-49.0,-69.5],[-48.0,-69.5],[-47.0,-69.5],[-46.0,-69.5],[-45.0,-69.5],[-44.0,-69.5],
  [-43.0,-69.5],[-42.0,-69.5],[-41.0,-69.5],[-40.0,-69.5],[-39.0,-69.5],[-38.0,-69.5],
  [-37.0,-69.5],[-36.0,-69.5],[-35.0,-69.5],[-34.0,-68.5],[-33.0,-67.5],[-32.0,-67.5],
  [-31.0,-67.5],[-30.0,-67.5],[-29.0,-67.5],[-28.0,-67.5],[-27.0,-67.5],[-26.0,-67.5],
  [-25.0,-67.5],[-24.0,-67.5],[-23.0,-67.5],[-22.0,-67.5],[-21.0,-67.5],[-20.0,-67.5],
  [-19.0,-68.0],[-18.0,-69.0],[-17.5,-70.3],
];

function insideChile(lat, lng) {
  let inside = false;
  for (let i = 0, j = CHILE.length - 1; i < CHILE.length; j = i++) {
    const xi = CHILE[i][1], yi = CHILE[i][0], xj = CHILE[j][1], yj = CHILE[j][0];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function noise(lat, lng) {
  return Math.max(0, ((Math.sin(lat * 0.5) * 0.8 + Math.cos(lng * 0.4) * 0.6 + Math.sin(lat * 0.2 + lng * 0.3) * 0.4) + 1.8) * 1.2);
}

const DEMO = [
  { name: 'TechCorp SCL', lat: -33.45, lng: -70.67, ok: true },
  { name: 'DataFlow Valpo', lat: -33.05, lng: -71.62, ok: true },
  { name: 'NubeSur', lat: -36.83, lng: -73.05, ok: true },
  { name: 'Antofagasta Data', lat: -23.65, lng: -70.40, ok: true },
  { name: 'Patagonia IT', lat: -53.16, lng: -70.91, ok: false },
  { name: 'Norte Cloud', lat: -20.21, lng: -70.15, ok: true },
  { name: 'Costa Host', lat: -29.90, lng: -71.25, ok: true },
  { name: 'Sur Server', lat: -41.47, lng: -72.94, ok: true },
];

/* Generate point cloud at module level */
const N = 6000;
function genPoints() {
  const positions = [];
  const colors = [];
  let idx = 0, att = 0;
  while (idx < N && att < N * 20) {
    att++;
    const lat = -17.5 - Math.random() * 38.5, lng = -66 - Math.random() * 10;
    if (!insideChile(lat, lng)) continue;
    const [x, , z] = toScene(lat, lng);
    positions.push(x, 0, z);
    const t = Math.min(noise(lat, lng) / 3.5, 1);
    colors.push(0.05 + t * 0.45, 0.08 + t * 0.55, 0.15 + t * 0.25);
    idx++;
  }
  return { positions, colors };
}
const { positions: pts, colors: cls } = genPoints();

function SplatCloud() {
  const ref = useRef();
  const progress = useRef(0);

  useEffect(() => {
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array;
    const targetYs = [];
    for (let i = 0; i < N; i++) {
      const [x, , z] = [arr[i*3], 0, arr[i*3+2]];
      targetYs.push(noise(
        (z / S) + CLAT,
        (x / S) + CLNG
      ) * 0.8);
    }
    const start = performance.now();
    let id = setInterval(() => {
      const t = Math.min((performance.now() - start) / 3000, 1);
      for (let i = 0; i < N; i++) {
        const delay = ((arr[i*3] + 10) / 80 + (arr[i*3+2] + 20) / 40) * 0.5;
        const p = Math.max(0, Math.min(1, (t - delay * 0.5) / (1 - delay * 0.5)));
        const e = 1 - Math.pow(1 - p, 2);
        arr[i*3+1] = targetYs[i] * e;
      }
      pos.needsUpdate = true;
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(pts), 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[new Float32Array(cls), 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Building({ biz, idx: i }) {
  const [x, , z] = toScene(biz.lat, biz.lng);
  const h = 1.5 + (i % 3) * 0.8;
  const col = biz.ok !== false ? '#00ff88' : '#ff4444';
  const meshRef = useRef();
  const labelRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const delay = i * 100;
    let id = setInterval(() => {
      const t = Math.max(0, Math.min((performance.now() - start - delay) / 1500, 1));
      const e = 1 - Math.pow(1 - t, 3);
      if (meshRef.current) meshRef.current.position.y = h / 2 * e;
      if (labelRef.current) labelRef.current.material.opacity = t;
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);

  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(0, 0, 512, 96);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Courier New",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(biz.name, 256, 44);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);

  return (
    <group position={[x, 0, z]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.8 + (i % 2) * 0.3, h, 0.8 + (i % 2) * 0.3]} />
        <meshPhysicalMaterial color={col} metalness={0.2} roughness={0.3} emissive={col} emissiveIntensity={0.3} />
      </mesh>
      <sprite ref={labelRef} position={[0, h + 4, 0]} scale={[6, 1.1, 1]}>
        <spriteMaterial map={tex} transparent depthTest={false} sizeAttenuation opacity={0} />
      </sprite>
    </group>
  );
}

const SECURELAB = { lat: -33.408, lng: -70.567 };

function SecLab() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2));
  });
  return (
    <mesh ref={ref} position={toScene(SECURELAB.lat, SECURELAB.lng, 0.8)}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshPhysicalMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
    </mesh>
  );
}

function BizLine({ biz }) {
  const [x, , z] = toScene(biz.lat, biz.lng);
  const slX = (SECURELAB.lng - CLNG) * S, slZ = (SECURELAB.lat - CLAT) * S;
  const pts = useMemo(() => {
    const r = [];
    for (let t = 0; t <= 1; t += 0.05)
      r.push([x + (slX - x) * t, 0.1 + Math.sin(t * Math.PI) * 3, z + (slZ - z) * t]);
    return r;
  }, []);
  return <Line points={pts} color="#00ff88" transparent opacity={0.06} lineWidth={1} />;
}

function SceneContent({ geoCompanies }) {
  const allBiz = useMemo(() => {
    const b = [...DEMO];
    geoCompanies.forEach(gc => {
      if (gc.lat && gc.lng && !b.some(x => Math.abs(x.lat - gc.lat) < 0.1 && Math.abs(x.lng - gc.lng) < 0.1))
        b.push(gc);
    });
    return b;
  }, [geoCompanies]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[30, 40, 20]} intensity={1.2} color="#88bbff" />
      <directionalLight position={[-30, 20, -20]} intensity={0.3} color="#ff8844" />
      <gridHelper args={[100, 40, '#1a1a3a', '#111128']} position={[0, -0.05, 0]} />
      <SplatCloud />
      {allBiz.map((b, i) => <Building key={`b-${i}`} biz={b} idx={i} />)}
      {allBiz.map((b, i) => <BizLine key={`l-${i}`} biz={b} />)}
      <SecLab />
      <OrbitControls enableDamping dampingFactor={0.1} minDistance={5} maxDistance={100} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function ChileLiDARMap({ companies = [], onGeocodeStatus }) {
  const [geo, setGeo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companies.length) { setLoading(false); return; }
    let dead = false;
    (async () => {
      const r = [];
      for (const c of companies) {
        if (dead) break;
        try {
          const q = encodeURIComponent(`${c.name} Chile`);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=cl`, {
            headers: { 'User-Agent': 'SecureLabDash/1.0' },
          });
          const d = await res.json();
          if (d?.length) r.push({ ...c, lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lng) });
        } catch {}
        await new Promise(x => setTimeout(x, 1100));
      }
      if (!dead) { setGeo(r); setLoading(false); onGeocodeStatus?.(r.length); }
    })();
    return () => { dead = true; };
  }, [companies]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-bg-base">
      <Canvas camera={{ position: [0, 25, 40], fov: 45, near: 0.1, far: 300 }} style={{ width: '100%', height: '100%', display: 'block' }}>
        <SceneContent geoCompanies={geo} />
      </Canvas>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-base/80 z-10 gap-2 pointer-events-none">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-text-muted">Geolocalizando empresas...</p>
        </div>
      )}
    </div>
  );
}
