import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import InfoTooltip from '../components/InfoTooltip';


function DBMap3D({ databases }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);
  const [selectedDB, setSelectedDB] = useState(null);
  const dragRef = useRef({ active: false, startX: 0, startAngle: 0 });
  const zoomRef = useRef(1);
  const hoveredTableRef = useRef(null);

  const handleWheel = useCallback((e) => {
    zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current - e.deltaY * 0.001));
  }, []);

  const handleMouseDown = useCallback((e) => {
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startAngle = angleRef.current;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    angleRef.current = dragRef.current.startAngle + dx * 0.005;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;

    const dbCount = databases.length;
    const cols = Math.ceil(Math.sqrt(dbCount));
    const spacing = Math.min(W, H) / (cols + 1.5);
    const startX = (W - (cols - 1) * spacing) / 2;
    const startY = H * 0.3;

    function isInside3D(cx, cy, bw, bh, mx, my, angle, scale) {
      const dx = mx - cx;
      const dy = my - cy;
      const hw = (bw / 2) * scale;
      const hh = (bh / 2) * scale * 0.7;
      return Math.abs(dx) < hw + 8 && Math.abs(dy) < hh + 8;
    }

    function handleClick(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * 2;
      const my = (e.clientY - rect.top) * 2;

      if (selectedDB) {
        const tables = selectedDB.tables || [];
        const tCols = Math.ceil(Math.sqrt(tables.length));
        const tSpacing = Math.min(W, H) / (tCols + 2);
        const tStartX = (W - (tCols - 1) * tSpacing) / 2;
        const tStartY = H * 0.3;
        const angle = angleRef.current;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        for (let i = 0; i < tables.length; i++) {
          const col = i % tCols;
          const row = Math.floor(i / tCols);
          const cx = tStartX + col * tSpacing;
          const cy = tStartY + row * tSpacing * 0.8;
          const bw = tSpacing * 0.35;
          const bh = tSpacing * 0.2;
          const zr = 0;
          const scale = 400 / (400 + zr);
          const sx = cx + 0 * scale;
          const sy = cy + 0 * scale * 0.7;
          if (isInside3D(sx, sy, bw, bh, mx, my, angle, scale)) {
            hoveredTableRef.current = i;
            return;
          }
        }
        setSelectedDB(null);
        return;
      }

      for (let i = 0; i < databases.length; i++) {
        const db = databases[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = startX + col * spacing;
        const cy = startY + row * spacing * 0.8;
        const bw = spacing * 0.3;
        const bh = spacing * 0.25;
        const angle = angleRef.current;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const pts = [
          [-bw/2, -bh/2, -20], [bw/2, -bh/2, -20],
          [bw/2, bh/2, -20], [-bw/2, bh/2, -20],
        ];
        const projected = pts.map(([x, y, z]) => {
          const xr = x * cosA - z * sinA;
          const zr = x * sinA + z * cosA;
          const scale = 400 / (400 + zr);
          return { x: cx + xr * scale, y: cy + y * scale * 0.7 };
        });
        const avgX = projected.reduce((s, p) => s + p.x, 0) / 4;
        const avgY = projected.reduce((s, p) => s + p.y, 0) / 4;
        if (isInside3D(avgX, avgY, bw, bh, mx, my, 0, 1)) {
          setSelectedDB(db);
          return;
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const angle = angleRef.current;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const zoom = zoomRef.current;

      if (selectedDB) {
        const tables = selectedDB.tables || [];
        const tCols = Math.ceil(Math.sqrt(tables.length));
        const tSpacing = Math.min(W, H) / (tCols + 2) * zoom;
        const tStartX = (W - (tCols - 1) * tSpacing) / 2;
        const tStartY = H * 0.3;
        const depth = 25;

        ctx.save();
        ctx.translate(W/2, H/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-W/2, -H/2);

        // DB label
        ctx.fillStyle = '#e5e7eb';
        ctx.font = `bold ${Math.round(14 * 2)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const labelY = tStartY - 30;
        ctx.fillText(`${selectedDB.dbName} (${selectedDB.engine})`, W/2, labelY);
        ctx.fillStyle = '#6b7280';
        ctx.font = `${Math.round(10 * 2)}px monospace`;
        ctx.fillText(`${selectedDB.tablesCount} tablas · ${selectedDB.recordsCount?.toLocaleString()} registros · ${selectedDB.complianceScore}% cumplimiento`, W/2, labelY + 24);

        // Back button
        ctx.fillStyle = '#374151';
        ctx.font = `${Math.round(11 * 2)}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('← Volver', 16, 16);

        tables.forEach((t, i) => {
          const col = i % tCols;
          const row = Math.floor(i / tCols);
          const cx = tStartX + col * tSpacing;
          const cy = tStartY + row * tSpacing * 0.9;
          const bw = tSpacing * 0.35;
          const bh = tSpacing * 0.2;

          const pts = [
            [-bw/2, -bh/2, -depth/2], [bw/2, -bh/2, -depth/2],
            [bw/2, bh/2, -depth/2], [-bw/2, bh/2, -depth/2],
            [-bw/2, -bh/2, depth/2], [bw/2, -bh/2, depth/2],
            [bw/2, bh/2, depth/2], [-bw/2, bh/2, depth/2],
          ];
          const projected = pts.map(([x, y, z]) => {
            const xr = x * cosA - z * sinA;
            const zr = x * sinA + z * cosA;
            const scale = 400 / (400 + zr);
            return { x: cx + xr * scale, y: cy + y * scale * 0.7, z: zr, scale };
          });

          const personalCount = t.personalDataColumns?.length || 0;
          const hasPersonal = personalCount > 0;
          const isHovered = hoveredTableRef.current === i;

          const faces = [
            { pts: [0,1,2,3], color: hasPersonal ? '#7f1d1d' : '#1e3a5f' },
            { pts: [4,5,6,7], color: hasPersonal ? '#991b1b' : '#1a365d' },
            { pts: [0,1,5,4], color: hasPersonal ? '#b91c1c' : '#1e4976' },
            { pts: [2,3,7,6], color: hasPersonal ? '#7f1d1d' : '#162d50' },
            { pts: [1,2,6,5], color: hasPersonal ? '#991b1b' : '#1a365d' },
            { pts: [0,3,7,4], color: hasPersonal ? '#7f1d1d' : '#162d50' },
          ];

          if (isHovered) {
            faces.forEach(f => {
              f.color = f.color.replace(/[a-f0-9]{2}$/, 'ff');
            });
          }

          const sortedFaces = faces.map(f => ({
            ...f,
            avgZ: f.pts.reduce((s, pi) => s + projected[pi].z, 0) / f.pts.length,
          })).sort((a, b) => b.avgZ - a.avgZ);

          sortedFaces.forEach(face => {
            ctx.beginPath();
            face.pts.forEach((pi, j) => {
              const p = projected[pi];
              j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            const alpha = isHovered ? 1 : 0.85 + (face.avgZ / depth) * 0.15;
            ctx.fillStyle = face.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            if (isHovered) {
              ctx.strokeStyle = '#60a5fa';
              ctx.lineWidth = 2;
            } else {
              ctx.strokeStyle = 'rgba(255,255,255,0.06)';
              ctx.lineWidth = 1;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
          });

          // Label
          const label = t.table?.length > 14 ? t.table.slice(0, 13) + '…' : t.table || `Table ${i+1}`;
          ctx.fillStyle = '#e5e7eb';
          ctx.font = `bold ${Math.round(9 * 2)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(label, cx, cy + bh/2 + 8);

          ctx.fillStyle = '#9ca3af';
          ctx.font = `${Math.round(8 * 2)}px monospace`;
          ctx.fillText(`${t.columns?.length || 0} cols · ${t.rows || 0} rows`, cx, cy + bh/2 + 26);

          if (hasPersonal) {
            ctx.fillStyle = '#fca5a5';
            ctx.font = `${Math.round(7 * 2)}px monospace`;
            ctx.fillText(`${personalCount} datos personales`, cx, cy + bh/2 + 40);
          }
        });

        ctx.restore();
      } else {
        databases.forEach((db, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = startX + col * spacing;
          const cy = startY + row * spacing * 0.8;
          const depth = 40;
          const bw = spacing * 0.3;
          const bh = spacing * 0.25;

          const pts = [
            [-bw/2, -bh/2, -depth/2], [bw/2, -bh/2, -depth/2],
            [bw/2, bh/2, -depth/2], [-bw/2, bh/2, -depth/2],
            [-bw/2, -bh/2, depth/2], [bw/2, -bh/2, depth/2],
            [bw/2, bh/2, depth/2], [-bw/2, bh/2, depth/2],
          ];
          const projected = pts.map(([x, y, z]) => {
            const xr = x * cosA - z * sinA;
            const zr = x * sinA + z * cosA;
            const scale = 400 / (400 + zr);
            return { x: cx + xr * scale, y: cy + y * scale * 0.7, z: zr, scale };
          });

          const faces = [
            { pts: [0,1,2,3], color: db.compliant ? '#166534' : '#991b1b' },
            { pts: [4,5,6,7], color: db.compliant ? '#1a6b3e' : '#b91c1c' },
            { pts: [0,1,5,4], color: db.compliant ? '#1f7a48' : '#dc2626' },
            { pts: [2,3,7,6], color: db.compliant ? '#14532d' : '#7f1d1d' },
            { pts: [1,2,6,5], color: db.compliant ? '#1a6b3e' : '#b91c1c' },
            { pts: [0,3,7,4], color: db.compliant ? '#166534' : '#991b1b' },
          ];

          const sortedFaces = faces.map(f => ({
            ...f,
            avgZ: f.pts.reduce((s, pi) => s + projected[pi].z, 0) / f.pts.length,
          })).sort((a, b) => b.avgZ - a.avgZ);

          sortedFaces.forEach(face => {
            ctx.beginPath();
            face.pts.forEach((pi, j) => {
              const p = projected[pi];
              j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            const alpha = 0.85 + (face.avgZ / depth) * 0.15;
            ctx.fillStyle = face.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          });

          if (!db.compliant) {
            const p = projected[0];
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bw * 0.8);
            grad.addColorStop(0, 'rgba(220,38,38,0.15)');
            grad.addColorStop(1, 'rgba(220,38,38,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy + bh/2, bw * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#e5e7eb';
          ctx.font = `${Math.round(12 * 2)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const labelY2 = cy + bh/2 + 20;
          const dbLabel = db.dbName?.length > 12 ? db.dbName.slice(0, 11) + '…' : db.dbName || `DB ${i+1}`;
          ctx.fillText(dbLabel, cx, labelY2);
          ctx.fillStyle = db.compliant ? '#4ade80' : '#f87171';
          ctx.font = `${Math.round(9 * 2)}px monospace`;
          ctx.fillText(`${db.complianceScore}% · ${db.tablesCount} tbls · ${(db.tables || []).length > 0 ? 'click' : 'sin datos'}`, cx, labelY2 + 28);

          // Table indicators inside the cube face
          const tables = db.tables || [];
          if (tables.length > 0) {
            const p0 = projected[0];
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = `${Math.round(7 * 2)}px monospace`;
            ctx.textAlign = 'left';
            const maxShow = 4;
            for (let ti = 0; ti < Math.min(tables.length, maxShow); ti++) {
              const tn = tables[ti].table || `t${ti+1}`;
              ctx.fillText(tn.length > 10 ? tn.slice(0, 9) + '…' : tn, p0.x + 8, p0.y + 10 + ti * 16);
            }
            if (tables.length > maxShow) {
              ctx.fillText(`+${tables.length - maxShow} más`, p0.x + 8, p0.y + 10 + maxShow * 16);
            }
          }
        });
      }
    };

    const loop = () => {
      if (!dragRef.current.active) {
        angleRef.current += 0.004;
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('wheel', handleWheel, { passive: true });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [databases, selectedDB, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  if (!databases?.length) {
    return (
      <div className="h-full flex items-center justify-center text-text-subtle text-[11px]">
        No hay bases de datos conectadas
      </div>
    );
  }

  return (
    <canvas ref={canvasRef} className="w-full h-full cursor-pointer" style={{ imageRendering: 'auto' }} />
  );
}

function TableDetailPanel({ db, table, onClose }) {
  if (!table) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-panel border border-border-theme rounded-lg w-full max-w-[600px] mx-3 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 md:px-5 py-3 border-b border-border-theme flex items-center justify-between">
          <div>
            <p className="text-[13px] text-white font-semibold">{table.table}</p>
            <p className="text-[10px] text-text-muted">{db.dbName} · {table.rows?.toLocaleString()} filas</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-body text-[18px] leading-none">&times;</button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <p className="text-[10px] text-text-subtle uppercase tracking-wide mb-2">Columnas ({table.columns?.length || 0})</p>
          <div className="space-y-1">
            {(table.columns || []).map((col, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded bg-bg-elevated/40 border border-border-theme/50">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white font-mono">{col.name}
                    {col.primaryKey && <span className="ml-2 text-[9px] text-yellow-400 bg-yellow-500/10 px-1 py-0.5 rounded">PK</span>}
                  </p>
                  <p className="text-[9px] text-text-subtle">{col.type}{col.nullable ? ' · NULL' : ' · NOT NULL'}</p>
                </div>
                {(table.personalDataColumns || []).includes(col.name) && (
                  <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono flex-shrink-0">PERSONAL</span>
                )}
              </div>
            ))}
          </div>
          {table.personalDataColumns?.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/10 border border-red-800/20 rounded-lg">
              <p className="text-[10px] text-red-400 font-medium uppercase tracking-wide">Datos Personales Detectados</p>
              <p className="text-[11px] text-red-400/70 mt-1">
                {table.personalDataColumns.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ children, text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e) => setPos({ x: e.clientX + 12, y: e.clientY - 32 });
  return (
    <span className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onMouseMove={onMove}>
      {children}
      {show && (
        <span className="fixed z-[100] px-2 py-1 rounded-md bg-bg-panel border border-border-theme text-[10px] text-text-body shadow-lg pointer-events-none whitespace-nowrap" style={{ left: pos.x, top: pos.y }}>
          {text}
        </span>
      )}
    </span>
  );
}

function MiniChart({ data, color = '#60a5fa', height = 32, label = '' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 100;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => ({ x: i * step, y: height - ((v - min) / range) * height, value: v }));
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pointsStr} ${width},${height} 0,${height}`;
  const formatVal = (v) => Number.isInteger(v) ? v : v.toFixed(1);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polygon points={area} fill={color} fillOpacity="0.1" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
      {points.map((p, i) => (
        <ChartTooltip key={i} text={`${label ? label + ' — ' : ''}${formatVal(p.value)}`}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} className="hover:r-4 transition-all cursor-pointer" />
        </ChartTooltip>
      ))}
    </svg>
  );
}

function DonutChart({ value, color = '#34d399', size = 96, stroke = 10, label, sub, tooltip }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const chart = (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      {(label || sub) && (
        <div>
          {label && <p className="text-[13px] font-bold text-white/80">{label}</p>}
          {sub && <p className="text-[10px] text-text-subtle">{sub}</p>}
        </div>
      )}
    </div>
  );
  return tooltip ? <ChartTooltip text={tooltip}>{chart}</ChartTooltip> : chart;
}

function GaugeChart({ value, color, size = 120, label, sub, tooltip }) {
  const r = size / 2 - 8;
  const stroke = 10;
  const arc = Math.PI * r;
  const offset = arc - (value / 100) * arc;
  const chart = (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.6}`}>
        <path d={`M 8 ${size / 1.6 - 8} A ${r} ${r} 0 0 1 ${size - 8} ${size / 1.6 - 8}`} fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M 8 ${size / 1.6 - 8} A ${r} ${r} 0 0 1 ${size - 8} ${size / 1.6 - 8}`} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={arc} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        <text x={size / 2} y={size / 1.6 - 22} textAnchor="middle" className="fill-white text-[18px] font-bold">{value}%</text>
      </svg>
      {label && <p className="text-[11px] font-medium text-white/70 mt-1">{label}</p>}
      {sub && <p className="text-[10px] text-text-subtle">{sub}</p>}
    </div>
  );
  return tooltip ? <ChartTooltip text={tooltip}>{chart}</ChartTooltip> : chart;
}

function HorizontalBarChart({ data, max = 100 }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-text-muted font-medium truncate pr-3 flex-1">{d.label}</span>
            <span className="text-white/70 font-semibold tabular-nums">{d.value}{d.suffix || '%'}</span>
          </div>
          <ChartTooltip text={`${d.label}: ${d.value}${d.suffix || '%'}`}>
            <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden cursor-pointer">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (d.value / max) * 100)}%`, backgroundColor: d.color }} />
            </div>
          </ChartTooltip>
        </div>
      ))}
    </div>
  );
}

function LawCountdown() {
  const lawDate = new Date('2026-12-13T00:00:00-03:00');
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const diff = Math.max(0, lawDate - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const isEnforced = diff <= 0;

  return (
    <div className={`rounded-xl border p-5 ${isEnforced ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02]'}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnforced ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/80">Cuenta Regresiva</p>
          <p className="text-[10px] text-text-subtle">Vigencia Ley 21.719</p>
        </div>
      </div>
      {isEnforced ? (
        <div className="text-center py-3">
          <p className="text-[14px] font-bold text-red-400">La Ley 21.719 esta vigente</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {[
            { v: days, l: 'Dias' },
            { v: hours, l: 'Horas' },
            { v: mins, l: 'Min' },
            { v: secs, l: 'Seg' },
          ].map((u, i) => (
            <div key={i} className="text-center rounded-lg bg-white/[0.03] border border-white/[0.04] py-2.5 px-1">
              <p className="text-[20px] md:text-[24px] font-bold text-white tabular-nums leading-none">{String(u.v).padStart(2, '0')}</p>
              <p className="text-[9px] text-text-subtle uppercase tracking-wider mt-1">{u.l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplianceChecklist({ stats }) {
  const s = stats?.stats;
  const items = [
    { label: 'Inventario de datos personales', art: 'Art. 15', done: (s?.totalDatabases ?? 0) > 0, hint: 'Registra todas las bases de datos' },
    { label: 'Consentimiento de titulares', art: 'Art. 12', done: s?.complianceScore >= 50, hint: 'Obten consentimiento explicito' },
    { label: 'Delegado de Proteccion de Datos', art: 'Art. 28', done: false, hint: 'Designa un DPD en la APDP' },
    { label: 'Notificacion de brechas (72h)', art: 'Art. 26', done: (s?.openBreaches ?? 0) === 0, hint: 'Protocolo de respuesta a brechas' },
    { label: 'Medidas de seguridad tecnicas', art: 'Art. 25', done: (s?.onlineAgents ?? 0) > 0, hint: 'Cifrado, control de acceso' },
    { label: 'Derechos ARCO habilitados', art: 'Art. 14', done: false, hint: 'Sistema para solicitudes de titulares' },
    { label: 'Registro ante la APDP', art: 'Art. 8', done: false, hint: 'Inscripcion en el registro' },
    { label: 'Evaluaciones de impacto (DPIA)', art: 'Art. 27', done: false, hint: 'Evaluacion para alto riesgo' },
  ];
  const doneCount = items.filter(i => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold text-white/80">Checklist de Adecuacion</p>
          <p className="text-[10px] text-text-subtle mt-0.5">{doneCount} de {items.length} cumplidos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171' }} />
          </div>
          <span className={`text-[11px] font-bold ${pct >= 70 ? 'text-[#34d399]' : pct >= 40 ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>{pct}%</span>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${item.done ? 'border-[#34d399]/[0.08] bg-[#34d399]/[0.02]' : 'border-white/[0.03] bg-white/[0.01]'}`}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-[#34d399]/15 text-[#34d399]' : 'bg-white/[0.03] text-text-subtle'}`}>
              {item.done ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-medium ${item.done ? 'text-text-muted' : 'text-white/70'}`}>{item.label}</p>
              {!item.done && <p className="text-[10px] text-text-subtle mt-0.5">{item.hint}</p>}
            </div>
            <span className="text-[9px] font-mono text-text-subtle bg-white/[0.03] px-1.5 py-0.5 rounded flex-shrink-0">{item.art}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrinciplesGrid() {
  const principles = [
    { n: 1, title: 'Licitud', desc: 'Todo tratamiento debe basarse en una causa legal valida', icon: 'M9 12l2 2 4-4' },
    { n: 2, title: 'Finalidad', desc: 'Los datos deben usarse solo para fines especificos y legitimos', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { n: 3, title: 'Proporcionalidad', desc: 'Solo recopilar los datos estrictamente necesarios', icon: 'M4 6h16M4 12h16M4 18h16' },
    { n: 4, title: 'Calidad', desc: 'Los datos deben ser exactos y estar actualizados', icon: 'M5 13l4 4L19 7' },
    { n: 5, title: 'Responsabilidad Proactiva', desc: 'Demostrar cumplimiento ante la APDP', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { n: 6, title: 'Seguridad', desc: 'Medidas tecnicas y organizativas apropiadas', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { n: 7, title: 'Transparencia', desc: 'Informar al titular sobre el tratamiento de sus datos', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { n: 8, title: 'Minimizacion', desc: 'Conservar datos solo el tiempo necesario', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
    { n: 9, title: 'Confidencialidad', desc: 'Garantizar secreto y privacidad de los datos', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/80">9 Principios de la Ley 21.719</p>
          <p className="text-[10px] text-text-subtle">Fundamentos del tratamiento de datos personales</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {principles.map((p) => (
          <button key={p.n} onClick={() => setExpanded(expanded === p.n ? null : p.n)}
            className={`text-left rounded-lg border p-3 transition-all duration-200 ${expanded === p.n ? 'border-indigo-500/20 bg-indigo-500/[0.04]' : 'border-white/[0.03] bg-white/[0.01] hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={p.icon}/></svg>
              </div>
              <span className="text-[11px] font-semibold text-white/70">{p.n}. {p.title}</span>
            </div>
            <p className={`text-[10px] text-text-subtle leading-relaxed ${expanded === p.n ? '' : 'line-clamp-2'}`}>{p.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SanctionsRiskMeter({ stats }) {
  const s = stats?.stats;
  const complianceScore = s?.complianceScore ?? 0;
  const breachCount = s?.openBreaches ?? 0;
  const hasSensitive = (s?.nonCompliantDBs ?? 0) > 0;

  const riskFactors = [
    { label: 'Cumplimiento bajo', weight: (100 - complianceScore) * 10, max: 1000 },
    { label: 'BDs sin adecuar', weight: (s?.nonCompliantDBs ?? 0) * 50, max: 500 },
    { label: 'Brechas abiertas', weight: breachCount * 80, max: 800 },
    { label: 'Datos sensibles expuestos', weight: hasSensitive ? 200 : 0, max: 200 },
  ];
  const totalRisk = riskFactors.reduce((a, f) => a + Math.min(f.weight, f.max), 0);
  const maxRisk = 2500;
  const riskPct = Math.min(100, (totalRisk / maxRisk) * 100);
  const riskLevel = riskPct < 25 ? 'Bajo' : riskPct < 50 ? 'Moderado' : riskPct < 75 ? 'Alto' : 'Critico';
  const riskColor = riskPct < 25 ? '#34d399' : riskPct < 50 ? '#fbbf24' : riskPct < 75 ? '#fb923c' : '#f87171';
  const estimatedUTM = Math.round((riskPct / 100) * 30000);
  const estimatedCLP = (estimatedUTM * 65000).toLocaleString('es-CL', { maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/80">Medidor de Riesgo de Sanciones</p>
          <p className="text-[10px] text-text-subtle">Exposicion estimada segun Ley 21.719</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-white/[0.04]" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={riskColor} strokeWidth="10" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 - (riskPct / 100) * 2 * Math.PI * 50} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[22px] font-bold leading-none" style={{ color: riskColor }}>{riskLevel}</p>
            <p className="text-[10px] text-text-subtle mt-1">{Math.round(riskPct)}%</p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="space-y-2 mb-3">
            {riskFactors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-text-muted font-medium">{f.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (f.weight / f.max) * 100)}%`, backgroundColor: f.weight > 0 ? '#f87171' : '#34d399' }} />
                  </div>
                  <span className={`font-semibold tabular-nums w-8 text-right ${f.weight > 0 ? 'text-[#f87171]/80' : 'text-[#34d399]/80'}`}>{f.weight > 0 ? 'Si' : 'No'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
            <p className="text-[10px] text-text-subtle">Exposicion maxima estimada</p>
            <p className="text-[16px] font-bold text-white/80 mt-0.5">{estimatedUTM.toLocaleString()} UTM</p>
            <p className="text-[10px] text-text-subtle mt-0.5">~ ${estimatedCLP} CLP</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ARCOQuickActions() {
  const rights = [
    { title: 'Acceso', desc: 'Solicitar que datos tuyos se tratan', color: '#60a5fa', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { title: 'Rectificacion', desc: 'Corregir datos inexactos', color: '#34d399', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { title: 'Cancelacion', desc: 'Solicitar eliminacion de tus datos', color: '#f87171', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
    { title: 'Oposicion', desc: 'Oponerte al tratamiento', color: '#fbbf24', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { title: 'Portabilidad', desc: 'Recibir tus datos en formato estructurado', color: '#c084fc', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { title: 'Revocacion', desc: 'Retirar tu consentimiento', color: '#fb923c', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
  ];
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/80">Derechos ARCO + Portabilidad</p>
          <p className="text-[10px] text-text-subtle">Derechos de los titulares segun Art. 14</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {rights.map((r, i) => (
          <div key={i} className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3 hover:border-white/[0.06] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${r.color}15`, color: r.color }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={r.icon}/></svg>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: r.color }}>{r.title}</span>
            </div>
            <p className="text-[10px] text-text-subtle leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LawTimeline() {
  const milestones = [
    { date: 'Dic 2024', title: 'Publicacion en el Diario Oficial', desc: 'La Ley 21.719 fue promulgada y publicada', done: true },
    { date: '2024-2026', title: 'Periodo de vacancia (24 meses)', desc: 'Plazo para que las organizaciones se adecuen', done: false, active: true },
    { date: '2026', title: 'Entrada en vigencia', desc: 'Las obligaciones comienzan a ser exigibles', done: false },
    { date: '2026+', title: 'Fiscalizacion APDP', desc: 'La Agencia inicia auditorias y sanciones', done: false },
  ];
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <p className="text-[12px] font-semibold text-white/80">Cronologia de la Ley 21.719</p>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/[0.06]" />
        {milestones.map((m, i) => (
          <div key={i} className="relative pb-5 last:pb-0">
            <div className={`absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${m.done ? 'bg-[#34d399] border-[#34d399]' : m.active ? 'bg-amber-500/20 border-amber-400' : 'bg-bg-base border-white/[0.08]'}`}>
              {m.done && <svg className="w-2 h-2 text-bg-base" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
              {m.active && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </div>
            <p className="text-[10px] text-text-subtle font-mono">{m.date}</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${m.done ? 'text-[#34d399]/80' : m.active ? 'text-amber-400' : 'text-white/60'}`}>{m.title}</p>
            <p className="text-[10px] text-text-subtle mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDb, setExpandedDb] = useState(null);
  const [tab, setTab] = useState('overview');
  const [detailTable, setDetailTable] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [ufValue, setUfValue] = useState(null);

  const fetchUF = useCallback(async () => {
    try {
      const r = await fetch('https://mindicador.cl/api/uf');
      if (r.ok) {
        const data = await r.json();
        if (data?.serie?.[0]?.valor) setUfValue(data.serie[0].valor);
      }
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const sr = await fetch(`/api/dashboard/stats?token=${encodeURIComponent(token)}`);
      if (sr.status === 401) {
        if (!window.__sessionExpiredFired) { window.__sessionExpiredFired = true; window.dispatchEvent(new CustomEvent('session-expired')); }
        return;
      }
      const data = await sr.json();
      if (data?.error === 'token inválido' || data?.error === 'token requerido') {
        if (!window.__sessionExpiredFired) { window.__sessionExpiredFired = true; window.dispatchEvent(new CustomEvent('session-expired')); }
        return;
      }
      if (sr.ok) setStats(data);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [token]);

  useEffect(() => { fetchData(); fetchUF(); }, [fetchData, fetchUF]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-base gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/[0.06] border-t-white/30 animate-spin" />
        <p className="text-[11px] text-text-subtle font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  const s = stats?.stats;

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <div className="flex-shrink-0 px-5 md:px-8 py-5 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Dashboard</h2>
          <p className="text-[11px] text-text-subtle mt-0.5 font-medium">
            {user?.companyName || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-white/20 font-medium hidden sm:inline tabular-nums">
              Actualizado {lastUpdated.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchData} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] text-text-muted hover:text-text-body border border-white/[0.05] hover:border-white/[0.08] transition-all">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refrescar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-5 scrollbar-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 tour-detail-kpi-grid">
          {[
            { label: 'Agentes', value: s?.onlineAgents ?? '-', sub: `${s?.totalAgents ?? 0} registrados`, color: '#60a5fa', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, info: 'Agentes de seguridad instalados en los endpoints de tu organización que reportan estado y eventos en tiempo real.', trend: [s?.onlineAgents * 0.4 || 0, s?.onlineAgents * 0.6 || 0, s?.onlineAgents * 0.8 || 0, s?.onlineAgents || 0] },
            { label: 'Bases de Datos', value: s?.totalDatabases ?? '-', sub: `${s?.totalTables ?? 0} tablas · ${s?.totalRecords?.toLocaleString() ?? 0} registros`, color: '#34d399', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>, info: 'Bases de datos conectadas al monitoreo. Se escanean automáticamente para detectar datos personales.', trend: [s?.totalDatabases * 0.3 || 0, s?.totalDatabases * 0.5 || 0, s?.totalDatabases * 0.7 || 0, s?.totalDatabases || 0] },
            { label: 'Cumplimiento', value: s ? `${s.complianceScore}%` : '-', sub: `${s?.compliantDBs ?? 0} cumplen · ${s?.nonCompliantDBs ?? 0} no cumplen`, color: (s?.complianceScore ?? 0) >= 70 ? '#34d399' : '#f87171', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>, info: 'Porcentaje de cumplimiento de la Ley 21.719. Mide consentimientos, DPIAs, inventario de datos y más.', trend: [20, 35, s?.complianceScore * 0.7 || 0, s?.complianceScore || 0] },
            { label: 'Brechas', value: s?.openBreaches ?? '-', sub: `${s?.totalBreaches ?? 0} reportadas`, color: s?.openBreaches > 0 ? '#f87171' : '#34d399', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>, info: 'Brechas de seguridad que involucran datos personales. Requieren notificación a la ANPD dentro de 72 horas.', trend: [0, s?.openBreaches * 0.3 || 0, s?.openBreaches * 0.6 || 0, s?.openBreaches || 0] },
            { label: 'Usuarios Vulnerables', value: s?.vulnerableUsersCount ?? '-', sub: 'Datos en riesgo', color: (s?.vulnerableUsersCount ?? 0) > 0 ? '#f87171' : '#34d399', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>, info: 'Usuarios con credenciales débiles, reutilizadas o comprometidas detectadas en brechas de datos.', trend: [0, s?.vulnerableUsersCount * 0.25 || 0, s?.vulnerableUsersCount * 0.5 || 0, s?.vulnerableUsersCount || 0] },
          ].map((card, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                </div>
                <InfoTooltip text={card.info} placement="bottom" />
              </div>
              <p className="text-[26px] font-bold tracking-tight leading-none" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-white/20 mt-1.5 font-medium truncate">{card.sub}</p>
              <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <MiniChart data={card.trend} color={card.color} height={28} label={card.label} />
              </div>
            </div>
          ))}
        </div>

        {ufValue && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-[10px] text-text-subtle uppercase tracking-widest font-medium">Valor UF Hoy</p>
                <p className="text-[16px] font-semibold text-white mt-0.5 tracking-tight">${Number(ufValue).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="text-right">
              {user?.customPrice > 0 ? (
                <>
                  <p className="text-[10px] text-text-subtle font-medium">Plan personalizado: <span className="text-text-body font-semibold">{user.customPrice} UF</span></p>
                  <p className="text-[11px] text-white/50 font-medium mt-1">≈ ${(user.customPrice * ufValue).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP / mes</p>
                </>
              ) : (
                <p className="text-[10px] text-text-subtle font-medium">Plan: <span className="text-text-body font-semibold">{user?.planType || 'Gratuito'}</span></p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tour-detail-stats-grid">
          {[
            { label: 'Alertas Activas', value: s?.activeAlerts ?? '-', sub: 'Pendientes de revisión', color: (s?.activeAlerts ?? 0) > 0 ? '#fb7185' : '#34d399', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>, info: 'Alertas de seguridad pendientes de revisión que requieren atención.' },
            { label: 'Escaneos', value: s?.completedScans ?? '-', sub: `${s?.totalScans ?? 0} programados`, color: '#818cf8', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>, info: 'Escaneos de seguridad y cumplimiento ejecutados este período.' },
            { label: 'Reportes', value: s?.generatedReports ?? '-', sub: 'Este mes', color: '#fbbf24', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, info: 'Reportes de cumplimiento y seguridad generados para auditorías.' },
            { label: 'Agentes Online', value: s?.onlineAgents ?? '-', sub: `${s?.totalAgents ?? 0} registrados`, color: '#22d3ee', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>, info: 'Agentes conectados y reportando métricas en este momento.' },
          ].map((card, i) => (
            <div key={i + 5} className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 hover:border-white/[0.08] hover:bg-white/[0.025] transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ color: card.color, backgroundColor: `${card.color}15` }}>{card.icon}</div>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{card.label}</p>
                </div>
                <InfoTooltip text={card.info} placement="bottom" />
              </div>
              <p className="text-[22px] font-bold tracking-tight leading-none" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-white/20 mt-1.5 font-medium truncate">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 tour-detail-tabs">
          <div className="flex rounded-lg bg-white/[0.02] border border-white/[0.04] p-0.5">
            {[
              { key: 'overview', label: 'Resumen DB' },
              { key: 'vulnerable', label: 'Vulnerables' },
              { key: 'ley21719', label: 'Ley 21.719' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  tab === key ? 'bg-white/[0.06] text-white/80' : 'text-text-subtle hover:text-text-heading/50'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            {s && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-5 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] tour-detail-summary">
                <span className="text-[11px] text-text-subtle font-medium">
                  <span className="text-white/80 font-semibold">{s?.totalDatabases ?? 0}</span> bases de datos
                </span>
                <span className="text-[11px] text-text-subtle font-medium">
                  <span className="text-white/80 font-semibold">{s?.onlineAgents ?? 0}</span> agentes activos
                </span>
                <span className="text-[11px] text-text-subtle font-medium">
                  <span className="text-white/80 font-semibold">{s?.openBreaches ?? 0}</span> brechas abiertas
                </span>
                <span className="text-[11px] text-text-subtle font-medium">
                  <span className="text-white/80 font-semibold">{s?.totalTables ?? 0}</span> tablas
                </span>
                <span className="text-[11px] text-text-subtle font-medium ml-auto">
                  <span className={`font-semibold ${s?.complianceScore >= 70 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{s?.complianceScore ?? 0}%</span> cumplimiento global
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col items-center justify-center">
                <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3 self-start">Cumplimiento Global</p>
                <GaugeChart value={s?.complianceScore || 0} color={(s?.complianceScore || 0) >= 70 ? '#34d399' : '#f87171'} size={160} label="Ley 21.719" sub={`${s?.compliantDBs ?? 0} de ${(s?.compliantDBs ?? 0) + (s?.nonCompliantDBs ?? 0)} DBs`} tooltip={`Cumplimiento global: ${s?.complianceScore || 0}% — ${s?.compliantDBs ?? 0} DBs cumplen, ${s?.nonCompliantDBs ?? 0} no cumplen`} />
              </div>
              {stats?.dbCompliance && stats.dbCompliance.length > 0 && (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Distribución de Cumplimiento</p>
                  {(() => {
                    const total = stats.dbCompliance.length;
                    const compliant = stats.dbCompliance.filter(d => d.compliant).length;
                    const nonCompliant = total - compliant;
                    const cp = total > 0 ? (compliant / total) * 100 : 0;
                    return (
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <DonutChart value={cp} color="#34d399" size={110} stroke={12} label={`${compliant} DBs`} sub="cumplen" tooltip={`${compliant} de ${total} DBs cumplen (${cp.toFixed(1)}%)`} />
                        <div className="flex-1 w-full">
                          <HorizontalBarChart data={[
                            { label: 'Cumplen', value: cp, color: '#34d399' },
                            { label: 'No cumplen', value: 100 - cp, color: '#f87171' },
                          ]} />
                          <div className="flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-2 text-[11px] text-text-muted font-medium">
                              <span className="w-2 h-2 rounded-full bg-[#34d399]" /> {compliant} cumplen
                            </span>
                            <span className="flex items-center gap-2 text-[11px] text-text-muted font-medium">
                              <span className="w-2 h-2 rounded-full bg-[#f87171]" /> {nonCompliant} no cumplen
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
                <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Top Bases de Datos por Cumplimiento</p>
                <HorizontalBarChart data={(stats?.dbCompliance || []).slice(0, 5).map(db => ({
                  label: db.dbName?.length > 18 ? db.dbName.slice(0, 17) + '…' : db.dbName,
                  value: db.complianceScore,
                  color: db.complianceScore >= 70 ? '#34d399' : db.complianceScore >= 40 ? '#fbbf24' : '#f87171',
                }))} />
              </div>
            </div>

            <p className="text-[11px] font-semibold text-white/60 tracking-wide">Cumplimiento por Base de Datos — Ley 21.719</p>
            <div className="space-y-3">
              {stats?.dbCompliance?.map(db => (
                <div key={db.dbId}>
                  <button onClick={() => setExpandedDb(expandedDb === db.dbId ? null : db.dbId)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                      db.compliant 
                        ? 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.02]' 
                        : 'border-red-500/[0.08] bg-red-500/[0.02] hover:border-red-500/[0.15] hover:bg-red-500/[0.04]'
                    }`}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${db.compliant ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
                      <div className="text-left min-w-0">
                        <p className="text-[12px] font-semibold text-white/80">{db.dbName} <span className="text-white/20 font-normal font-mono text-[11px]">({db.engine})</span></p>
                        <p className="text-[10px] text-white/20 mt-1 font-medium">{db.tablesCount} tablas · {db.recordsCount?.toLocaleString()} registros · {db.openBreaches > 0 ? `${db.openBreaches} brecha(s) activa(s)` : 'sin brechas de seguridad'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 min-w-[120px] md:min-w-[180px]">
                      <div className="flex-1 w-24 md:w-36">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-semibold ${db.complianceScore >= 70 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{db.complianceScore}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${db.complianceScore}%`, backgroundColor: db.complianceScore >= 70 ? '#34d399' : db.complianceScore >= 40 ? '#fbbf24' : '#f87171' }} />
                        </div>
                      </div>
                      <svg className={`w-3.5 h-3.5 text-text-subtle transition-transform duration-300 ${expandedDb === db.dbId ? 'rotate-180 text-text-muted' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </button>
                  {expandedDb === db.dbId && (
                    <div className="mx-2 mt-1.5 mb-3 px-5 py-4 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Artículos Aplicables</p>
                          <div className="space-y-2">
                            {[
                              { key: 'Art. 12 — Consentimiento', ok: db.consentOk },
                              { key: 'Art. 15 — Inventario de Datos', ok: db.inventoryCount > 0 },
                              { key: 'Art. 26 — Notificación de Brechas', ok: db.openBreaches === 0 },
                              { key: 'Art. 21 — Datos Sensibles', ok: !db.hasSensitiveData || db.consentOk },
                              { key: 'Escaneo Periódico', ok: !!db.lastScanned },
                            ].map((art, j) => (
                              <div key={j} className="flex items-center gap-2.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${art.ok ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
                                <span className={`text-[11px] font-medium ${art.ok ? 'text-text-muted' : 'text-[#f87171]/80'}`}>{art.key}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-text-subtle uppercase tracking-widest mb-3">Detalles del Sistema</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                            <p className="text-text-subtle">Motor: <span className="text-white/50 font-mono font-medium ml-1">{db.engine}</span></p>
                            <p className="text-text-subtle">Tablas: <span className="text-white/50 font-medium ml-1">{db.tablesCount}</span></p>
                            <p className="text-text-subtle">Registros: <span className="text-white/50 font-medium ml-1">{db.recordsCount?.toLocaleString()}</span></p>
                            <p className="text-text-subtle">Último Escaneo: <span className="text-white/50 font-medium ml-1">{db.lastScanned ? new Date(db.lastScanned).toLocaleDateString('es') : 'Nunca'}</span></p>
                            <p className="text-text-subtle">Estado: <span className={`font-semibold ml-1 ${db.status === 'connected' ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{db.status}</span></p>
                            <p className="text-text-subtle">Datos Sensibles: <span className={`font-semibold ml-1 ${db.hasSensitiveData ? 'text-[#f87171]' : 'text-[#34d399]'}`}>{db.hasSensitiveData ? 'Sí' : 'No'}</span></p>
                          </div>
                        </div>
                      </div>
                      {!db.compliant && (
                        <div className="pt-3.5 border-t border-white/[0.04]">
                          <p className="text-[10px] font-medium text-[#f87171]/70 uppercase tracking-widest mb-2">Acciones Recomendadas</p>
                          <ul className="space-y-1.5 text-[11px] text-[#f87171]/50 font-medium">
                            {!db.consentOk && <li>• Obtener consentimiento formal de los titulares (Art. 12)</li>}
                            {db.hasSensitiveData && !db.consentOk && <li>• Configurar controles reforzados para datos sensibles (Art. 21)</li>}
                            {db.inventoryCount === 0 && <li>• Completar el registro en el inventario de datos personales (Art. 15)</li>}
                            {db.openBreaches > 0 && <li>• Identificar y mitigar las brechas de seguridad abiertas (Art. 26)</li>}
                            {!db.lastScanned && <li>• Programar un escaneo de seguridad en esta base de datos</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!stats?.dbCompliance || stats.dbCompliance.length === 0) && (
                <div className="text-center py-16 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[12px] text-text-subtle font-medium">No hay bases de datos conectadas</p>
                  <p className="text-[10px] text-white/10 mt-1">Ve a la sección de Bases de Datos para añadir una</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'vulnerable' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/60 tracking-wide">Usuarios y Datos Vulnerables</p>
              <span className="text-[10px] text-text-subtle font-medium">{stats?.vulnerableUsers?.length ?? 0} detectados</span>
            </div>
            <div className="space-y-3">
              {stats?.vulnerableUsers?.map((v, i) => (
                <div key={i} className={`rounded-xl border px-5 py-4 flex items-start gap-3.5 transition-all duration-200 ${
                  v.severity === 'red'
                    ? 'border-red-500/[0.08] bg-red-500/[0.02]'
                    : 'border-amber-500/[0.06] bg-amber-500/[0.01]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${v.severity === 'red' ? 'bg-[#f87171]' : 'bg-[#fbbf24]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[12px] text-white/80 font-semibold">{v.dataType}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold uppercase border ${v.risk === 'critical' || v.risk === 'high' ? 'bg-[#f87171]/[0.08] text-[#f87171] border-[#f87171]/[0.15]' : v.risk === 'medium' ? 'bg-[#fbbf24]/[0.08] text-[#fbbf24] border-[#fbbf24]/[0.15]' : 'bg-[#60a5fa]/[0.08] text-[#60a5fa] border-[#60a5fa]/[0.15]'}`}>{v.risk || 'desconocido'}</span>
                      {v.sensitive && <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-[#c084fc]/[0.08] text-[#c084fc] border border-[#c084fc]/[0.15] uppercase">Sensible</span>}
                    </div>
                    <p className="text-[10px] text-white/20 mt-1 font-medium">
                      Categoría: {v.category} · Almacenado en: {v.storage} · {v.breaches > 0 ? `${v.breaches} brecha(s)` : 'sin brechas de seguridad'}
                    </p>
                    {v.reasons?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {v.reasons.map((r, j) => (
                          <span key={j} className="text-[10px] text-[#f87171]/60 bg-[#f87171]/[0.04] px-2 py-0.5 rounded-md border border-[#f87171]/[0.08] font-medium">{typeof r === 'string' ? r : r?.reason || r?.description || String(r)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-text-subtle text-right flex-shrink-0 font-medium">{v.category}</div>
                </div>
              ))}
              {(!stats?.vulnerableUsers || stats.vulnerableUsers.length === 0) && (
                <div className="text-center py-16 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[12px] text-text-subtle font-medium">No se detectaron usuarios vulnerables</p>
                  <p className="text-[10px] text-white/10 mt-1">El sistema parece estar seguro</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'ley21719' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LawCountdown />
              <SanctionsRiskMeter stats={stats} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ComplianceChecklist stats={stats} />
              <div className="space-y-4">
                <LawTimeline />
              </div>
            </div>
            <PrinciplesGrid />
            <ARCOQuickActions />
          </div>
        )}

      </div>

      {detailTable && (
        <TableDetailPanel
          db={detailTable.db}
          table={detailTable.table}
          onClose={() => setDetailTable(null)}
        />
      )}
    </div>
  );
}

export default DashboardContent;