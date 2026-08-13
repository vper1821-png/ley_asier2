import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';

const ARTICLES = [
  // Ley 21.719
  { title: '¿Qué es la Ley 21.719?', query: '¿Qué es la Ley 21.719?', category: 'Ley 21.719', content: 'La Ley 21.719 es la nueva Ley de Protección de Datos Personales de Chile, publicada el 17 de agosto de 2023. Regula el tratamiento de datos personales y establece derechos para los titulares, obligaciones para los responsables y sanciones por incumplimiento.' },
  { title: 'Ámbito de aplicación', query: '¿A quiénes aplica la Ley 21.719?', category: 'Ley 21.719', content: 'Aplica a personas naturales o jurídicas, públicas o privadas, que traten datos personales en Chile. También alcanza extraterritorialmente a entidades extranjeras que traten datos de titulares ubicados en Chile.' },
  { title: 'Principios de la ley', query: '¿Cuáles son los principios de la Ley 21.719?', category: 'Ley 21.719', content: 'Los principios son: licitud, lealtad, finalidad, proporcionalidad, calidad, responsabilidad proactiva, seguridad, información al titular y respeto a los derechos ARCO.' },
  { title: 'Diferencias con la Ley 19.628', query: '¿Cuáles son las diferencias con la Ley 19.628?', category: 'Ley 21.719', content: 'Crea la APDP, exige consentimiento explícito, sanciones de hasta 20.000 UTM, designación de DPD, notificación de brechas en 72 horas, portabilidad y responsabilidad proactiva.' },
  { title: 'Sanciones por incumplimiento', query: '¿Cuáles son las sanciones por incumplir la ley?', category: 'Ley 21.719', content: 'Las sanciones incluyen advertencias, multas de hasta 10.000 UTM, inhabilitación temporal y cierre del sitio web en casos graves de incumplimiento reiterado.' },
  { title: 'Vacancia de la ley', query: '¿Cuál es la vacancia de la Ley 21.719?', category: 'Ley 21.719', content: 'La ley entró en vigor de forma gradual. Muchas obligaciones tienen un plazo de vacancia de 24 meses desde su publicación, permitiendo a las organizaciones adaptarse progresivamente.' },
  { title: 'Agencia APDP', query: '¿Qué es la APDP?', category: 'Ley 21.719', content: 'La Agencia de Protección de Datos Personales (APDP) es el organismo fiscalizador encargado de velar por el cumplimiento de la normativa, resolver reclamos e imponer sanciones.' },
  { title: 'Registro ante la APDP', query: '¿Debo registrarme en la APDP?', category: 'Ley 21.719', content: 'Sí, los responsables de tratamiento deben registrarse ante la APDP, indicando datos tratados, finalidades, categorías de titulares, medidas de seguridad y DPD designado.' },

  // Protección de datos
  { title: 'Datos personales según la ley', query: '¿Qué son los datos personales?', category: 'Protección de datos', content: 'Son cualquier información concerniente a una persona natural identificada o identificable. Incluye nombre, RUT, correo, teléfono, dirección, datos biométricos, financieros, etc.' },
  { title: 'Datos sensibles', query: '¿Qué son los datos sensibles?', category: 'Protección de datos', content: 'Son datos que requieren mayor protección por su naturaleza: origen racial, opiniones políticas, creencias religiosas, datos de salud, biométricos, genéticos, vida sexual y datos de menores.' },
  { title: 'Obligaciones del responsable', query: '¿Qué obligaciones tiene mi empresa?', category: 'Protección de datos', content: 'Debes realizar inventario de datos, obtener consentimiento, designar DPD, registrarte en APDP, implementar medidas de seguridad, atender derechos ARCO y notificar brechas.' },
  { title: 'Consentimiento informado', query: '¿Cómo debe ser el consentimiento?', category: 'Protección de datos', content: 'Debe ser libre, específico, informado, inequívoco y revocable. Para datos sensibles debe ser explícito y por escrito. No puede estar en cláusulas genéricas.' },
  { title: 'Revocación del consentimiento', query: '¿Se puede revocar el consentimiento?', category: 'Protección de datos', content: 'Sí, el titular puede revocar su consentimiento en cualquier momento sin expresión de causa. La revocación debe ser tan fácil como otorgarlo.' },
  { title: 'Encargados de tratamiento', query: '¿Qué es un encargado de tratamiento?', category: 'Protección de datos', content: 'Es quien trata datos personales por cuenta del responsable. Debe existir un contrato que defina el tratamiento, confidencialidad, seguridad y devolución o eliminación de datos.' },
  { title: 'Transferencia internacional', query: '¿Puedo transferir datos fuera de Chile?', category: 'Protección de datos', content: 'Solo a países con nivel adecuado de protección, o mediante consentimiento explícito, ejecución de contrato, cláusulas contractuales tipo o normas corporativas vinculantes aprobadas.' },
  { title: 'Evaluación de impacto', query: '¿Qué es una evaluación de impacto?', category: 'Protección de datos', content: 'Es un análisis de riesgos que debe realizarse cuando el tratamiento pueda afectar significativamente los derechos de los titulares, especialmente con datos sensibles o nuevas tecnologías.' },

  // Cumplimiento normativo
  { title: 'Plan de cumplimiento', query: '¿Cómo cumplir con la Ley 21.719?', category: 'Cumplimiento normativo', content: 'El plan incluye: inventario de datos, mapeo de flujos, actualización de consentimientos, designación de DPD, registro en APDP, medidas de seguridad, atención ARCO y plan de respuesta a brechas.' },
  { title: 'Inventario de datos', query: '¿Qué debe incluir el inventario de datos?', category: 'Cumplimiento normativo', content: 'Debe incluir categorías de datos, finalidades, base legal, titulares, origen, transferencias, plazos de conservación, medidas de seguridad y evaluación de riesgos.' },
  { title: 'Registro de actividades', query: '¿Debo llevar un registro de actividades?', category: 'Cumplimiento normativo', content: 'Sí, debes documentar las actividades de tratamiento: qué datos tratas, con qué finalidad, quién tiene acceso, cómo se protegen y durante cuánto tiempo se conservan.' },
  { title: 'Auditoría de cumplimiento', query: '¿Cómo auditar el cumplimiento?', category: 'Cumplimiento normativo', content: 'Realiza revisiones periódicas del inventario, consentimientos, solicitudes ARCO, medidas de seguridad, contratos con encargados y registros de brechas. Documenta hallazgos y planes de mejora.' },
  { title: 'Reportes de cumplimiento', query: '¿Cómo generar reportes de cumplimiento?', category: 'Cumplimiento normativo', content: 'La plataforma permite generar reportes PDF con el estado de cumplimiento, inventario, brechas, consentimientos y medidas de seguridad implementadas.' },
  { title: 'Derechos ARCO', query: '¿Qué son los derechos ARCO?', category: 'Cumplimiento normativo', content: 'Acceso, Rectificación, Cancelación y Oposición. La Ley 21.719 agrega la Portabilidad. El responsable debe responder en 10 días hábiles, prorrogables por 10 más.' },
  { title: 'Designación del DPD', query: '¿Cómo designar un DPD?', category: 'Cumplimiento normativo', content: 'Debes designar a una persona natural o jurídica con conocimientos especializados, sin conflicto de intereses. Puede ser interno o externo y debe registrarse ante la APDP.' },
  { title: 'Contratos con encargados', query: '¿Qué cláusulas deben tener los contratos?', category: 'Cumplimiento normativo', content: 'Deben definir el objeto, duración, naturaleza de datos, obligaciones del encargado, subcontratación, devolución/eliminación, confidencialidad y responsabilidades ante incumplimiento.' },

  // Uso de la plataforma
  { title: 'Conectar mi base de datos', query: '¿Cómo conectar mi base de datos?', category: 'Uso de la plataforma', content: 'Ve a la sección Bases de Datos, haz clic en "Agregar BD", completa los datos de conexión (host, puerto, usuario, contraseña) y ejecuta el escaneo de seguridad.' },
  { title: 'Servicios de la plataforma', query: '¿Qué servicios ofrece esta plataforma?', category: 'Uso de la plataforma', content: 'La plataforma ofrece escaneo de seguridad, gestión de bases de datos, cumplimiento normativo, gestión de consentimientos, reporte de brechas, derechos ARCO y reportes.' },
  { title: 'Escaneo de dominio', query: '¿Cómo escanear un dominio?', category: 'Uso de la plataforma', content: 'Ingresa el dominio en la sección Escaneo, selecciona el tipo de análisis y la plataforma detectará vulnerabilidades, puertos abiertos, subdominios, certificados SSL y configuraciones DNS.' },
  { title: 'SecureLab Agent', query: '¿Qué es el SecureLab Agent?', category: 'Uso de la plataforma', content: 'Es un agente endpoint que se instala en tus servidores para monitoreo continuo, escaneo local de bases de datos y comunicación cifrada con la plataforma vía WebSocket.' },
  { title: 'Instalar el agente', query: '¿Cómo instalar el agente SecureLab?', category: 'Uso de la plataforma', content: 'Descarga el agente para tu sistema operativo, ejecuta `securelab-agent install` y configura el token de conexión que aparece en la plataforma. El agente se ejecutará como servicio.' },
  { title: 'Gestionar consentimientos', query: '¿Cómo gestionar consentimientos?', category: 'Uso de la plataforma', content: 'Ve a la sección Consentimientos, crea un nuevo consentimiento definiendo finalidad, datos involucrados y versión. Puedes registrar aceptaciones y revocaciones de los titulares.' },
  { title: 'Reportar una brecha', query: '¿Cómo reportar una brecha?', category: 'Uso de la plataforma', content: 'En la sección Brechas crea un nuevo reporte indicando fecha de detección, datos afectados, descripción, medidas correctivas y titulares notificados. La plataforma te ayuda a cumplir el plazo de 72 horas.' },
  { title: 'Generar reportes', query: '¿Cómo generar reportes?', category: 'Uso de la plataforma', content: 'Ve a Reportes, selecciona el tipo (cumplimiento, escaneo, inventario) y el período. La plataforma genera un PDF descargable con los datos y estado actual.' },

  // Brechas de seguridad
  { title: 'Cómo reportar una brecha', query: '¿Cómo reportar una brecha de seguridad?', category: 'Brechas de seguridad', content: 'Para reportar una brecha de seguridad debes identificar el incidente, evaluar el riesgo, notificar a la APDP dentro de las 72 horas en casos graves, y documentar las medidas correctivas.' },
  { title: 'Plazo de notificación', query: '¿En cuánto tiempo debo notificar una brecha?', category: 'Brechas de seguridad', content: 'La APDP debe ser notificada dentro de las 72 horas de conocido el incidente. Los titulares afectados deben ser informados si existe alto riesgo para sus derechos.' },
  { title: 'Contención del incidente', query: '¿Cómo contener una brecha?', category: 'Brechas de seguridad', content: 'Aisla los sistemas afectados, revoca credenciales comprometidas, aplica parches de seguridad, detiene el acceso no autorizado y preserva evidencias para análisis forense.' },
  { title: 'Evaluación de riesgo', query: '¿Cómo evaluar el riesgo de una brecha?', category: 'Brechas de seguridad', content: 'Analiza qué datos fueron comprometidos, número de titulares afectados, sensibilidad de la información, probabilidad de daño y si existe riesgo de discriminación, daño económico o moral.' },
  { title: 'Notificación a titulares', query: '¿Cómo notificar a los titulares afectados?', category: 'Brechas de seguridad', content: 'La notificación debe ser clara, en lenguaje sencillo, describir la brecha, datos afectados, medidas adoptadas y recomendaciones. Debe realizarse por canales directos cuando sea posible.' },
  { title: 'Documentación de brechas', query: '¿Qué documentar de una brecha?', category: 'Brechas de seguridad', content: 'Registra fecha de detección, descripción del incidente, datos afectados, titulares involucrados, medidas de contención, notificaciones realizadas, lecciones aprendidas y acciones correctivas.' },
  { title: 'Plan de respuesta', query: '¿Cómo crear un plan de respuesta a incidentes?', category: 'Brechas de seguridad', content: 'Define roles, procedimientos de detección, contención, erradicación, recuperación, comunicación y notificación. Realiza simulacros periódicos para mantenerlo actualizado.' },
];


const COLLECTIONS = [
  { title: 'Ley 21.719', count: '8 artículos' },
  { title: 'Protección de datos', count: '8 artículos' },
  { title: 'Cumplimiento normativo', count: '8 artículos' },
  { title: 'Uso de la plataforma', count: '8 artículos' },
  { title: 'Brechas de seguridad', count: '7 artículos' },
];


const DEFAULT_BUTTONS = [
  { label: 'Ley 21.719', query: '¿Qué es la Ley 21.719?' },
  { label: 'Datos personales', query: '¿Qué son los datos personales?' },
  { label: 'Brechas', query: '¿Cómo reportar una brecha de seguridad?' },
  { label: 'Conectar BD', query: '¿Cómo conectar mi base de datos?' },
];

const WELCOME_MSG = {
  role: 'bot',
  text: '¡Hola! Soy el **Asistente Virtual de Invisia/SecureLab**.\n\nPuedo ayudarte con la **Ley 21.719** de Protección de Datos Personales de Chile y los servicios de la plataforma.',
};

const OUT_OF_SCOPE_MSG = 'Lo siento, solo puedo ayudarte con temas relacionados a la **Ley 21.719 de Protección de Datos Personales de Chile** y los **servicios de la plataforma Invisia/SecureLab**.';

function simpleMarkdown(text) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);
  text = text.replace(/\\n/g, '\n');
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-[11px] break-all whitespace-pre-wrap">$1</code>');
  html = html.replace(/^[-*] (.+)$/gm, '<div class="flex gap-2 items-start"><span class="text-blue-400 mt-0.5">•</span><span>$1</span></div>');
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function getPageContext(pathname) {
  if (!pathname || pathname === '/') return { page: 'landing', description: 'Página de inicio' };
  if (pathname.startsWith('/dashboard')) return { page: 'dashboard', description: 'Panel principal' };
  if (pathname.startsWith('/compliance')) return { page: 'compliance', description: 'Cumplimiento Normativo' };
  if (pathname.startsWith('/admin')) return { page: 'admin', description: 'Administración' };
  if (pathname.startsWith('/dpo')) return { page: 'dpo', description: 'DPO' };
  if (pathname.startsWith('/arco')) return { page: 'arco', description: 'ARCO' };
  if (pathname.startsWith('/privacy')) return { page: 'privacy', description: 'Privacidad' };
  if (pathname.startsWith('/track')) return { page: 'citizen', description: 'Ciudadano' };
  return { page: 'other', description: 'Plataforma' };
}

function HeaderControls({ minimized, activeCategory, expanded, setMinimized, setExpanded, closeCategory, setOpen, setTab }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); }} title={minimized ? 'Restaurar' : 'Minimizar'} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={minimized ? 'M5 12h14M12 5l7 7-7 7' : 'M20 12H4'}/></svg>
      </button>
      {activeCategory && (
        <button onClick={(e) => { e.stopPropagation(); setExpanded(e => !e); }} title={expanded ? 'Contraer' : 'Expandir'} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? 'M4 14h6v6M20 10h-6V4M14 10l7-7M4 20l7-7' : 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'}/></svg>
        </button>
      )}
      <button onClick={(e) => { e.stopPropagation(); setOpen(false); setTab('home'); }} title="Cerrar" className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-red-500/20 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

function HomeTab({ search, setSearch, handleSend, setTab, filteredArticles }) {
  return (
    <div className="flex-1 overflow-y-auto chat-scroll">
      <div className="relative h-[180px] flex flex-col items-center justify-center text-center p-6 overflow-hidden" style={{ backgroundColor: 'var(--bg-base, #0b0b0f)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex -space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-800 border-2 border-bg-base flex items-center justify-center text-white text-[10px] font-bold">IA</div>
          <div className="w-12 h-12 rounded-full bg-surface-700 border-2 border-bg-base flex items-center justify-center text-white text-[10px] font-bold">DP</div>
          <div className="w-12 h-12 rounded-full bg-blue-900 border-2 border-bg-base flex items-center justify-center text-white text-[10px] font-bold">LG</div>
        </div>
        <h2 className="relative text-2xl font-bold text-white mb-1">Hola 👋</h2>
        <p className="relative text-text-muted text-sm">¿En qué podemos ayudarte?</p>
      </div>
      <div className="p-5 -mt-6 relative z-10">
        <button onClick={() => setTab('messages')} className="w-full py-3.5 px-5 rounded-xl shadow-lg shadow-black/30 border border-border-theme flex items-center justify-between group hover:border-blue-600/50 transition-colors" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
          <span className="text-white font-semibold text-sm">Envíanos un mensaje</span>
          <div className="w-8 h-8 rounded-full bg-blue-800/25 text-blue-400 flex items-center justify-center group-hover:bg-blue-800 group-hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4.394 14.7 13.75 9.3c1-.577 1-2.02 0-2.598L4.394 1.3A1.5 1.5 0 0 0 2.144 2.6v3.438l4.059 1.088c.494.132.494.833 0 .966l-4.06 1.087v4.224a1.5 1.5 0 0 0 2.25 1.299"/></svg>
          </div>
        </button>
      </div>
      <div className="px-5 pb-5">
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ayuda" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-theme text-sm text-white placeholder-text-subtle focus:outline-none focus:border-blue-600/50" style={{ backgroundColor: 'var(--surface-900, #13131a)' }} />
        </div>
        <div className="rounded-2xl border border-border-theme overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
          {filteredArticles.slice(0, 4).map((a, i) => (
            <button key={i} onClick={() => handleSend(a.query)} className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${i !== filteredArticles.length - 1 ? 'border-b border-border-theme' : ''} hover:bg-white/5 transition-colors`}>
              <span className="text-sm text-text-body font-medium">{a.title}</span>
              <svg className="w-4 h-4 text-text-subtle flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M5.428 4.709A.85.85 0 0 1 6.65 3.9L10.352 7.6a.85.85 0 0 1 0 1.2L6.65 12.503a.85.85 0 1 1-1.2-1.2L8.55 8.2 5.45 5.1a.85.85 0 0 1-.022-1.19z"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpTab({ search, setSearch, openCategory }) {
  const filteredCollections = COLLECTIONS.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex-1 overflow-y-auto p-5 chat-scroll">
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-3 w-4 h-4 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en ayuda" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-theme text-sm text-white placeholder-text-subtle focus:outline-none focus:border-blue-600/50" style={{ backgroundColor: 'var(--surface-900, #13131a)' }} />
      </div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">Categorías</h3>
      <div className="rounded-2xl border border-border-theme overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
        {filteredCollections.map((c, i) => (
          <button key={i} onClick={() => openCategory(c.title)} className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${i !== filteredCollections.length - 1 ? 'border-b border-border-theme' : ''} hover:bg-white/5 transition-colors`}>
            <div className="text-left">
              <p className="text-sm text-text-body font-medium">{c.title}</p>
              <p className="text-[11px] text-text-subtle mt-0.5">{c.count}</p>
            </div>
            <svg className="w-4 h-4 text-text-subtle flex-shrink-0" fill="currentColor" viewBox="0 0 16 16"><path d="M5.428 4.709A.85.85 0 0 1 6.65 3.9L10.352 7.6a.85.85 0 0 1 0 1.2L6.65 12.503a.85.85 0 1 1-1.2-1.2L8.55 8.2 5.45 5.1a.85.85 0 0 1-.022-1.19z"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessagesTab({ messages, loading, input, setInput, handleSend, handleKeyDown, inputRef, executePageAction, setMessages, bottomRef }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 chat-scroll">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[84%] min-w-0 break-words overflow-hidden px-4 py-2.5 text-[13px] leading-relaxed ${
                m.role === 'user' ? 'bg-blue-800 text-white rounded-2xl rounded-br-md' : 'border border-border-theme text-text-body rounded-2xl rounded-bl-md shadow-sm'
              }`} style={m.role === 'user' ? {} : { backgroundColor: 'var(--surface-900, #13131a)' }}>
                {m.role === 'bot' ? <div className="assistant-msg" dangerouslySetInnerHTML={{ __html: simpleMarkdown(m.text) }} /> : m.text}
              </div>
            </div>
            {m.role === 'bot' && m.page_actions && i === messages.length - 1 && !loading && (
              <div className="flex flex-wrap gap-2 mt-2">
                {m.page_actions.map((pa, pi) => (
                  <button key={pi} onClick={() => executePageAction(pa)} className="text-[11px] px-3 py-1.5 rounded-full bg-blue-800/20 border border-blue-600/30 text-blue-300 hover:bg-blue-800/30 transition-colors">{pa.label}</button>
                ))}
              </div>
            )}
            {m.role === 'bot' && m.pending_action && i === messages.length - 1 && !loading && (
              <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[12px] text-amber-100/90 mb-2">{m.pending_action.message}</p>
                <div className="flex gap-2">
                  <button onClick={() => executePageAction({ ...m.pending_action, action: m.pending_action.action })} className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25 transition-colors">{m.pending_action.confirm_label || 'Sí'}</button>
                  <button onClick={() => setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, pending_action: null } : msg))} className="text-[11px] px-3 py-1.5 rounded-lg border border-border-theme text-text-muted hover:text-white hover:bg-red-500/10 transition-colors" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>{m.pending_action.reject_label || 'No'}</button>
                </div>
              </div>
            )}
            {m.role === 'bot' && m.quick_actions && !m.page_actions && i === messages.length - 1 && !loading && (
              <div className="flex flex-wrap gap-2 mt-2">
                {m.quick_actions.map((qa, qi) => (
                  <button key={qi} onClick={() => { if (qa.query) handleSend(qa.query); else executePageAction(qa); }} className="text-[11px] px-3 py-1.5 rounded-full border border-border-theme text-text-muted hover:text-white hover:border-blue-600/50 hover:bg-blue-800/20 transition-colors" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>{qa.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="border border-border-theme rounded-2xl rounded-bl-md px-4 py-3 shadow-sm" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-border-theme flex-shrink-0" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
        <div className="flex gap-2 items-end p-1.5 rounded-2xl border border-border-theme focus-within:border-blue-600/50 transition-colors" style={{ backgroundColor: 'var(--bg-base, #0b0b0f)' }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe un mensaje..." disabled={loading} className="flex-1 bg-transparent border-0 text-[13px] text-white px-3 py-2.5 focus:outline-none placeholder-text-subtle disabled:opacity-50" />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="px-4 py-2 rounded-xl text-white text-[12px] font-semibold bg-blue-800 hover:bg-blue-700 disabled:opacity-40 transition-colors">Enviar</button>
        </div>
      </div>
    </>
  );
}

function CategoryBlog({ activeCategory, expanded, setExpanded, closeCategory, handleSend, categoryRef, categoryArticles }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const readingTime = (text) => Math.max(1, Math.round((text || '').split(' ').length / 180));

  if (selectedArticle) {
    return (
      <div ref={categoryRef} className="fixed z-[210] bottom-0 right-0 left-0 top-0 rounded-none md:bottom-6 md:right-6 md:left-auto md:top-auto md:rounded-3xl border border-border-theme shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300 w-full h-full md:w-[var(--cb-w)] md:h-[var(--cb-h)]" style={{ backgroundColor: 'var(--bg-base, #0b0b0f)', '--cb-w': expanded ? '520px' : '380px', '--cb-h': expanded ? '680px' : '600px' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-theme flex-shrink-0" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedArticle(null); }} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Volver
          </button>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }} title={expanded ? 'Contraer' : 'Expandir'} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? 'M4 14h6v6M20 10h-6V4M14 10l7-7M4 20l7-7' : 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'}/></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedArticle(null); closeCategory(); }} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-red-500/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto chat-scroll">
          <div className="relative h-[120px] flex items-end p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(30,58,138,0.25) 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(37,99,235,0.6) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-800/25 border border-blue-600/30 px-2.5 py-1 rounded-full mb-2">{selectedArticle.category}</span>
              <h2 className="text-lg font-bold text-white leading-tight">{selectedArticle.title}</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 text-[11px] text-text-subtle mb-4 pb-4 border-b border-border-theme">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/></svg>
                {readingTime(selectedArticle.content)} min de lectura
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                Guía Invisia
              </span>
            </div>
            <p className="text-[13px] text-text-body leading-relaxed mb-5">{selectedArticle.content}</p>
            <div className="p-4 rounded-2xl bg-blue-800/15 border border-blue-600/20 mb-5">
              <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wide mb-1.5">💡 Punto clave</p>
              <p className="text-[12px] text-text-body leading-relaxed">Recuerda que el cumplimiento de la <strong className="text-white">Ley 21.719</strong> es progresivo: documenta cada paso que implementes y apóyate en las herramientas de la plataforma para automatizar el proceso.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={(e) => { e.stopPropagation(); handleSend(selectedArticle.query); setSelectedArticle(null); closeCategory(); }} className="w-full py-2.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors">Preguntar al asistente sobre esto</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedArticle(null); }} className="w-full py-2.5 rounded-xl border border-border-theme text-text-muted hover:text-white text-[12px] font-medium transition-colors" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>Ver más artículos</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={categoryRef} className="fixed z-[210] bottom-0 right-0 left-0 top-0 rounded-none md:bottom-6 md:right-6 md:left-auto md:top-auto md:rounded-3xl border border-border-theme shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300 w-full h-full md:w-[var(--cb-w)] md:h-[var(--cb-h)]" style={{ backgroundColor: 'var(--bg-base, #0b0b0f)', '--cb-w': expanded ? '520px' : '380px', '--cb-h': expanded ? '680px' : '600px' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-theme flex-shrink-0" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
        <div>
          <p className="text-[15px] font-bold text-white">{activeCategory}</p>
          <p className="text-[11px] text-text-muted">Artículos de ayuda</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }} title={expanded ? 'Contraer' : 'Expandir'} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? 'M4 14h6v6M20 10h-6V4M14 10l7-7M4 20l7-7' : 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'}/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeCategory(); }} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-red-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3 chat-scroll">
        {categoryArticles.map((a, i) => (
          <div key={i} className="p-4 rounded-2xl border border-border-theme" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
            <h4 className="text-sm font-semibold text-white mb-2">{a.title}</h4>
            <p className="text-[12px] text-text-body leading-relaxed mb-3">{a.content.length > 140 ? a.content.slice(0, 140) + '…' : a.content}</p>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSelectedArticle(a); }} className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white transition-colors">Ver blog</button>
              <button onClick={(e) => { e.stopPropagation(); handleSend(a.query); closeCategory(); }} className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-800/20 border border-blue-600/30 text-blue-300 hover:bg-blue-800/30 transition-colors">Preguntar al asistente</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupportChat() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('home');
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => { if (open && tab === 'messages') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open, tab, loading]);
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (!chatRef.current) return;
      if (chatRef.current.contains(e.target)) return;
      if (categoryRef.current && categoryRef.current.contains(e.target)) return;
      setOpen(false); setTab('home'); setExpanded(false); setMinimized(false); setActiveCategory(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const executePageAction = useCallback((action) => {
    if (!action) return;
    switch (action.action || action.type) {
      case 'navigate': navigate(action.value); break;
      case 'click_nav': window.dispatchEvent(new CustomEvent('chat-nav-click', { detail: { nav: action.value } })); break;
      case 'scroll_to': try { document.querySelector(action.value)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} break;
      case 'focus_form': try { const form = document.getElementById(action.value) || document.querySelector(`[data-form="${action.value}"]`); if (form) { form.scrollIntoView({ behavior: 'smooth', block: 'center' }); const firstInput = form.querySelector('input, textarea, select'); if (firstInput) setTimeout(() => firstInput.focus(), 500); } } catch {} break;
      case 'show_phone': setMessages(prev => [...prev, { role: 'bot', text: `Teléfono: ${action.value}` }]); break;
      case 'show_email': setMessages(prev => [...prev, { role: 'bot', text: `Email: ${action.value}` }]); break;
      case 'create_consent': navigate('/compliance/consents/new'); break;
      case 'report_breach': navigate('/compliance/breaches/new'); break;
      case 'scan_domain': navigate('/scan?domain=' + encodeURIComponent(action.params?.domain || '')); break;
      case 'scan_database': navigate('/databases'); break;
      case 'connect_database': navigate('/databases/new'); break;
      case 'generate_report': navigate('/reports'); break;
      case 'generate_document': navigate('/reports?section=documents&template=' + encodeURIComponent(action.value || 'compliance_ley21719')); break;
      case 'open_ticket': navigate('/support/tickets/new'); break;
      case 'enable_2fa': navigate('/settings/security'); break;
      default: break;
    }
  }, [navigate]);

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    setTab('messages');
    const pageCtx = getPageContext(location.pathname);
    try {
      const result = await api.assistantAsk(text, token, null, JSON.stringify(pageCtx));
      if (result && result.answer) {
        const botMsg = { role: 'bot', text: result.answer, confidence: result.confidence, category: result.category, source: result.source, quick_actions: result.quick_actions || DEFAULT_BUTTONS, page_actions: result.page_actions || null, pending_action: result.pending_action || null };
        if (result.source === 'out_of_scope') { botMsg.text = OUT_OF_SCOPE_MSG; botMsg.quick_actions = DEFAULT_BUTTONS; botMsg.page_actions = null; botMsg.pending_action = null; }
        setMessages(prev => [...prev, botMsg]);
      } else if (result && result.error) {
        setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${result.error}`, quick_actions: DEFAULT_BUTTONS }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Lo siento, no pude procesar tu consulta.', quick_actions: DEFAULT_BUTTONS }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Error de conexión.', quick_actions: DEFAULT_BUTTONS }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, token, location.pathname]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const openCategory = (title) => { setActiveCategory(title); setExpanded(true); };
  const closeCategory = () => { setExpanded(false); setTimeout(() => setActiveCategory(null), 200); };

  const filteredArticles = ARTICLES.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));
  const categoryArticles = activeCategory ? ARTICLES.filter(a => a.category === activeCategory) : [];

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); setTab('home'); }} className="fixed z-[200] bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-800 hover:bg-blue-700 text-white shadow-2xl shadow-blue-800/40 transition-all hover:scale-105 flex items-center justify-center" title="Abrir asistente">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg-base">{unread}</span>}
      </button>
    );
  }

  if (minimized) {
    return (
      <div ref={chatRef} onClick={() => setMinimized(false)} className="fixed z-[200] bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 rounded-full border border-border-theme shadow-xl cursor-pointer flex items-center gap-3" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
        <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white text-[10px] font-bold">IA</div>
        <span className="text-sm font-medium text-white">Asistente Invisia</span>
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); setTab('home'); setExpanded(false); setActiveCategory(null); }} className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-red-500/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    );
  }

  return (
    <>
      {activeCategory && <CategoryBlog activeCategory={activeCategory} expanded={expanded} setExpanded={setExpanded} closeCategory={closeCategory} handleSend={handleSend} categoryRef={categoryRef} categoryArticles={categoryArticles} />}
      <div ref={chatRef} className="fixed z-[200] bottom-0 right-0 left-0 top-0 w-full h-full rounded-none md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-[380px] md:h-[600px] md:rounded-3xl border border-border-theme shadow-2xl shadow-black/40 flex flex-col overflow-hidden transition-all" style={{ backgroundColor: 'var(--bg-base, #0b0b0f)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-theme flex-shrink-0" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
          <div>
            <p className="text-[15px] font-bold text-white tracking-tight">Asistente Invisia</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <p className="text-[11px] text-text-muted">En línea</p>
            </div>
          </div>
          <HeaderControls minimized={minimized} activeCategory={activeCategory} expanded={expanded} setMinimized={setMinimized} setExpanded={setExpanded} closeCategory={closeCategory} setOpen={setOpen} setTab={setTab} />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {tab === 'home' && <HomeTab search={search} setSearch={setSearch} handleSend={handleSend} setTab={setTab} filteredArticles={filteredArticles} />}
          {tab === 'help' && <HelpTab search={search} setSearch={setSearch} openCategory={openCategory} />}
          {tab === 'messages' && <MessagesTab messages={messages} loading={loading} input={input} setInput={setInput} handleSend={handleSend} handleKeyDown={handleKeyDown} inputRef={inputRef} executePageAction={executePageAction} setMessages={setMessages} bottomRef={bottomRef} />}
        </div>
        <div className="flex items-center justify-around px-2 py-2 border-t border-border-theme flex-shrink-0" style={{ backgroundColor: 'var(--surface-900, #13131a)' }}>
          <button onClick={() => setTab('home')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${tab === 'home' ? 'text-blue-400 bg-blue-800/15' : 'text-text-subtle hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span className="text-[10px] font-medium">Inicio</span>
          </button>
          <button onClick={() => setTab('help')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${tab === 'help' ? 'text-blue-400 bg-blue-800/15' : 'text-text-subtle hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><path strokeLinecap="round" strokeWidth={1.8} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
            <span className="text-[10px] font-medium">Ayuda</span>
          </button>
          <button onClick={() => setTab('messages')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${tab === 'messages' ? 'text-blue-400 bg-blue-800/15' : 'text-text-subtle hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
            <span className="text-[10px] font-medium">Mensajes</span>
          </button>
        </div>
      </div>
    </>
  );
}
