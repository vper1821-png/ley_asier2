import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Plane, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const ROOM_W = 24, ROOM_D = 20, WALL_OFFSET = 0.3, CEILING_Y = 3.5;
const OBSTACLES = [
  { x: 0, z: -(ROOM_D / 2 + WALL_OFFSET), w: ROOM_W + 1, d: 0.6 },
  { x: 0, z: ROOM_D / 2 + WALL_OFFSET, w: ROOM_W + 1, d: 0.6 },
  { x: -(ROOM_W / 2 + WALL_OFFSET), z: 0, w: 0.6, d: ROOM_D + 1 },
  { x: ROOM_W / 2 + WALL_OFFSET, z: 0, w: 0.6, d: ROOM_D + 1 },
  { x: -4, z: 0, w: 1.2, d: 16.4 },
  { x: 1, z: 0, w: 1.2, d: 16.4 },
  { x: 6, z: 0, w: 1.2, d: 16.4 },
  { x: -8, z: 7, w: 2.6, d: 1.8 },
  { x: 9, z: 6.5, w: 2.2, d: 1.0 },
  { x: 9, z: 3.5, w: 2.2, d: 1.0 },
  { x: 9, z: 0.5, w: 2.2, d: 1.0 },
  { x: -10, z: -8.5, w: 1.0, d: 0.8 },
  { x: -10.5, z: 6, w: 0.6, d: 0.6 },
];

function checkCollision(x, z, radius = 0.4) {
  for (const obs of OBSTACLES) {
    if (Math.abs(x - obs.x) < obs.w / 2 + radius && Math.abs(z - obs.z) < obs.d / 2 + radius) return true;
  }
  return false;
}

/* ---------- Fan component with spinning blades ---------- */
function Fan({ position, size = 0.15, speed = 2 }) {
  const bladesRef = useRef();
  useFrame((state) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });
  return (
    <group position={position}>
      {/* Fan housing */}
      <Cylinder args={[size, size, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </Cylinder>
      {/* Center hub */}
      <Sphere args={[size * 0.15, 8, 8]}>
        <meshBasicMaterial color="#555" />
      </Sphere>
      {/* Spinning blades */}
      <group ref={bladesRef}>
        {Array.from({ length: 4 }, (_, i) => (
          <Box
            key={i}
            args={[0.005, size * 0.6, size * 0.15]}
            position={[0, 0, 0]}
            rotation={[0, 0, (i * Math.PI) / 2]}
          >
            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} />
          </Box>
        ))}
        {/* Blade tips rounded */}
        {Array.from({ length: 4 }, (_, i) => (
          <Sphere
            key={`tip-${i}`}
            args={[size * 0.06, 6, 6]}
            position={[Math.sin((i * Math.PI) / 2) * size * 0.3, Math.cos((i * Math.PI) / 2) * size * 0.3, 0]}
          >
            <meshStandardMaterial color="#777" metalness={0.5} roughness={0.3} />
          </Sphere>
        ))}
      </group>
      {/* Grill */}
      {Array.from({ length: 6 }, (_, i) => (
        <Cylinder
          key={`grill-${i}`}
          args={[0.002, 0.002, size * 1.6]}
          position={[Math.sin((i * Math.PI) / 3) * size * 0.6, Math.cos((i * Math.PI) / 3) * size * 0.6, 0.015]}
          rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}
        >
          <meshBasicMaterial color="#444" />
        </Cylinder>
      ))}
    </group>
  );
}

/* ---------- Air flow effect ---------- */
function AirFlow({ position, length = 1.5, width = 0.3 }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float time;varying vec2 vUv;void main(){float w=sin(vUv.x*20.+time*2.)*.3+.5;float w2=sin(vUv.y*10.+time*1.5+vUv.x*5.)*.2;gl_FragColor=vec4(.6,.8,1.,w*w2*.15);}`,
  }), []);
  useFrame((state) => { mat.uniforms.time.value = state.clock.elapsedTime; });
  return (
    <mesh position={position} rotation={[0, 0, 0]}>
      <planeGeometry args={[width, length]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/* ---------- Real 3D Cable with curve ---------- */
function Cable3D({ from, to, color = '#4488ff', thickness = 0.015, segments = 12 }) {
  const curve = useMemo(() => {
    const fx = from[0], fy = from[1] || 0.02, fz = from[2];
    const tx = to[0], ty = to[1] || 0.02, tz = to[2];
    const mx = (fx + tx) / 2 + (Math.random() - 0.5) * 0.4;
    const my = Math.max(fy, ty) + 0.02 + Math.random() * 0.1;
    const mz = (fz + tz) / 2 + (Math.random() - 0.5) * 0.4;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, fy, fz),
      new THREE.Vector3(fx + (mx - fx) * 0.3, fy + 0.01, fz + (mz - fz) * 0.3),
      new THREE.Vector3(mx, my, mz),
      new THREE.Vector3(tx + (mx - tx) * 0.3, ty + 0.01, tz + (mz - tz) * 0.3),
      new THREE.Vector3(tx, ty, tz),
    ]);
  }, [from, to]);
  return (
    <mesh>
      <tubeGeometry args={[curve, segments, thickness, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
    </mesh>
  );
}

/* ---------- Cable bundle (multiple cables grouped) ---------- */
function CableBundle({ from, to, count = 3, baseColor = '#4488ff' }) {
  const colors = ['#4488ff', '#44ff88', '#ff4444', '#ffaa00', '#ff44ff', '#888888'];
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Cable3D
          key={i}
          from={[from[0] + (i - 1) * 0.03, 0.02 + i * 0.005, from[2] + (i % 2) * 0.03]}
          to={[to[0] + (i - 1) * 0.03, 0.02 + i * 0.005, to[2] + (i % 2) * 0.03]}
          color={colors[(i + 1) % colors.length]}
          thickness={0.012 + Math.random() * 0.008}
        />
      ))}
    </group>
  );
}

/* ---------- Drive Bay ---------- */
function DriveBay({ position }) {
  return (
    <group position={position}>
      <Box args={[0.12, 0.015, 0.01]} position={[0.05, 0, 0]}>
        <meshBasicMaterial color="#333" />
      </Box>
      <Box args={[0.05, 0.012, 0.01]} position={[-0.06, 0, 0]}>
        <meshBasicMaterial color="#444" />
      </Box>
    </group>
  );
}

/* ---------- Server Unit (individual) ---------- */
function ServerUnit({ color, ledColor, hasActivity, hasLogo, logoMat, yPos, unitHeight, index, rowIdx, unitIdx }) {
  const labelTex = useMemo(() => {
    const clusters = ['K8S-MSTR', 'HADOOP', 'SPARK--', 'ELASTIC', 'CASSAND', 'MONGO-D', 'POSTGRE', 'REDIS--', 'RABBITM', 'GITLAB-'];
    const roles = ['master', 'worker', 'data--', 'node--', 'primary', 'replica', 'cache-', 'broker', 'runner', 'gw----'];
    const i = (rowIdx * 30 + unitIdx * 5 + index);
    const cluster = clusters[i % clusters.length];
    const role = roles[(i + 3) % roles.length];
    const num = String((i % 99) + 1).padStart(2, '0');
    const c = document.createElement('canvas');
    c.width = 512; c.height = 80;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, '#141820'); grad.addColorStop(1, '#080a0e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 80);
    ctx.strokeStyle = '#2a3040'; ctx.lineWidth = 1; ctx.strokeRect(1, 1, 510, 78);
    ctx.fillStyle = '#00ff88'; ctx.font = 'bold 26px "Courier New",monospace';
    ctx.fillText(`${cluster}-${num}`, 10, 32);
    ctx.fillStyle = '#6a8aaa'; ctx.font = '14px "Courier New",monospace';
    ctx.fillText(role, 10, 56);
    ctx.beginPath(); ctx.arc(480, 22, 7, 0, Math.PI * 2);
    ctx.fillStyle = hasActivity ? '#00ff88' : '#330000';
    ctx.shadowColor = hasActivity ? '#00ff88' : 'transparent';
    ctx.shadowBlur = hasActivity ? 12 : 0; ctx.fill();
    ctx.shadowBlur = 0;
    for (let j = 0; j < 16; j++) {
      ctx.fillStyle = (j + i) % 2 === 0 ? '#334' : '#1a1e28';
      ctx.fillRect(420 + j * 5, 58, 3, 16);
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true; return t;
  }, [index, rowIdx, unitIdx, hasActivity]);
  const blinkRef = useRef();
  const activityRef = useRef();
  useFrame((state) => {
    if (!hasActivity) return;
    const t = state.clock.elapsedTime;
    if (blinkRef.current) {
      const blink = Math.sin(t * 3 + index * 1.7) > 0.3 ? 1 : 0.3;
      blinkRef.current.material.opacity = blink;
    }
    if (activityRef.current) {
      const flicker = Math.sin(t * 7 + index * 2.3) * 0.5 + 0.5;
      activityRef.current.material.opacity = flicker;
    }
  });
  return (
    <group position={[0, yPos, 0]}>
      <Box args={[0.95, unitHeight - 0.02, 0.75]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </Box>
      <Box args={[0.88, unitHeight - 0.04, 0.02]} position={[0, 0, 0.38]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </Box>
      {Array.from({ length: 3 }, (_, j) => (
        <DriveBay key={j} position={[-0.2 + j * 0.2, 0, 0.38]} />
      ))}
      <mesh position={[0.38, unitHeight / 2 - 0.02, 0.38]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color={hasActivity ? ledColor : '#330000'} />
      </mesh>
      {hasActivity && (
        <mesh position={[0.38, unitHeight / 2 - 0.02, 0.38]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshBasicMaterial color={ledColor} transparent opacity={0.15} depthWrite={false} />
        </mesh>
      )}
      <mesh ref={blinkRef} position={[0.3, unitHeight / 2 - 0.02, 0.38]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={1} />
      </mesh>
      <mesh ref={activityRef} position={[0.22, unitHeight / 2 - 0.02, 0.38]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.39]}>
        <planeGeometry args={[0.8, unitHeight - 0.06]} />
        <meshBasicMaterial color={hasActivity ? ledColor : '#000'} transparent opacity={hasActivity ? 0.04 : 0} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 6 }, (_, j) => (
        <mesh key={`led-${j}`} position={[-0.38 + j * 0.08, -unitHeight / 2 + 0.025, 0.38]}>
          <boxGeometry args={[0.01, 0.004, 0.004]} />
          <meshBasicMaterial color={hasActivity ? (j < 2 ? '#00ff88' : j < 4 ? '#ffaa00' : '#00aaff') : '#220000'} transparent opacity={hasActivity ? (0.7 + Math.sin(j * 2.5) * 0.3) : 0.2} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, j) => (
        <Box key={`vent-${j}`} args={[0.1, 0.003, 0.01]} position={[-0.2 + j * 0.1, -unitHeight / 4, 0.38]}>
          <meshBasicMaterial color="#1a1a1a" />
        </Box>
      ))}
      {hasLogo && logoMat && (
        <Plane args={[0.25, 0.1]} position={[0.15, unitHeight / 2 - 0.03, 0.38]}>
          <primitive object={logoMat} attach="material" />
        </Plane>
      )}
      {labelTex && (
        <mesh position={[0, unitHeight * 0.05, 0.382]}>
          <planeGeometry args={[0.7, unitHeight * 0.65]} />
          <meshBasicMaterial map={labelTex} transparent />
        </mesh>
      )}
      {hasActivity && (
        <Box args={[0.7, 0.003, 0.02]} position={[0, -unitHeight / 2 + 0.01, 0.38]}>
          <meshBasicMaterial color={ledColor} transparent opacity={0.08} />
        </Box>
      )}
    </group>
  );
}

/* ---------- Server Rack Row (continuous) ---------- */
function ServerRackRow({ position, length, height = 3.2, serversPerUnit = 5, units = 6, logo, dbInfo, rowIndex }) {
  const logoMat = useMemo(() => {
    if (!logo) return null;
    return new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.3, metalness: 0.1 });
  }, [logo]);
  const compliant = dbInfo?.compliant !== false;
  const colors = ['#1a2a4a', '#0d1f3a', '#1a3a2a', '#2a1a0a', '#1a2a4a', '#0d1f3a'];
  const unitWidth = length / units;

  return (
    <group position={position}>
      {/* Main frame - long continuous block */}
      <Box args={[length, height, 1.1]} position={[0, height / 2, 0]}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
      </Box>
      {/* Top rail with LED strip */}
      <Box args={[length - 0.2, 0.03, 1.05]} position={[0, height + 0.015, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[length - 2, 0.005, 0.02]} position={[0, height + 0.03, 0.38]}>
        <meshBasicMaterial color={compliant ? '#00ff88' : '#ff3333'} transparent opacity={0.6} />
      </Box>
      {/* Bottom rail */}
      <Box args={[length - 0.2, 0.03, 1.05]} position={[0, -0.015, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Side strips */}
      <Box args={[0.03, height, 0.03]} position={[-length / 2 + 0.01, height / 2, -0.52]}>
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[0.03, height, 0.03]} position={[length / 2 - 0.01, height / 2, -0.52]}>
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </Box>
      {/* LED strips along sides */}
      <Box args={[0.005, height * 0.8, 0.005]} position={[-length / 2 + 0.02, height / 2, -0.48]}>
        <meshBasicMaterial color={compliant ? '#00ff88' : '#ff3333'} transparent opacity={0.15} />
      </Box>
      <Box args={[0.005, height * 0.8, 0.005]} position={[length / 2 - 0.02, height / 2, -0.48]}>
        <meshBasicMaterial color={compliant ? '#00ff88' : '#ff3333'} transparent opacity={0.15} />
      </Box>
      {/* Server units along the row */}
      {Array.from({ length: units }, (_, u) => {
        const startX = -length / 2 + unitWidth / 2 + u * unitWidth;
        return (
          <group key={u} position={[startX, 0, 0]}>
            {Array.from({ length: serversPerUnit }, (_, i) => {
              const uh = (height - 0.4) / serversPerUnit;
              const y = 0.2 + i * uh + uh / 2;
              const col = colors[i % colors.length];
              const ledColor = compliant ? (i % 3 === 0 ? '#00ff88' : i % 3 === 1 ? '#ffaa00' : '#00aaff') : '#ff3333';
              return (
                <ServerUnit
                  key={i}
                  color={col}
                  ledColor={ledColor}
                  hasActivity={compliant}
                  hasLogo={i === 0 && u === 0}
                  logoMat={i === 0 && u === 0 ? logoMat : null}
                  yPos={y}
                  unitHeight={uh}
                  index={i + u * 7 + rowIndex * 50}
                />
              );
            })}
          </group>
        );
      })}
      {/* Status LED bar */}
      <Box args={[length - 1, 0.02, 0.02]} position={[0, 0.05, 0.38]}>
        <meshBasicMaterial color={compliant ? '#00ff88' : '#ff3333'} transparent opacity={0.8} />
      </Box>
      {/* Ambient glow */}
      <pointLight position={[0, 0.05, 0]} intensity={0.2} color={compliant ? '#00ff88' : '#ff3333'} distance={3} />
      {/* Cable management channel at rear */}
      <Box args={[length - 0.5, 0.1, 0.2]} position={[0, 0.1, -0.58]}>
        <meshStandardMaterial color="#222" metalness={0.3} roughness={0.7} />
      </Box>
      {/* Cooling fans on top of row */}
      {Array.from({ length: Math.max(1, Math.floor(units / 2)) }, (_, fi) => (
        <Fan key={`fan-${fi}`} position={[-length / 2 + 1 + fi * unitWidth * 2, height + 0.3, 0]} size={0.12} speed={2 + rowIndex} />
      ))}
      {/* Air flow effects above fans */}
      {Array.from({ length: Math.max(1, Math.floor(units / 2)) }, (_, fi) => (
        <AirFlow key={`air-${fi}`} position={[-length / 2 + 1 + fi * unitWidth * 2, height + 0.8, 0]} length={1.2} width={0.25} />
      ))}
    </group>
  );
}



/* ---------- Structured cable conduits (organized, transparent tubes with visible inner cables) ---------- */
function ConduitSegment({ from, to, cableCount = 3, size = 0.06 }) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (length < 0.01) return null;
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  let rot = [0, 0, 0];
  if (Math.abs(dx) > Math.abs(dz) && Math.abs(dx) > Math.abs(dy)) rot = [0, 0, -Math.PI / 2];
  else if (Math.abs(dy) > Math.abs(dz)) rot = [Math.PI / 2, 0, 0];
  const colors = ['#4488ff', '#ff4444', '#44ff88', '#ffaa00', '#ff44ff', '#44ffaa', '#8888ff', '#ff8888'];
  return (
    <group position={mid} rotation={rot}>
      <Box args={[size, size, length + 0.01]}>
        <meshPhysicalMaterial color="#6699cc" transparent opacity={0.10} roughness={0.1} metalness={0.3} side={THREE.DoubleSide} envMapIntensity={0.5} />
      </Box>
      {Array.from({ length: cableCount }, (_, i) => (
        <Cylinder key={i} args={[0.004, 0.004, length + 0.03, 6]} position={[(i - (cableCount - 1) / 2) * 0.016, 0, 0]}>
          <meshStandardMaterial color={colors[i % colors.length]} roughness={0.6} />
        </Cylinder>
      ))}
    </group>
  );
}

function StructuredCabling() {
  const Y = CEILING_Y - 0.15;
  const HW = 11.5;
  const HD = 9.8;
  const rowXs = [-4, 1, 6];
  const rowLen = 16;
  const cableCount = 6;

  return (
    <group>
      {/* Perimeter loop */}
      <ConduitSegment from={[-HW, Y, -HD]} to={[HW, Y, -HD]} cableCount={cableCount} />
      <ConduitSegment from={[HW, Y, -HD]} to={[HW, Y, HD]} cableCount={cableCount} />
      <ConduitSegment from={[HW, Y, HD]} to={[-HW, Y, HD]} cableCount={cableCount} />
      <ConduitSegment from={[-HW, Y, HD]} to={[-HW, Y, -HD]} cableCount={cableCount} />

      {/* Cross feeds to each rack row */}
      {rowXs.map((x) => (
        <ConduitSegment key={`cross-${x}`} from={[-HW, Y, 0]} to={[x - rowLen / 2 - 1, Y, 0]} cableCount={4} />
      ))}
      {rowXs.map((x) => (
        <ConduitSegment key={`cross2-${x}`} from={[x + rowLen / 2 + 1, Y, 0]} to={[HW, Y, 0]} cableCount={4} />
      ))}

      {/* Conduit along top of each rack row */}
      {rowXs.map((x) => (
        <ConduitSegment key={`row-${x}`} from={[x - rowLen / 2, Y, 0]} to={[x + rowLen / 2, Y, 0]} cableCount={4} />
      ))}

      {/* Down drops to racks */}
      {rowXs.map((x) =>
        [-6, -2, 2, 6].map((zOff) => (
          <ConduitSegment key={`drop-${x}-${zOff}`} from={[x + zOff, Y, 0]} to={[x + zOff, Y - 0.3, 0]} cableCount={2} size={0.04} />
        ))
      )}

      {/* Feeds toward desk area */}
      <ConduitSegment from={[-HW, Y, 7]} to={[-6, Y, 7]} cableCount={3} />
      <ConduitSegment from={[-6, Y, 7]} to={[-6, Y - 0.3, 7]} cableCount={3} size={0.04} />
    </group>
  );
}

/* ---------- Sofa ---------- */
function Sofa({ position = [7, 0, 6.5], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <Box args={[2.0, 0.3, 0.9]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </Box>
      {/* Seat cushion */}
      <Box args={[1.8, 0.12, 0.8]} position={[0, 0.36, 0]}>
        <meshStandardMaterial color="#2a2a4a" roughness={0.95} />
      </Box>
      {/* Backrest */}
      <Box args={[1.9, 0.6, 0.12]} position={[0, 0.6, -0.45]}>
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </Box>
      {/* Backrest cushion */}
      <Box args={[1.7, 0.5, 0.08]} position={[0, 0.6, -0.46]}>
        <meshStandardMaterial color="#2a2a4a" roughness={0.95} />
      </Box>
      {/* Armrest left */}
      <Box args={[0.1, 0.25, 0.85]} position={[-0.95, 0.35, 0]}>
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </Box>
      {/* Armrest right */}
      <Box args={[0.1, 0.25, 0.85]} position={[0.95, 0.35, 0]}>
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </Box>
      {/* Armrest top cushions */}
      <Box args={[0.12, 0.06, 0.8]} position={[-0.95, 0.48, 0]}>
        <meshStandardMaterial color="#2a2a4a" roughness={0.95} />
      </Box>
      <Box args={[0.12, 0.06, 0.8]} position={[0.95, 0.48, 0]}>
        <meshStandardMaterial color="#2a2a4a" roughness={0.95} />
      </Box>
      {/* Legs */}
      {[[-0.85, -0.15, -0.4], [0.85, -0.15, -0.4], [-0.85, -0.15, 0.4], [0.85, -0.15, 0.4]].map((p, i) => (
        <Cylinder key={i} args={[0.015, 0.02, 0.15]} position={p}>
          <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
        </Cylinder>
      ))}
    </group>
  );
}

/* ---------- Networking Rack ---------- */
function NetworkingRack() {
  return (
    <group position={[-10, 0, -8.5]}>
      <Box args={[0.8, 2.0, 0.6]} position={[0, 1.0, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Patch panels */}
      {Array.from({ length: 4 }, (_, i) => (
        <Box key={i} args={[0.7, 0.05, 0.02]} position={[0, 1.7 - i * 0.4, 0.31]}>
          <meshStandardMaterial color="#222" />
        </Box>
      ))}
      {/* LED indicators */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.3 + i * 0.08, 1.7, 0.32]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#00ff88' : i % 3 === 1 ? '#ffaa00' : '#00aaff'} />
        </mesh>
      ))}
      {/* Ventilation slots */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} args={[0.6, 0.003, 0.01]} position={[0, 0.8 - i * 0.12, 0.31]}>
          <meshBasicMaterial color="#333" />
        </Box>
      ))}
      {/* Cables coming out */}
      {Array.from({ length: 4 }, (_, i) => (
        <Cable3D
          key={i}
          from={[-0.3 + i * 0.2, 0.1, 0.32]}
          to={[-0.3 + i * 0.2, 0.02, 1.5]}
          color={['#4488ff', '#44ff88', '#ff4444', '#ffaa00'][i]}
          thickness={0.006}
        />
      ))}
    </group>
  );
}

/* ---------- Wall-mounted monitoring screen ---------- */
function WallScreen({ position, size = [1.2, 0.8] }) {
  return (
    <group position={position}>
      <Box args={[size[0] + 0.06, size[1] + 0.06, 0.04]}>
        <meshStandardMaterial color="#0a0a0a" />
      </Box>
      <Box args={[size[0], size[1], 0.02]} position={[0, 0, -0.025]}>
        <meshStandardMaterial color="#0a0a2a" emissive="#4488ff" emissiveIntensity={0.1} />
      </Box>
      {/* Screen glare */}
      <Box args={[size[0] * 0.8, 0.005, 0.001]} position={[size[0] * 0.1, size[1] * 0.3, -0.03]}>
        <meshBasicMaterial color="#fff" transparent opacity={0.04} />
      </Box>
      <pointLight position={[0, 0, -0.5]} intensity={0.3} color="#4488ff" distance={2} />
    </group>
  );
}

/* ---------- Water dispenser ---------- */
function WaterDispenser() {
  return (
    <group position={[-10.5, 0, 6]}>
      <Cylinder args={[0.15, 0.2, 0.8]}>
        <meshStandardMaterial color="#ddd" roughness={0.3} metalness={0.6} />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.05]} position={[0, 0.42, 0]}>
        <meshStandardMaterial color="#4488ff" transparent opacity={0.6} />
      </Cylinder>
      <Box args={[0.08, 0.02, 0.1]} position={[0, 0.35, 0.12]}>
        <meshStandardMaterial color="#888" />
      </Box>
      {/* Water bottles on top */}
      <Cylinder args={[0.08, 0.06, 0.25]} position={[-0.08, 0.55, 0.06]}>
        <meshStandardMaterial color="#4488ff" transparent opacity={0.3} />
      </Cylinder>
    </group>
  );
}

/* ---------- Desk (operations computer) ---------- */
function Desk({ deskRef }) {
  const ref = useRef();
  useEffect(() => { if (deskRef) deskRef.current = ref.current; }, [deskRef]);
  return (
    <group ref={ref} position={[-8, 0, 7]}>
      {/* Desk surface */}
      <Box args={[2.2, 0.06, 1.4]} position={[0, 0.78, 0]}>
        <meshStandardMaterial color="#1a0f08" roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[2.22, 0.01, 1.42]} position={[0, 0.81, 0]}>
        <meshStandardMaterial color="#2a1a12" roughness={0.95} transparent opacity={0.3} />
      </Box>
      {/* Desk legs */}
      {[[-1.0, 0.38, -0.6], [1.0, 0.38, -0.6], [-1.0, 0.38, 0.6], [1.0, 0.38, 0.6]].map((p, i) => (
        <Cylinder key={i} args={[0.025, 0.035, 0.76]} position={p}>
          <meshStandardMaterial color="#555" metalness={0.7} roughness={0.2} />
        </Cylinder>
      ))}
      {/* Cable tray under desk */}
      <Box args={[1.6, 0.04, 0.2]} position={[0.2, 0.72, 0.5]}>
        <meshStandardMaterial color="#222" roughness={0.9} />
      </Box>
      {/* PC Tower */}
      <group position={[0.95, 0.78, 0.15]}>
        <Box args={[0.3, 0.55, 0.5]}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[0.01, 0.45, 0.4]} position={[0.16, 0, 0]}>
          <meshStandardMaterial color="#1a2a3a" transparent opacity={0.4} roughness={0.1} metalness={0.9} />
        </Box>
        <Box args={[0.04, 0.08, 0.2]} position={[0.16, 0.05, 0.05]}>
          <meshBasicMaterial color="#222" />
        </Box>
        <Box args={[0.04, 0.02, 0.08]} position={[0.16, 0.09, 0.05]}>
          <meshBasicMaterial color="#ff3344" />
        </Box>
        {Array.from({ length: 2 }, (_, j) => (
          <Box key={j} args={[0.04, 0.04, 0.005]} position={[0.16, 0.12, -0.08 + j * 0.015]}>
            <meshBasicMaterial color="#44ff88" transparent opacity={0.6} />
          </Box>
        ))}
        <Box args={[0.04, 0.005, 0.04]} position={[0.16, -0.12, -0.12]}>
          <meshBasicMaterial color="#4488ff" />
        </Box>
        <Box args={[0.04, 0.04, 0.04]} position={[0.16, -0.08, 0.12]}>
          <meshBasicMaterial color="#333" />
        </Box>
        <Box args={[0.01, 0.42, 0.48]} position={[0, 0, -0.26]}>
          <meshStandardMaterial color="#222" />
        </Box>
        <Sphere args={[0.015, 8, 8]} position={[0, 0.2, -0.26]}>
          <meshBasicMaterial color="#00ff88" />
        </Sphere>
        {Array.from({ length: 2 }, (_, j) => (
          <Box key={j} args={[0.01, 0.005, 0.01]} position={[0.04 + j * 0.04, 0.18, -0.26]}>
            <meshBasicMaterial color="#555" />
          </Box>
        ))}
        <Box args={[0.25, 0.005, 0.4]} position={[0, 0.28, 0]} style={{ opacity: 0.3 }}>
          <meshStandardMaterial color="#333" />
        </Box>
        <Box args={[0.2, 0.003, 0.02]} position={[0, -0.27, 0.15]}>
          <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
        </Box>
        <pointLight position={[0, -0.27, 0.15]} intensity={0.05} color="#00ff88" distance={0.5} />
        {/* PC fan spinning */}
        <Fan position={[0.16, -0.08, 0.12]} size={0.035} speed={5} />
      </group>
      {/* Monitor */}
      <group position={[0, 1.15, -0.15]} userData={{ type: 'monitor' }}>
        <Box args={[0.3, 0.02, 0.25]} position={[0, -0.3, 0]}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
        </Box>
        <Box args={[0.3, 0.35, 0.04]} position={[0, -0.17, 0]}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
        </Box>
        <Cylinder args={[0.02, 0.03, 0.6]} position={[0, 0.15, 0]}>
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
        </Cylinder>
        <Box args={[1.5, 0.85, 0.04]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#0a0a0a" />
        </Box>
        <Box args={[1.36, 0.73, 0.02]} position={[0, 0.5, -0.025]}>
          <meshStandardMaterial color="#0a0a2a" emissive="#4488ff" emissiveIntensity={0.2} />
        </Box>
        <Box args={[1.2, 0.01, 0.001]} position={[0.1, 0.65, -0.03]}>
          <meshBasicMaterial color="#fff" transparent opacity={0.05} />
        </Box>
        <pointLight position={[0, 0.5, -0.5]} intensity={0.6} color="#4488ff" distance={2.5} />
        <Sphere args={[0.015, 8, 8]} position={[0, 0.9, 0.02]}>
          <meshBasicMaterial color="#222" />
        </Sphere>
        <mesh position={[0.02, 0.88, 0.025]}>
          <sphereGeometry args={[0.003, 6, 6]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>
      </group>
      {/* Monitor cable */}
      <Cylinder args={[0.004, 0.004, 0.5]} position={[0.5, 0.85, -0.1]} rotation={[0, 0.3, 0.2]}>
        <meshStandardMaterial color="#333" />
      </Cylinder>
      {/* Keyboard */}
      <group position={[0, 0.82, 0.35]}>
        <Box args={[0.85, 0.02, 0.3]}>
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </Box>
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: row === 0 ? 8 : row === 4 ? 6 : 12 }, (_, key) => (
            <Box key={`${row}-${key}`} args={[0.035, 0.008, 0.035]} position={[-0.35 + key * (row === 0 ? 0.08 : row === 4 ? 0.12 : 0.06), 0.015, -0.12 + row * 0.06]}>
              <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
            </Box>
          ))
        )}
        <Cylinder args={[0.003, 0.003, 0.3]} position={[-0.4, 0.01, 0.18]} rotation={[0.5, 0, 0.2]}>
          <meshStandardMaterial color="#333" />
        </Cylinder>
      </group>
      {/* Mouse */}
      <group position={[0.3, 0.8, 0.45]}>
        <Sphere args={[0.03, 8, 8]}>
          <meshStandardMaterial color="#222" roughness={0.6} />
        </Sphere>
        <Box args={[0.01, 0.005, 0.02]} position={[0, 0.035, 0]}>
          <meshBasicMaterial color="#555" />
        </Box>
        <Cylinder args={[0.002, 0.002, 0.2]} position={[0.04, 0, 0.1]} rotation={[0.5, 0.5, 0]}>
          <meshStandardMaterial color="#333" />
        </Cylinder>
      </group>
      {/* Under-desk cables */}
      {Array.from({ length: 5 }, (_, i) => (
        <Cylinder key={i} args={[0.004, 0.005, 0.6]} position={[0.5 + i * 0.08, 0.65, 0.3]} rotation={[0.1, 0, 0.1 * i]}>
          <meshStandardMaterial color={['#4488ff', '#222', '#ff4444', '#44ff88', '#ffaa00'][i]} />
        </Cylinder>
      ))}
      {/* Phone */}
      <Box args={[0.06, 0.005, 0.1]} position={[-0.85, 0.81, 0.3]}>
        <meshStandardMaterial color="#0a0a0a" />
      </Box>
      <Box args={[0.055, 0.002, 0.09]} position={[-0.85, 0.813, 0.3]}>
        <meshBasicMaterial color="#1a2a4a" emissive="#2244aa" emissiveIntensity={0.1} />
      </Box>
      {/* Coffee cup */}
      <Cylinder args={[0.025, 0.02, 0.06]} position={[-0.9, 0.81, -0.3]}>
        <meshStandardMaterial color="#333" />
      </Cylinder>
      {/* Pen holder */}
      <Cylinder args={[0.02, 0.025, 0.05]} position={[0.8, 0.81, -0.4]}>
        <meshStandardMaterial color="#444" />
      </Cylinder>
    </group>
  );
}

/* ---------- Room structure ---------- */
function RaisedFloor() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 856;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(512, 428, 100, 512, 428, 600);
    grad.addColorStop(0, '#252544'); grad.addColorStop(1, '#181830');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 856);
    const tw = 1024 / 24, th = 856 / 20;
    for (let x = 0; x <= 24; x++) {
      ctx.strokeStyle = '#303058'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x * tw, 0); ctx.lineTo(x * tw, 856); ctx.stroke();
    }
    for (let y = 0; y <= 20; y++) {
      ctx.strokeStyle = '#303058'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y * th); ctx.lineTo(1024, y * th); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} roughness={0.4} metalness={0.3} envMapIntensity={0.4} />
    </mesh>
  );
}

function Wall({ position, size, color = '#d4d4d8' }) {
  return (
    <Box args={size} position={position}>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.0} />
    </Box>
  );
}

function Ceiling() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 856;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(512, 428, 50, 512, 428, 600);
    grad.addColorStop(0, '#f0f0f4'); grad.addColorStop(1, '#d8d8dc');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 856);
    const tw = 1024 / 24, th = 856 / 20;
    for (let x = 0; x <= 24; x++) {
      ctx.strokeStyle = '#c8c8cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x * tw, 0); ctx.lineTo(x * tw, 856); ctx.stroke();
    }
    for (let y = 0; y <= 20; y++) {
      ctx.strokeStyle = '#c8c8cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y * th); ctx.lineTo(856, y * th); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CEILING_Y - 0.015, 0]}>
      <planeGeometry args={[ROOM_W, ROOM_D]} />
      <meshStandardMaterial map={tex} roughness={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CeilingLights() {
  const positions = [];
  for (let x = -8; x <= 8; x += 4) {
    for (let z = -7; z <= 7; z += 4) {
      positions.push([x, CEILING_Y - 0.04, z]);
    }
  }
  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <Box args={[1.2, 0.015, 0.15]}>
            <meshStandardMaterial color="#ffeee0" emissive="#ffeee0" emissiveIntensity={0.8} />
          </Box>
          <Box args={[1.25, 0.02, 0.2]} position={[0, 0.01, 0]}>
            <meshStandardMaterial color="#ccc" />
          </Box>
        </group>
      ))}
    </group>
  );
}

function Room() {
  return (
    <group>
      <RaisedFloor />
      <Wall position={[0, 1.75, -(ROOM_D / 2 + WALL_OFFSET)]} size={[ROOM_W, 3.5, 0.1]} />
      <Wall position={[0, 1.75, ROOM_D / 2 + WALL_OFFSET]} size={[ROOM_W, 3.5, 0.1]} />
      <Wall position={[-(ROOM_W / 2 + WALL_OFFSET), 1.75, 0]} size={[0.1, 3.5, ROOM_D]} />
      <Wall position={[ROOM_W / 2 + WALL_OFFSET, 1.75, 0]} size={[0.1, 3.5, ROOM_D]} />
      <Ceiling />
      <CeilingLights />
    </group>
  );
}

function ServerRacks({ logo, databases }) {
  const dbList = useMemo(() => databases || [], [databases]);
  const rows = [
    { x: -4, len: 16 },
    { x: 1, len: 16 },
    { x: 6, len: 16 },
  ];
  return (
    <group>
      {rows.map((row, i) => (
        <group key={i} position={[row.x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ServerRackRow
            position={[0, 0, 0]}
            length={row.len}
            height={3.2}
            serversPerUnit={5}
            units={6}
            logo={logo}
            dbInfo={dbList[i] || { compliant: true }}
            rowIndex={i}
          />
        </group>
      ))}
    </group>
  );
}

/* ---------- First Person Arms ---------- */
function FirstPersonArms({ moveState, isSitting, isTyping }) {
  const leftShoulder = useRef();
  const rightShoulder = useRef();
  const leftElbow = useRef();
  const rightElbow = useRef();
  const leftHand = useRef();
  const rightHand = useRef();
  const leftFingers = useRef([]);
  const rightFingers = useRef([]);
  const walkPhase = useRef(0);
  const typingPhase = useRef(0);

  useFrame((state, delta) => {
    const walking = moveState.current.isMoving;
    const speed = moveState.current.speed;
    if (walking && speed > 0.01) {
      walkPhase.current += delta * speed * 1.8;
    } else if (!isSitting) {
      walkPhase.current += delta * 0.05;
    }
    if (isSitting) {
      typingPhase.current += delta * (isTyping ? 6 : 1.5);
    }

    const swing = walking && speed > 0.01 ? Math.sin(walkPhase.current) * 0.55 * Math.min(speed / 3, 1) : 0;
    const idleSwing = Math.sin(walkPhase.current * 0.3) * 0.01;
    const shoulderX = isSitting ? -0.5 : -0.15 + idleSwing;
    const shoulderRoll = isSitting ? 0.4 : 0;

    if (leftShoulder.current) {
      leftShoulder.current.rotation.x = shoulderX + swing;
      leftShoulder.current.rotation.z = shoulderRoll;
    }
    if (rightShoulder.current) {
      rightShoulder.current.rotation.x = shoulderX - swing;
      rightShoulder.current.rotation.z = -shoulderRoll;
    }
    if (leftElbow.current) {
      leftElbow.current.rotation.x = isSitting ? 1.1 : 0.5 - swing * 0.3;
    }
    if (rightElbow.current) {
      rightElbow.current.rotation.x = isSitting ? 1.1 : 0.5 + swing * 0.3;
    }
    if (leftHand.current) {
      leftHand.current.position.y = isSitting ? -0.16 : -0.22;
      leftHand.current.position.z = isSitting ? 0.08 : 0.02;
      leftHand.current.rotation.x = isSitting ? 0.15 : 0;
    }
    if (rightHand.current) {
      rightHand.current.position.y = isSitting ? -0.16 : -0.22;
      rightHand.current.position.z = isSitting ? 0.08 : 0.02;
      rightHand.current.rotation.x = isSitting ? 0.15 : 0;
    }
    // Finger typing animation
    if (isSitting && isTyping) {
      leftFingers.current.forEach((finger, fi) => {
        if (finger) finger.rotation.x = Math.sin(typingPhase.current + fi * 1.5) * 0.2 + 0.1;
      });
      rightFingers.current.forEach((finger, fi) => {
        if (finger) finger.rotation.x = Math.sin(typingPhase.current + 1 + fi * 1.3) * 0.2 + 0.1;
      });
    } else if (isSitting) {
      leftFingers.current.forEach(f => { if (f) f.rotation.x = 0; });
      rightFingers.current.forEach(f => { if (f) f.rotation.x = 0; });
    }
  });

  const skin = '#d4a574';
  const shirt = '#1a2a3a';

  function Finger({ pos, len = 0.025, refIdx }) {
    return (
      <group ref={el => { if (refIdx !== undefined) { if (refIdx < 5) leftFingers.current[refIdx] = el; else rightFingers.current[refIdx - 5] = el; } }} position={pos}>
        <Box args={[0.006, 0.005, len]}>
          <meshStandardMaterial color={skin} roughness={0.7} />
        </Box>
      </group>
    );
  }

  function Hand({ isLeft, startRefIdx = 0 }) {
    const dir = isLeft ? -1 : 1;
    return (
      <group>
        <Box args={[0.055, 0.065, 0.045]}>
          <meshStandardMaterial color={skin} roughness={0.7} />
        </Box>
        <Finger pos={[dir * 0.03, 0.025, 0.015]} len={0.025} refIdx={startRefIdx} />
        <Finger pos={[-0.015 * dir, 0.035, 0.025]} len={0.04} refIdx={startRefIdx + 1} />
        <Finger pos={[0, 0.035, 0.03]} len={0.045} refIdx={startRefIdx + 2} />
        <Finger pos={[0.015 * dir, 0.035, 0.025]} len={0.04} refIdx={startRefIdx + 3} />
        <Finger pos={[0.025 * dir, 0.025, 0.02]} len={0.03} refIdx={startRefIdx + 4} />
      </group>
    );
  }

  return (
    <group>
      <group ref={leftShoulder} position={[-0.35, -0.25, -0.15]}>
        <Box args={[0.09, 0.3, 0.09]} position={[0, -0.15, 0]}>
          <meshStandardMaterial color={shirt} roughness={0.9} />
        </Box>
        <group ref={leftElbow} position={[0, -0.3, 0]}>
          <Box args={[0.07, 0.26, 0.07]} position={[0, -0.13, 0.01]}>
            <meshStandardMaterial color={skin} roughness={0.7} />
          </Box>
          <group ref={leftHand} position={[0, -0.24, 0.03]}>
            <Hand isLeft={true} startRefIdx={0} />
          </group>
        </group>
      </group>
      <group ref={rightShoulder} position={[0.35, -0.25, -0.15]}>
        <Box args={[0.09, 0.3, 0.09]} position={[0, -0.15, 0]}>
          <meshStandardMaterial color={shirt} roughness={0.9} />
        </Box>
        <group ref={rightElbow} position={[0, -0.3, 0]}>
          <Box args={[0.07, 0.26, 0.07]} position={[0, -0.13, 0.01]}>
            <meshStandardMaterial color={skin} roughness={0.7} />
          </Box>
          <group ref={rightHand} position={[0, -0.24, 0.03]}>
            <Hand isLeft={false} startRefIdx={5} />
          </group>
        </group>
      </group>
      <Box args={[0.38, 0.28, 0.15]} position={[0, -0.48, -0.25]}>
        <meshStandardMaterial color={shirt} roughness={0.9} />
      </Box>
    </group>
  );
}

/* ---------- First Person Controller ---------- */
function FirstPersonController({ setLookAtType, setLookAtData, onUse, isLocked, onLockChange, isUsingComputer }) {
  const { camera, gl } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const eWasPressed = useRef(false);
  const moveState = useRef({ isMoving: false, speed: 0 });
  const sitRef = useRef(false);

  const DESK_SIT = [-8, 1.0, 5.7];
  const STAND = [0, 1.6, -9];

  useEffect(() => {
    const down = (e) => {
      switch (e.code) {
        case 'KeyW': case 'KeyX': keys.current.w = true; break;
        case 'KeyA': case 'KeyQ': keys.current.a = true; break;
        case 'KeyS': case 'KeyZ': keys.current.s = true; break;
        case 'KeyD': case 'KeyE': keys.current.d = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.shift = true; break;
      }
      if (e.code === 'KeyE' && !eWasPressed.current) { eWasPressed.current = true; onUse(); }
    };
    const up = (e) => {
      switch (e.code) {
        case 'KeyW': case 'KeyX': keys.current.w = false; break;
        case 'KeyA': case 'KeyQ': keys.current.a = false; break;
        case 'KeyS': case 'KeyZ': keys.current.s = false; break;
        case 'KeyD': case 'KeyE': keys.current.d = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.shift = false; break;
      }
      if (e.code === 'KeyE') eWasPressed.current = false;
    };
    const handleClick = (e) => {
      if (e.button === 0 && !eWasPressed.current) { eWasPressed.current = true; onUse(); }
    };
    const resetClick = () => { eWasPressed.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('mouseup', resetClick);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('mouseup', resetClick);
    };
  }, [onUse]);

  // Fijar orden de rotación YXZ al montar (antes de cualquier rotación)
  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      onLockChange(locked);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [gl, onLockChange]);

  useEffect(() => {
    if (!isLocked) return;
    camera.rotation.set(0, 0, 0);
    let skipFirst = true;
    const handleMouseMove = (e) => {
      if (skipFirst) { skipFirst = false; return; }
      const sens = 0.002;
      camera.rotation.y -= e.movementX * sens;
      camera.rotation.x -= e.movementY * sens;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isLocked, camera]);

  useFrame((state, delta) => {
    if (!isLocked) {
      moveState.current.isMoving = false;
      moveState.current.speed = 0;
      return;
    }

    if (isUsingComputer && !sitRef.current) {
      camera.position.set(DESK_SIT[0], DESK_SIT[1], DESK_SIT[2]);
      sitRef.current = true;
    } else if (!isUsingComputer && sitRef.current) {
      camera.position.set(STAND[0], STAND[1], STAND[2]);
      sitRef.current = false;
    }
    if (isUsingComputer) {
      moveState.current.isMoving = false;
      moveState.current.speed = 0;
      return;
    }

    const speed = keys.current.shift ? 6 : 3;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; right.normalize();
    let dx = 0, dz = 0;
    if (keys.current.w) { dx += forward.x; dz += forward.z; }
    if (keys.current.s) { dx -= forward.x; dz -= forward.z; }
    if (keys.current.a) { dx -= right.x; dz -= right.z; }
    if (keys.current.d) { dx += right.x; dz += right.z; }
    const len = Math.sqrt(dx * dx + dz * dz);
    moveState.current.isMoving = len > 0.01;
    moveState.current.speed = moveState.current.isMoving ? speed * len : 0;
    if (len > 0) {
      const normX = (dx / len) * speed * delta;
      const normZ = (dz / len) * speed * delta;
      let newX = camera.position.x + normX;
      let newZ = camera.position.z + normZ;
      newX = Math.max(-ROOM_W / 2 + 0.5, Math.min(ROOM_W / 2 - 0.5, newX));
      newZ = Math.max(-ROOM_D / 2 + 0.5, Math.min(ROOM_D / 2 - 0.5, newZ));
      if (!checkCollision(newX, camera.position.z)) camera.position.x = newX;
      if (!checkCollision(camera.position.x, newZ)) camera.position.z = newZ;
      camera.position.y = 1.6;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const scene = camera.parent?.parent;
    if (!scene) return;
    const meshes = [];
    scene.traverse(child => { if (child.isMesh && child.userData?.type) meshes.push(child); });
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0 && hits[0].distance < 4) {
      const obj = hits[0].object;
      if (obj.userData?.type === 'server') {
        setLookAtType('server');
        setLookAtData({ dbName: obj.userData.dbName });
      } else if (['monitor', 'desk', 'keyboard'].includes(obj.userData?.type)) {
        setLookAtType('desk');
        setLookAtData({});
      } else {
        setLookAtType(null); setLookAtData(null);
      }
    } else {
      setLookAtType(null); setLookAtData(null);
    }
  });

  return (
    <>
      {isLocked && (
        <FirstPersonArms
          moveState={moveState}
          isSitting={isUsingComputer}
          isTyping={isUsingComputer}
        />
      )}
    </>
  );
}

/* ---------- Scene ---------- */
function Scene({ logo, setLookAtType, setLookAtData, onUse, isLocked, onLockChange, databases, isUsingComputer, setIsUsingComputer }) {
  return (
    <>
      <color attach="background" args={['#0a0a14']} />
      <fog attach="fog" args={['#0a0a14', 12, 25]} />
      <Room />
      <StructuredCabling />
      <ServerRacks logo={logo} databases={databases} />
      <Desk />
      <Sofa position={[9, 0, 6]} />
      <Sofa position={[9, 0, 3]} />
      <Sofa position={[9, 0, 0]} />
      <Sofa position={[5, 0, -9]} rotation={[0, Math.PI / 2, 0]} />
      <Sofa position={[2, 0, -9]} rotation={[0, Math.PI / 2, 0]} />
      <NetworkingRack />
      <WallScreen position={[ROOM_W / 2 - 0.1, 2.5, -3]} size={[1.6, 1.0]} />
      <WallScreen position={[ROOM_W / 2 - 0.1, 2.5, 1]} size={[1.6, 1.0]} />
      <WallScreen position={[ROOM_W / 2 - 0.1, 2.5, 5]} size={[1.6, 1.0]} />
      <WaterDispenser />
      <FirstPersonController setLookAtType={setLookAtType} setLookAtData={setLookAtData} onUse={onUse} isLocked={isLocked} onLockChange={onLockChange} isUsingComputer={isUsingComputer} setIsUsingComputer={setIsUsingComputer} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[0, 10, -5]} intensity={0.15} />
      <spotLight position={[-8, 6, 7]} angle={0.5} penumbra={0.4} intensity={0.5} color="#ffeee0" distance={14} castShadow={false} />
      <spotLight position={[8, 6, -5]} angle={0.5} penumbra={0.4} intensity={0.4} color="#ffeee0" distance={14} castShadow={false} />
      <spotLight position={[0, 6, 0]} angle={0.7} penumbra={0.4} intensity={0.3} color="#ffeee0" distance={18} castShadow={false} />
      <Environment preset="warehouse" environmentIntensity={0.5} />
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={[ROOM_W, ROOM_D]} blur={2} far={5} />
    </>
  );
}

/* ---------- Report View ---------- */
function ReportView({ databases, onBack }) {
  const dbList = databases || [];
  const compliant = dbList.filter(d => d.compliant !== false).length;
  const total = dbList.length;
  const avgScore = total > 0 ? Math.round(dbList.reduce((s, d) => s + (d.complianceScore || 0), 0) / total) : 0;
  const totalRecords = dbList.reduce((s, d) => s + (d.recordsCount || 0), 0);
  const totalTables = dbList.reduce((s, d) => s + (d.tablesCount || 0), 0);

  return (
    <div className="flex-1 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text-heading">Informe de Ciberseguridad</h3>
              <p className="text-[10px] text-text-muted">{new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })} · SecureLab</p>
            </div>
          </div>
          <button onClick={onBack} className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-border-theme/40 text-text-muted hover:text-text-heading hover:border-surface-600 transition-all">Volver</button>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <div className="bg-bg-elevated/50 border border-border-theme/20 rounded-lg p-3 text-center">
            <p className="text-[22px] font-bold text-text-heading">{total}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">Servidores</p>
          </div>
          <div className="bg-bg-elevated/50 border border-border-theme/20 rounded-lg p-3 text-center">
            <p className="text-[22px] font-bold text-emerald-400">{compliant}/{total}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">Operativos</p>
          </div>
          <div className="bg-bg-elevated/50 border border-border-theme/20 rounded-lg p-3 text-center">
            <p className="text-[22px] font-bold text-text-heading">{avgScore}%</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">Cumplimiento</p>
          </div>
          <div className="bg-bg-elevated/50 border border-border-theme/20 rounded-lg p-3 text-center">
            <p className="text-[22px] font-bold text-text-heading">{totalRecords.toLocaleString()}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">Registros</p>
          </div>
        </div>
        <div className="bg-bg-elevated/40 border border-border-theme/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-text-heading">Estado General del Centro de Datos</h4>
            <span className={`text-[11px] font-bold ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {avgScore >= 80 ? 'Óptimo' : avgScore >= 60 ? 'Atención' : 'Crítico'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-bg-elevated/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${avgScore >= 80 ? 'bg-emerald-400' : avgScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${avgScore}%` }} />
          </div>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-white mb-2">Detalle de Servidores</h4>
          {dbList.map((db, i) => (
            <div key={i} className="bg-bg-elevated/30 border border-border-theme/15 rounded-lg px-3.5 py-2.5 flex items-center justify-between hover:bg-bg-elevated/50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 rounded-full ${db.compliant !== false ? 'bg-emerald-400' : 'bg-red-400'} shadow-sm`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-white truncate">{db.dbName || `Servidor ${i + 1}`}</p>
                  <p className="text-[9px] text-text-muted">{db.engine || 'MySQL'} · {db.tablesCount || 0} tablas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  {db.encryption ? <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Cifrado</span> : <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Sin cifrar</span>}
                  {db.sslEnabled ? <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">SSL</span> : <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">No SSL</span>}
                </div>
                <span className={`text-[12px] font-bold tabular-nums ${db.compliant !== false ? 'text-emerald-400' : 'text-red-400'}`}>{db.complianceScore || 0}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-bg-elevated/40 border border-border-theme/20 rounded-lg p-4">
          <h4 className="text-[11px] font-semibold text-white mb-2">Controles de Seguridad</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Cifrado de Datos', ok: dbList.filter(d => d.encryption).length, total: total },
              { label: 'SSL/TLS Activado', ok: dbList.filter(d => d.sslEnabled).length, total: total },
              { label: 'Control de Acceso', ok: dbList.filter(d => d.accessControl).length, total: total },
              { label: 'Auditoría', ok: dbList.filter(d => d.auditLogging).length, total: total },
            ].map((ctrl, i) => {
              const pct = total > 0 ? Math.round((ctrl.ok / total) * 100) : 0;
              return (
                <div key={i} className="bg-bg-panel/40 border border-border-theme/15 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-text-muted">{ctrl.label}</span>
                    <span className="text-[11px] font-bold text-text-heading">{ctrl.ok}/{ctrl.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-elevated/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3.5 flex items-start gap-3">
          <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-[11px] font-medium text-emerald-400">Centro de Datos SecureLab Operativo</p>
            <p className="text-[10px] text-text-muted mt-0.5">{totalTables} tablas monitoreadas en {total} servidores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Export ---------- */
export default function Database3DMap({ databases = [] }) {
  const [mounted, setMounted] = useState(false);
  const [logoTex, setLogoTex] = useState(null);
  const [lookAtType, setLookAtType] = useState(null);
  const [lookAtData, setLookAtData] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isUsingComputer, setIsUsingComputer] = useState(false);
  const [computerMode, setComputerMode] = useState('desktop');

  useEffect(() => {
    setMounted(true);
    const loader = new THREE.TextureLoader();
    loader.load('/logo-nuevo.png', (tex) => setLogoTex(tex));
  }, []);

  const handleUse = useCallback(() => {
    if (lookAtType === 'desk' && !isUsingComputer) {
      setIsUsingComputer(true);
      setComputerMode('desktop');
    }
  }, [lookAtType, isUsingComputer]);

  const handleCloseComputer = useCallback(() => {
    setIsUsingComputer(false);
    setComputerMode('desktop');
  }, []);

  const handleLockChange = useCallback((locked) => {
    setIsLocked(locked);
    if (!locked) setIsUsingComputer(false);
  }, []);

  const handleEnter = useCallback(() => {
    const tryLock = (n = 0) => {
      const c = document.querySelector('canvas');
      if (!c) return;
      try { c.requestPointerLock(); }
      catch { if (n < 3) setTimeout(() => tryLock(n + 1), 500); }
    };
    tryLock();
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-full bg-bg-base"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div id="canvas-container" className="w-full h-full relative bg-black overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.6, -9], fov: 70 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        shadows="contact"
      >
        <Scene
          logo={logoTex}
          setLookAtType={setLookAtType}
          setLookAtData={setLookAtData}
          onUse={handleUse}
          isLocked={isLocked}
          onLockChange={handleLockChange}
          databases={databases}
          isUsingComputer={isUsingComputer}
          setIsUsingComputer={setIsUsingComputer}
        />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3.5 py-2">
          <h2 className="text-[11px] font-semibold text-white/90 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
            DATACENTER SECURELAB
          </h2>
          <p className="text-[9px] text-text-muted mt-0.5">Click para bloquear · WASD mover · Shift correr · Click para interactuar</p>
        </div>
      </div>

      {!isUsingComputer && !isLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
          <button onClick={handleEnter}
            className="px-5 py-2.5 text-[11px] font-medium rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all backdrop-blur-sm flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Entrar al Data Center
          </button>
        </div>
      )}

      {isLocked && !isUsingComputer && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
            <div className={`w-5 h-5 relative transition-all ${lookAtType ? 'scale-125' : ''}`}>
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 transition-colors ${lookAtType ? 'bg-emerald-400' : 'bg-bg-panel0'}`} />
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 transition-colors ${lookAtType ? 'bg-emerald-400' : 'bg-bg-panel0'}`} />
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px transition-colors ${lookAtType ? 'bg-emerald-400' : 'bg-bg-panel0'}`} />
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px transition-colors ${lookAtType ? 'bg-emerald-400' : 'bg-bg-panel0'}`} />
              {lookAtType && <div className="absolute inset-0 rounded-full border border-emerald-400/50 animate-ping" />}
            </div>
          </div>
          {lookAtType === 'server' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
              <div className="bg-black/70 backdrop-blur-sm border border-emerald-500/20 rounded-lg px-3.5 py-2 text-center">
                <p className="text-[11px] text-emerald-400 font-medium">{lookAtData?.dbName || 'Servidor SecureLab'}</p>
                <p className="text-[9px] text-text-muted">Estado: <span className="text-emerald-400">Operativo</span></p>
              </div>
            </div>
          )}
          {lookAtType === 'desk' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
              <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-center">
                <p className="text-[11px] text-white font-medium">Presiona <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">E</span> para usar el ordenador</p>
              </div>
            </div>
          )}
        </>
      )}

      {isUsingComputer && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="w-[92%] h-[88%] max-w-5xl max-h-[720px] bg-bg-panel rounded-xl border border-border-theme/50 overflow-hidden shadow-2xl shadow-black/50 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-elevated border-b border-border-theme/50 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <button onClick={handleCloseComputer} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[11px] text-text-muted font-medium">SecureLab - Centro de Operaciones</span>
              </div>
              <button onClick={handleCloseComputer} className="p-1 rounded text-text-muted hover:text-text-heading hover:bg-bg-elevated transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {computerMode === 'desktop' && (
              <div className="flex-1 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-6">
                <div className="flex flex-col items-center justify-center h-full gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h2 className="text-[18px] font-bold text-text-heading">Escritorio de Operaciones</h2>
                  <p className="text-[12px] text-text-muted text-center max-w-md">Centro de gestión y monitoreo de ciberseguridad</p>
                  <div className="flex gap-4 mt-2">
                    <button onClick={() => setComputerMode('browser')}
                      className="flex flex-col items-center gap-2.5 px-7 py-5 bg-bg-elevated/60 border border-border-theme/30 rounded-xl hover:bg-bg-elevated hover:border-emerald-500/30 transition-all group w-[130px]">
                      <svg className="w-8 h-8 text-text-muted group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      <span className="text-[10px] text-text-muted group-hover:text-text-heading font-medium">Navegador</span>
                    </button>
                    <button onClick={() => setComputerMode('report')}
                      className="flex flex-col items-center gap-2.5 px-7 py-5 bg-bg-elevated/60 border border-border-theme/30 rounded-xl hover:bg-bg-elevated hover:border-emerald-500/30 transition-all group w-[130px]">
                      <svg className="w-8 h-8 text-text-muted group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-[10px] text-text-muted group-hover:text-text-heading font-medium">Informes</span>
                    </button>
                    <button onClick={() => setComputerMode('report')}
                      className="flex flex-col items-center gap-2.5 px-7 py-5 bg-bg-elevated/60 border border-border-theme/30 rounded-xl hover:bg-bg-elevated hover:border-emerald-500/30 transition-all group w-[130px]">
                      <svg className="w-8 h-8 text-text-muted group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                      <span className="text-[10px] text-text-muted group-hover:text-text-heading font-medium">Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {computerMode === 'browser' && (
              <div className="flex-1 bg-white">
                <iframe src="https://securelab.cl" className="w-full h-full border-0" title="SecureLab" sandbox="allow-scripts allow-same-origin allow-forms" />
              </div>
            )}
            {computerMode === 'report' && <ReportView databases={databases} onBack={() => setComputerMode('desktop')} />}
          </div>
        </div>
      )}
    </div>
  );
}
