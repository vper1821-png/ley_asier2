import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'data', 'securelab_assistant.db');

let db;

export function getDB() {
  if (db) return db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema();
  seedDictionary();
  seedKnowledge();
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT,
      confidence REAL DEFAULT 1.0,
      enabled INTEGER DEFAULT 1,
      source TEXT DEFAULT 'seed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      access_count INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS learning_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT,
      category TEXT,
      confidence REAL,
      source TEXT,
      user_feedback INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      keyword TEXT NOT NULL,
      synonym_group TEXT,
      weight REAL DEFAULT 1.0
    );
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT DEFAULT 'Nueva conversación',
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      category TEXT,
      confidence REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ticket_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL CHECK (role IN ('user','agent','system')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_question ON knowledge(question);
    CREATE INDEX IF NOT EXISTS idx_dictionary_category ON dictionary(category);
    CREATE INDEX IF NOT EXISTS idx_learning_log_question ON learning_log(question);
  `);
}

const CATEGORIES = [
  { name: 'ley_21719', description: 'Ley 21.719 de Protección de Datos Personales de Chile' },
  { name: 'proteccion_datos', description: 'Protección de datos personales en general' },
  { name: 'consentimiento', description: 'Consentimiento del titular de datos' },
  { name: 'derechos_arco', description: 'Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)' },
  { name: 'brechas', description: 'Brechas de seguridad y notificación' },
  { name: 'dpd', description: 'Delegado de Protección de Datos (DPD/DPO)' },
  { name: 'apdp', description: 'Agencia de Protección de Datos Personales' },
  { name: 'sanciones', description: 'Sanciones y multas por incumplimiento' },
  { name: 'inventario_datos', description: 'Inventario de datos personales' },
  { name: 'transferencia', description: 'Transferencia internacional de datos' },
  { name: 'seguridad', description: 'Seguridad de la información' },
  { name: 'escaneo', description: 'Escaneo y análisis de dominios' },
  { name: 'plataforma', description: 'Funcionalidades de la plataforma' },
  { name: 'saludo', description: 'Saludos y bienvenida' },
  { name: 'soporte', description: 'Soporte, ayuda y contacto' },
  { name: 'incidentes', description: 'Gestión de incidentes y plan de respuesta' },
  { name: 'general', description: 'Preguntas generales' },
];

function seedDictionary() {
  const insert = db.prepare('INSERT OR IGNORE INTO dictionary (category, keyword, synonym_group, weight) VALUES (?, ?, ?, ?)');

  const entries = [
    // --- Ley 21.719 ---
    ['ley_21719', 'ley 21719', 'normativa', 1.0],
    ['ley_21719', 'ley 21.719', 'normativa', 1.0],
    ['ley_21719', 'ley de proteccion de datos', 'normativa', 0.9],
    ['ley_21719', 'ley chile datos', 'normativa', 0.9],
    ['ley_21719', 'nueva ley', 'normativa', 0.8],
    ['ley_21719', 'normativa chilena', 'normativa', 0.8],
    ['ley_21719', 'reglamento', 'normativa', 0.7],
    ['ley_21719', 'datos personales chile', 'normativa', 0.9],
    ['ley_21719', 'proteccion datos chile', 'normativa', 0.9],
    ['ley_21719', 'ley 19628', 'normativa', 0.7],
    ['ley_21719', 'legislacion', 'normativa', 0.6],
    ['ley_21719', 'ambito aplicacion', 'normativa', 0.9],
    ['ley_21719', 'ambito', 'normativa', 0.7],
    ['ley_21719', 'alcance', 'normativa', 0.7],
    ['ley_21719', 'a quien aplica', 'normativa', 0.8],

    // --- Protección de Datos ---
    ['proteccion_datos', 'proteccion de datos', 'proteccion', 1.0],
    ['proteccion_datos', 'datos personales', 'proteccion', 1.0],
    ['proteccion_datos', 'privacidad', 'proteccion', 0.8],
    ['proteccion_datos', 'informacion personal', 'proteccion', 0.9],
    ['proteccion_datos', 'datos sensibles', 'proteccion', 0.9],
    ['proteccion_datos', 'datos privados', 'proteccion', 0.8],
    ['proteccion_datos', 'informacion privada', 'proteccion', 0.7],
    ['proteccion_datos', 'tratamiento de datos', 'proteccion', 0.9],
    ['proteccion_datos', 'procesamiento datos', 'proteccion', 0.8],
    ['proteccion_datos', 'datos', 'proteccion_general', 0.3],
    ['proteccion_datos', 'informacion', 'proteccion_general', 0.2],

    // --- Consentimiento ---
    ['consentimiento', 'consentimiento', 'consent', 1.0],
    ['consentimiento', 'autorizacion', 'consent', 0.9],
    ['consentimiento', 'permiso', 'consent', 0.8],
    ['consentimiento', 'aceptacion', 'consent', 0.7],
    ['consentimiento', 'autorizar', 'consent', 0.8],
    ['consentimiento', 'consentir', 'consent', 0.9],
    ['consentimiento', 'revocar', 'consent', 0.9],
    ['consentimiento', 'revocacion', 'consent', 0.8],
    ['consentimiento', 'terminos y condiciones', 'consent', 0.6],
    ['consentimiento', 'aviso de privacidad', 'consent', 0.7],
    ['consentimiento', 'politica de privacidad', 'consent', 0.7],

    // --- Derechos ARCO ---
    ['derechos_arco', 'derechos arco', 'arco', 1.0],
    ['derechos_arco', 'arco', 'arco', 0.9],
    ['derechos_arco', 'acceso a datos', 'arco', 0.9],
    ['derechos_arco', 'rectificacion', 'arco', 0.9],
    ['derechos_arco', 'cancelacion', 'arco', 0.9],
    ['derechos_arco', 'oposicion', 'arco', 0.9],
    ['derechos_arco', 'portabilidad', 'arco', 0.9],
    ['derechos_arco', 'derecho de acceso', 'arco', 0.8],
    ['derechos_arco', 'derecho a saber', 'arco', 0.7],
    ['derechos_arco', 'derecho a eliminar', 'arco', 0.8],
    ['derechos_arco', 'derecho a rectificar', 'arco', 0.8],
    ['derechos_arco', 'derecho a oponerse', 'arco', 0.8],
    ['derechos_arco', 'derecho a portar', 'arco', 0.8],
    ['derechos_arco', 'derechos del titular', 'arco', 0.7],
    ['derechos_arco', 'tus derechos', 'arco', 0.6],

    // --- Brechas ---
    ['brechas', 'brecha de seguridad', 'breach', 1.0],
    ['brechas', 'brecha', 'breach', 0.9],
    ['brechas', 'filtracion', 'breach', 0.9],
    ['brechas', 'fuga de datos', 'breach', 0.9],
    ['brechas', 'vulneracion', 'breach', 0.8],
    ['brechas', 'incidente de seguridad', 'breach', 0.9],
    ['brechas', 'notificar brecha', 'breach', 0.8],
    ['brechas', 'reportar brecha', 'breach', 0.8],
    ['brechas', 'violacion datos', 'breach', 0.8],
    ['brechas', 'hackeo', 'breach', 0.7],
    ['brechas', 'ciberataque', 'breach', 0.6],
    ['brechas', 'intrusion', 'breach', 0.6],

    // --- DPD ---
    ['dpd', 'dpd', 'dpd', 1.0],
    ['dpd', 'delegado proteccion datos', 'dpd', 1.0],
    ['dpd', 'delegado', 'dpd', 0.9],
    ['dpd', 'dpo', 'dpd', 0.9],
    ['dpd', 'encargado datos', 'dpd', 0.8],
    ['dpd', 'oficial proteccion', 'dpd', 0.8],
    ['dpd', 'responsable datos', 'dpd', 0.7],

    // --- APDP ---
    ['apdp', 'agencia proteccion datos', 'apdp', 1.0],
    ['apdp', 'apdp', 'apdp', 1.0],
    ['apdp', 'registro apdp', 'apdp', 0.9],
    ['apdp', 'inscripcion apdp', 'apdp', 0.8],
    ['apdp', 'registro agencia', 'apdp', 0.8],
    ['apdp', 'autoridad datos', 'apdp', 0.7],
    ['apdp', 'superintendencia datos', 'apdp', 0.7],

    // --- Sanciones ---
    ['sanciones', 'sancion', 'sanction', 1.0],
    ['sanciones', 'multa', 'sanction', 1.0],
    ['sanciones', 'penalizacion', 'sanction', 0.8],
    ['sanciones', 'castigo', 'sanction', 0.7],
    ['sanciones', 'infraccion', 'sanction', 0.8],
    ['sanciones', 'incumplimiento', 'sanction', 0.8],
    ['sanciones', 'utm', 'sanction', 0.7],
    ['sanciones', 'que pasa si no cumplo', 'sanction', 0.7],

    // --- Inventario de Datos ---
    ['inventario_datos', 'inventario datos', 'inventory', 1.0],
    ['inventario_datos', 'registro datos', 'inventory', 0.8],
    ['inventario_datos', 'mapeo datos', 'inventory', 0.8],
    ['inventario_datos', 'catalogo datos', 'inventory', 0.7],
    ['inventario_datos', 'que datos tengo', 'inventory', 0.7],
    ['inventario_datos', 'clasificacion datos', 'inventory', 0.8],
    ['inventario_datos', 'inventario', 'inventory', 0.5],

    // --- Transferencia Internacional ---
    ['transferencia', 'transferencia internacional', 'transfer', 1.0],
    ['transferencia', 'datos al extranjero', 'transfer', 0.9],
    ['transferencia', 'datos fuera de chile', 'transfer', 0.9],
    ['transferencia', 'flujo transfronterizo', 'transfer', 0.9],
    ['transferencia', 'exportar datos', 'transfer', 0.7],
    ['transferencia', 'paises adecuados', 'transfer', 0.8],

    // --- Seguridad ---
    ['seguridad', 'waf', 'security', 0.9],
    ['seguridad', 'web application firewall', 'security', 0.9],
    ['seguridad', 'firewall aplicacion web', 'security', 0.9],
    ['seguridad', 'filtrado web', 'security', 0.7],
    ['seguridad', 'proteccion web', 'security', 0.7],
    ['seguridad', 'firewall', 'security', 0.6],
    ['seguridad', 'seguridad datos', 'security', 0.9],
    ['seguridad', 'medidas seguridad', 'security', 1.0],
    ['seguridad', 'proteger datos', 'security', 0.8],
    ['seguridad', 'encriptacion', 'security', 0.8],
    ['seguridad', 'cifrado', 'security', 0.8],
    ['seguridad', 'firewall', 'security', 0.6],
    ['seguridad', 'antivirus', 'security', 0.5],
    ['seguridad', 'autenticacion', 'security', 0.7],
    ['seguridad', 'control acceso', 'security', 0.8],
    ['seguridad', 'backup', 'security', 0.7],
    ['seguridad', 'respaldo', 'security', 0.7],
    ['seguridad', 'riesgo', 'security', 0.5],

    // --- Escaneo ---
    ['escaneo', 'escanear', 'scan', 1.0],
    ['escaneo', 'escaneo', 'scan', 1.0],
    ['escaneo', 'analisis dominio', 'scan', 0.9],
    ['escaneo', 'scan', 'scan', 0.9],
    ['escaneo', 'vulnerabilidad', 'scan', 0.8],
    ['escaneo', 'puertos', 'scan', 0.7],
    ['escaneo', 'subdominios', 'scan', 0.8],
    ['escaneo', 'ssl', 'scan', 0.7],
    ['escaneo', 'dns', 'scan', 0.6],
    ['escaneo', 'sql injection', 'scan', 0.8],
    ['escaneo', 'xss', 'scan', 0.8],
    ['escaneo', 'ciberseguridad', 'scan', 0.5],

    // --- Incidentes ---
    ['incidentes', 'plan de respuesta', 'incident', 1.0],
    ['incidentes', 'plan respuesta incidentes', 'incident', 1.0],
    ['incidentes', 'plan de contingencia', 'incident', 0.9],
    ['incidentes', 'gestion de incidentes', 'incident', 1.0],
    ['incidentes', 'incidente de seguridad', 'incident', 1.0],
    ['incidentes', 'incidente', 'incident', 0.9],
    ['incidentes', 'respuesta a incidentes', 'incident', 1.0],
    ['incidentes', 'equipo respuesta', 'incident', 0.8],
    ['incidentes', 'csirt', 'incident', 0.8],
    ['incidentes', 'computer security incident', 'incident', 0.7],
    ['incidentes', 'protocolo incidentes', 'incident', 0.9],
    ['incidentes', 'procedimiento incidentes', 'incident', 0.9],
    ['incidentes', 'manejo de crisis', 'incident', 0.7],
    ['incidentes', 'simulacro', 'incident', 0.7],
    ['incidentes', 'notificacion 72 horas', 'incident', 0.9],

    // --- Plataforma ---
    ['plataforma', 'plataforma', 'platform', 0.8],
    ['plataforma', 'invisia', 'platform', 0.9],
    ['plataforma', 'securelab', 'platform', 0.9],
    ['plataforma', 'como usar', 'platform', 0.7],
    ['plataforma', 'funcionamiento', 'platform', 0.6],
    ['plataforma', 'panel', 'platform', 0.5],
    ['plataforma', 'dashboard', 'platform', 0.6],
    ['plataforma', 'reporte', 'platform', 0.7],
    ['plataforma', 'informe', 'platform', 0.7],
    ['plataforma', 'configurar', 'platform', 0.5],
    ['plataforma', 'ajustes', 'platform', 0.5],

    // --- Sitio / Página ---
    ['plataforma', 'este sitio', 'site', 0.9],
    ['plataforma', 'esta pagina', 'site', 0.9],
    ['plataforma', 'esta web', 'site', 0.8],
    ['plataforma', 'este proyecto', 'site', 0.8],
    ['plataforma', 'esta aplicacion', 'site', 0.8],
    ['plataforma', 'domain scanner', 'site', 0.9],
    ['plataforma', 'dominio escaner', 'site', 0.8],
    ['plataforma', 'wenotlock', 'site', 0.9],
    ['plataforma', 'invisia compliance', 'site', 0.9],
    ['plataforma', 'que hace esta pagina', 'site', 0.9],
    ['plataforma', 'de que trata', 'site', 0.8],
    ['plataforma', 'proposito', 'site', 0.7],
    ['plataforma', 'objetivo', 'site', 0.7],
    ['plataforma', 'funcionalidad', 'site', 0.6],


    [catId('seguridad'),
      '¿Qué es un WAF y cómo ayuda a cumplir la Ley 21.719?',
      `Un WAF (Web Application Firewall) es una barrera de seguridad que filtra y monitorea el tráfico HTTP/HTTPS entre una aplicación web e Internet. Según la Ley 21.719, los responsables del tratamiento de datos personales deben implementar medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos personales (principio de seguridad). Un WAF contribuye directamente a este cumplimiento al detectar y bloquear ataques como inyecciones SQL, cross-site scripting (XSS), ejecución remota de código y otros vectores OWASP Top 10 que podrían comprometer datos personales.

Puedo generar un **documento de cumplimiento** que relacione la implementación del WAF con los artículos de la Ley 21.719 y las medidas de seguridad requeridas.`,
      'waf,firewall aplicacion web,ley 21719,seguridad web,proteccion datos,cumplimiento'],

    [catId('incidentes'),
      '¿Cómo debe ser el plan de respuesta a incidentes según la Ley 21.719?',
      `La Ley 21.719 exige que los responsables del tratamiento implementen medidas de seguridad y notifiquen brechas a la APDP dentro de las 72 horas. Un plan de respuesta a incidentes eficaz debe incluir: 1) **Preparación**: designar roles (CSIRT, DPD, legal, comunicaciones), inventario de activos y canales de escalamiento; 2) **Detección y análisis**: monitoreo, logs, clasificación de severidad; 3) **Contención, erradicación y recuperación**: aislamiento, eliminación de la amenaza y restauración con backups; 4) **Notificación**: APDP en 72 horas y titulares si hay alto riesgo; 5) **Post-incidente**: análisis de lecciones aprendidas, actualización del plan y simulacros.

Puedo generar un **documento con la estructura completa del plan de respuesta a incidentes** alineado a la Ley 21.719, incluyendo matrices de roles, plantillas de notificación y checklist de 72 horas.`,
      'plan respuesta incidentes,plan contingencia,ley 21719,apdp,72 horas,notificacion brecha'],

    [catId('incidentes'),
      '¿Cómo gestionar un incidente de seguridad según la Ley 21.719?',
      `La gestión de incidentes de seguridad bajo la Ley 21.719 debe considerar: 1) **Identificación**: confirmar si hay compromiso de datos personales; 2) **Registro**: documentar fecha, hora, sistemas afectados, tipos de datos y posibles titulares expuestos; 3) **Evaluación de riesgo**: determinar si existe riesgo para los derechos de los titulares; 4) **Notificación a APDP**: dentro de 72 horas de conocido el incidente; 5) **Notificación a titulares**: cuando el riesgo sea alto; 6) **Medidas correctivas**: cierre de la brecha, cambio de credenciales, análisis forense; 7) **Archivo probatorio**: conservar evidencia por posibles fiscalizaciones.

Puedo generar un **documento de gestión de incidentes** con las obligaciones de la Ley 21.719, flujo de trabajo y formatos para notificación.`,
      'incidente seguridad,gestion incidentes,brecha datos,notificar apdp,ley 21719,datos personales'],

    // --- Saludo ---
    ['saludo', 'hola', 'greeting', 1.0],
    ['saludo', 'buenos dias', 'greeting', 1.0],
    ['saludo', 'buenas tardes', 'greeting', 1.0],
    ['saludo', 'buenas noches', 'greeting', 1.0],
    ['saludo', 'hey', 'greeting', 0.8],
    ['saludo', 'oye', 'greeting', 0.7],
    ['saludo', 'que tal', 'greeting', 0.8],
    ['saludo', 'como estas', 'greeting', 0.9],
    ['saludo', 'saludos', 'greeting', 0.9],
    ['saludo', 'bienvenido', 'greeting', 0.7],
    ['saludo', 'gracias', 'greeting', 0.5],

    // --- Soporte / Ayuda ---
    ['soporte', 'ayuda', 'support', 1.0],
    ['soporte', 'soporte', 'support', 1.0],
    ['soporte', 'contacto', 'support', 0.9],
    ['soporte', 'telefono', 'support', 0.9],
    ['soporte', 'email', 'support', 0.8],
    ['soporte', 'correo', 'support', 0.8],
    ['soporte', 'whatsapp', 'support', 0.7],
    ['soporte', 'asistencia', 'support', 0.9],
    ['soporte', 'ayudar', 'support', 0.8],
    ['soporte', 'necesito ayuda', 'support', 0.9],
    ['soporte', 'contactar', 'support', 0.8],
    ['soporte', 'hablar humano', 'support', 0.7],
    ['soporte', 'atencion cliente', 'support', 0.8],
    ['soporte', 'conectar base datos', 'support', 0.9],
    ['soporte', 'conexion db', 'support', 0.8],
    ['soporte', 'conectar database', 'support', 0.9],
    ['soporte', 'base de datos', 'support', 0.7],
    ['soporte', 'guiar', 'support', 0.6],
    ['soporte', 'paso a paso', 'support', 0.7],
    ['soporte', 'tutorial', 'support', 0.7],
    ['soporte', 'como hago', 'support', 0.7],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });
  insertMany(entries);

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  const insertCats = db.transaction((cats) => {
    for (const c of cats) insertCat.run(c.name, c.description);
  });
  insertCats(CATEGORIES);
}

function seedKnowledge() {
  migrateKnowledge();

  const count = db.prepare('SELECT COUNT(*) as c FROM knowledge').get();
  if (count.c > 0) return;

  const catId = (name) => {
    const r = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    return r ? r.id : null;
  };

  const insert = db.prepare(`INSERT INTO knowledge (category_id, question, answer, keywords, source) VALUES (?, ?, ?, ?, 'seed')`);

  const seedData = [
    // --- Ley 21.719 ---
    [catId('ley_21719'),
      '¿Qué es la Ley 21.719?',
      'La Ley 21.719 es la nueva Ley de Protección de Datos Personales de Chile, publicada en 2024. Reemplaza la antigua Ley 19.628 y establece un marco normativo moderno que regula el tratamiento de datos personales, crea la Agencia de Protección de Datos Personales (APDP), exige el consentimiento del titular, establece los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición), y contempla sanciones significativas por incumplimiento de hasta 20.000 UTM.',
      'ley 21719,proteccion datos,chile,normativa'],

    [catId('ley_21719'),
      '¿A quiénes aplica la Ley 21.719?',
      'La Ley 21.719 aplica a todas las personas naturales o jurídicas, públicas o privadas, que realicen tratamiento de datos personales en Chile. También aplica a entidades extranjeras que traten datos de titulares que se encuentren en Chile, independientemente de dónde esté establecido el responsable del tratamiento.',
      'aplica,alcance,quienes,obligados'],

    [catId('ley_21719'),
      '¿Cuándo entra en vigencia la Ley 21.719?',
      'La Ley 21.719 fue publicada en el Diario Oficial en 2024 y establece un período de vacancia legal de 24 meses para que las empresas y organizaciones se adapten a los nuevos requisitos. Esto significa que las obligaciones comenzarán a ser exigibles aproximadamente en 2026. Sin embargo, se recomienda iniciar el proceso de adecuación cuanto antes debido a la complejidad de los cambios requeridos.',
      'vigencia,cuando entra,plazo,adaptacion'],

    [catId('ley_21719'),
      '¿Qué principios establece la Ley 21.719?',
      'La Ley 21.719 establece los siguientes principios fundamentales: 1) Licitud del tratamiento, 2) Finalidad, 3) Proporcionalidad, 4) Calidad de los datos, 5) Responsabilidad proactiva (accountability), 6) Seguridad de los datos, 7) Transparencia e información, 8) Minimización de datos, y 9) Confidencialidad. Cada responsable debe demostrar el cumplimiento de estos principios.',
      'principios,fundamentos,bases,licitud,finalidad,proporcionalidad'],

    [catId('ley_21719'),
      '¿Cuál es la diferencia entre la Ley 19.628 y la Ley 21.719?',
      'La Ley 21.719 introduce cambios significativos respecto a la Ley 19.628: 1) Crea la Agencia de Protección de Datos Personales (APDP) como ente fiscalizador, 2) Exige consentimiento explícito e informado, 3) Establece sanciones reales (hasta 20.000 UTM), 4) Introduce el principio de responsabilidad proactiva, 5) Exige designar un DPD/DPO, 6) Regula las transferencias internacionales, 7) Establece la obligación de notificar brechas, y 8) Reconoce la portabilidad de datos.',
      'diferencia,comparacion,19.628,19628,cambios,nueva'],

    // --- Protección de Datos ---
    [catId('proteccion_datos'),
      '¿Qué son los datos personales?',
      'Datos personales son cualquier información relativa a una persona natural identificada o identificable. Esto incluye nombre, RUT, dirección, email, teléfono, datos de salud, origen étnico, opiniones políticas, creencias religiosas, datos biométricos, geolocalización, dirección IP, y cualquier otra información que permita identificar directa o indirectamente a una persona.',
      'que son,definicion,datos personales,informacion'],

    [catId('proteccion_datos'),
      '¿Qué son los datos sensibles?',
      'Los datos sensibles son una categoría especial de datos personales que requieren mayor protección por su naturaleza. Incluyen: origen racial o étnico, creencias religiosas o filosóficas, opiniones políticas, datos de salud, datos biométricos, datos genéticos, vida sexual, y datos de niños, niñas y adolescentes. Su tratamiento está prohibido salvo en casos excepcionales establecidos por la ley (consentimiento explícito, interés vital, etc.).',
      'sensibles,especiales,categoria,proteccion especial,riesgo'],

    [catId('proteccion_datos'),
      '¿Qué obligaciones tiene mi empresa con la Ley 21.719?',
      'Tu empresa debe: 1) Realizar un inventario de datos personales, 2) Obtener consentimiento informado de los titulares, 3) Designar un DPD (Delegado de Protección de Datos), 4) Registrar tus actividades de tratamiento ante la APDP, 5) Implementar medidas de seguridad técnicas y organizativas, 6) Atender solicitudes de derechos ARCO, 7) Notificar brechas de seguridad, 8) Establecer contratos con encargados de tratamiento, 9) Mantener registros de las actividades de tratamiento, y 10) Realizar evaluaciones de impacto cuando corresponda.',
      'obligaciones,deberes,requisitos,que hacer,implementar'],

    // --- Consentimiento ---
    [catId('consentimiento'),
      '¿Cómo debe ser el consentimiento según la Ley 21.719?',
      'El consentimiento debe ser: 1) Libre (sin coerción), 2) Específico (para finalidades determinadas), 3) Informado (conocer el tratamiento), 4) Inequívoco (manifestación clara), y 5) Revocable (el titular puede retirarlo en cualquier momento). Debe solicitarse de forma separada y comprensible, no mediante cláusulas genéricas en contratos. Para datos sensibles, el consentimiento debe ser explícito y por escrito.',
      'como debe ser,requisitos consentimiento,valido,libre,especifico,informado'],

    [catId('consentimiento'),
      '¿Se puede revocar el consentimiento?',
      'Sí, el titular tiene derecho a revocar su consentimiento en cualquier momento, sin expresión de causa. La revocación debe ser tan fácil como otorgar el consentimiento. El responsable debe cesar el tratamiento de los datos del titular en un plazo razonable una vez recibida la revocación. La revocación no afecta la licitud del tratamiento previo a ella.',
      'revocar,retirar,cancelar permiso,anular'],

    // --- Derechos ARCO ---
    [catId('derechos_arco'),
      '¿Qué son los derechos ARCO?',
      'Los derechos ARCO son: Acceso (conocer qué datos tuyos están siendo tratados), Rectificación (solicitar corrección de datos incorrectos), Cancelación (solicitar eliminación de tus datos), y Oposición (oponerte al tratamiento de tus datos para ciertas finalidades). La Ley 21.719 también agrega la Portabilidad (recibir tus datos en formato estructurado). El responsable debe responder estas solicitudes en un plazo máximo de 10 días hábiles, prorrogable por 10 días adicionales.',
      'arco,acceso,rectificacion,cancelacion,oposicion,portabilidad,derechos'],

    [catId('derechos_arco'),
      '¿Cómo ejerzo mis derechos ARCO?',
      'Para ejercer tus derechos ARCO debes presentar una solicitud formal al responsable del tratamiento (la empresa u organización que trata tus datos). La solicitud debe ser gratuita y el responsable debe responder en un plazo máximo de 10 días hábiles, prorrogables por 10 días adicionales justificados. Si no recibes respuesta o esta es insatisfactoria, puedes recurrir a la Agencia de Protección de Datos Personales (APDP).',
      'ejercer,solicitar,como hacer,procedimiento,reclamar'],

    // --- Brechas ---
    [catId('brechas'),
      '¿Qué debo hacer ante una brecha de seguridad?',
      'Ante una brecha de seguridad debes: 1) Contener inmediatamente la brecha (aislar sistemas afectados), 2) Evaluar el alcance (qué datos fueron comprometidos, cuántos titulares afectados), 3) Notificar a la APDP dentro de las 72 horas siguientes, 4) Notificar a los titulares afectados si la brecha implica un alto riesgo para sus derechos, 5) Documentar la brecha y las medidas adoptadas, 6) Implementar medidas correctivas para evitar futuras brechas. El incumplimiento de la notificación puede agravar las sanciones.',
      'brecha seguridad,procedimiento,que hacer,notificar,reportar'],

    [catId('brechas'),
      '¿Cuándo debo notificar una brecha a la APDP?',
      'Debes notificar a la APDP cualquier brecha de seguridad que pueda afectar los derechos y libertades de los titulares, especialmente cuando: 1) Involucre datos sensibles, 2) Involucre datos de niños, 3) Afecte a un número significativo de titulares, 4) Pueda generar discriminación, daño económico o moral, o 5) Exista riesgo de uso fraudulento. La notificación debe realizarse dentro de las 72 horas de conocido el incidente.',
      'cuando notificar,plazo,72 horas,apdp,obligacion reportar'],

    // --- DPD ---
    [catId('dpd'),
      '¿Es obligatorio tener un DPD?',
      'Sí, la Ley 21.719 exige que toda organización que trate datos personales designe un Delegado de Protección de Datos (DPD) o DPO. El DPD puede ser interno o externo, pero debe contar con conocimientos especializados en protección de datos. Sus funciones incluyen informar al responsable sobre sus obligaciones, supervisar el cumplimiento normativo, atender solicitudes de titulares, y cooperar con la APDP.',
      'obligatorio,necesario,delegado,dpo,designar'],

    [catId('dpd'),
      '¿Quién puede ser DPD?',
      'Puede ser DPD cualquier persona natural o jurídica con conocimientos especializados en protección de datos personales. Puede ser un empleado de la organización (interno) o un consultor externo contratado para tal efecto. No debe existir conflicto de intereses con sus funciones. La APDP mantendrá un registro público de DPD. Se recomienda que el DPD tenga formación en derecho, tecnología, o seguridad de la información.',
      'quien puede,requisitos,perfil,interno,externo'],

    // --- APDP ---
    [catId('apdp'),
      '¿Qué es la APDP?',
      'La APDP (Agencia de Protección de Datos Personales) es el organismo público creado por la Ley 21.719 para fiscalizar y garantizar el cumplimiento de la normativa de protección de datos en Chile. Sus funciones incluyen: interpretar la ley, resolver reclamos de titulares, imponer sanciones, mantener registros públicos, promover buenas prácticas, y emitir instructivos y recomendaciones.',
      'agencia,apdp,que es,fiscalizador,organismo'],

    [catId('apdp'),
      '¿Debo registrarme en la APDP?',
      'Sí, los responsables de tratamiento de datos personales deben registrarse ante la APDP. El registro incluye información sobre: identificación del responsable, tipo de datos tratados, finalidades del tratamiento, categorías de titulares, medidas de seguridad implementadas, y DPD designado. El registro debe mantenerse actualizado y cualquier cambio debe notificarse a la APDP en un plazo determinado.',
      'registro,inscripcion,apdp,obligatorio'],

    // --- Sanciones ---
    [catId('sanciones'),
      '¿Cuáles son las sanciones por incumplir la Ley 21.719?',
      'Las sanciones pueden ser: 1) Amonestación escrita, 2) Multas de hasta 20.000 UTM (aproximadamente $1.300.000 USD o $1.200 millones CLP) según la gravedad, 3) Prohibición temporal o definitiva de tratar datos, 4) Clausura del banco de datos. Las multas se determinan considerando: la gravedad de la infracción, el volumen de datos afectados, las medidas implementadas, la reincidencia, y la capacidad económica del infractor.',
      'multas,sanciones,penalidades,utm,cuanto,pagan'],

    [catId('sanciones'),
      '¿Qué factores agravan las sanciones?',
      'Factores que agravan las sanciones incluyen: 1) Tratamiento de datos sensibles, 2) Afectación de niños/adolescentes, 3) Volumen significativo de datos, 4) Reincidencia en infracciones, 5) Obstrucción a la fiscalización, 6) Beneficio económico obtenido mediante la infracción, 7) No notificar oportunamente una brecha, 8) Falta de colaboración con la APDP.',
      'agravantes,aumentan multa,factores,reincidencia'],

    // --- Inventario de Datos ---
    [catId('inventario_datos'),
      '¿Cómo hacer un inventario de datos personales?',
      'Para hacer un inventario de datos personales: 1) Identifica todos los procesos donde se recopilan datos, 2) Mapea el flujo de datos (origen, almacenamiento, uso, eliminación), 3) Clasifica los datos por tipo (personales, sensibles), 4) Identifica la base legal para cada tratamiento, 5) Determina los plazos de conservación, 6) Evalúa los riesgos, 7) Documenta medidas de seguridad. La plataforma Invisia incluye herramientas para automatizar este proceso mediante escaneo de bases de datos.',
      'como hacer,crear,elaborar,registro,mapeo'],

    [catId('inventario_datos'),
      '¿Qué debe incluir el inventario de datos?',
      'El inventario debe incluir: 1) Categorías de datos tratados, 2) Finalidades del tratamiento, 3) Base legal que legitima el tratamiento, 4) Categorías de titulares, 5) Origen de los datos, 6) Transferencias a terceros, 7) Transferencias internacionales, 8) Plazos de conservación, 9) Medidas de seguridad implementadas, 10) Evaluación de riesgos.',
      'que incluye,contenido,campos,elementos'],

    // --- Transferencia Internacional ---
    [catId('transferencia'),
      '¿Puedo transferir datos fuera de Chile?',
      'Sí, pero con restricciones. Se permite la transferencia internacional de datos a países que ofrezcan un nivel adecuado de protección (determinado por la APDP). También se permite cuando: 1) El titular ha dado su consentimiento explícito, 2) Es necesaria para ejecutar un contrato, 3) Es requerida por cooperación judicial internacional, 4) Existen cláusulas contractuales tipo aprobadas por la APDP, o 5) Se aplican normas corporativas vinculantes.',
      'transferir,enviar,extranjero,internacional,fuera chile'],

    // --- Seguridad ---
    [catId('seguridad'),
      '¿Qué medidas de seguridad debo implementar?',
      'Debes implementar medidas técnicas y organizativas apropiadas según el riesgo del tratamiento, incluyendo: 1) Cifrado de datos, 2) Control de acceso basado en roles, 3) Autenticación multifactor, 4) Registro de auditoría (logs), 5) Copias de seguridad cifradas, 6) Anonimización/pseudonimización, 7) Firewalls y sistemas de detección de intrusiones, 8) Evaluaciones periódicas de vulnerabilidades, 9) Plan de respuesta a incidentes, 10) Capacitación del personal.',
      'medidas,implementar,seguridadtécnica,organizativas,cifrado'],

    // --- Escaneo ---
    [catId('escaneo'),
      '¿Qué es un escaneo de dominio?',
      'Un escaneo de dominio es un análisis exhaustivo de la seguridad de un sitio web o dominio. Incluye: detección de vulnerabilidades (SQLi, XSS, etc.), análisis de puertos abiertos, enumeración de subdominios, revisión de certificados SSL/TLS, análisis de cabeceras de seguridad, detección de tecnologías utilizadas, y evaluación de configuraciones DNS. La plataforma Invisia automatiza todo este proceso y genera reportes detallados.',
      'escaneo dominio,analisis,seguridad web,que es'],

    [catId('escaneo'),
      '¿Qué tipos de escaneo ofrece la plataforma?',
      'La plataforma ofrece múltiples tipos de escaneo: 1) Escaneo completo de seguridad (SQLi, XSS, SSRF, LFI, etc.), 2) Análisis de puertos y servicios, 3) Enumeración de subdominios, 4) Análisis SSL/TLS, 5) Escaneo DNS, 6) Fingerprinting de tecnologías, 7) Detección de WAF, 8) Escaneo de vulnerabilidades OWASP Top 10, 9) Análisis de cumplimiento normativo (Ley 21.719), y 10) Escaneo de bases de datos para detectar datos personales.',
      'tipos,clases,ofrece,funcionalidades escaneo'],

    // --- Incidentes ---
    ['incidentes', 'plan de respuesta', 'incident', 1.0],
    ['incidentes', 'plan respuesta incidentes', 'incident', 1.0],
    ['incidentes', 'plan de contingencia', 'incident', 0.9],
    ['incidentes', 'gestion de incidentes', 'incident', 1.0],
    ['incidentes', 'incidente de seguridad', 'incident', 1.0],
    ['incidentes', 'incidente', 'incident', 0.9],
    ['incidentes', 'respuesta a incidentes', 'incident', 1.0],
    ['incidentes', 'equipo respuesta', 'incident', 0.8],
    ['incidentes', 'csirt', 'incident', 0.8],
    ['incidentes', 'computer security incident', 'incident', 0.7],
    ['incidentes', 'protocolo incidentes', 'incident', 0.9],
    ['incidentes', 'procedimiento incidentes', 'incident', 0.9],
    ['incidentes', 'manejo de crisis', 'incident', 0.7],
    ['incidentes', 'simulacro', 'incident', 0.7],
    ['incidentes', 'notificacion 72 horas', 'incident', 0.9],

    // --- Plataforma ---
    [catId('plataforma'),
      '¿Qué es Invisia?',
      'Invisia es una plataforma integral de ciberseguridad y cumplimiento normativo diseñada para ayudar a empresas chilenas a proteger sus activos digitales y cumplir con la Ley 21.719 de Protección de Datos Personales. Ofrece escaneo de seguridad, monitoreo de cumplimiento, gestión de consentimientos, inventario de datos, notificación de brechas, y generación de reportes. SecureLab es el agente endpoint que se instala en los servidores para monitoreo continuo.',
      'invisia,plataforma,que es,securelab'],

    [catId('plataforma'),
      '¿Cómo empezar a usar la plataforma?',
      'Para empezar: 1) Regístrate en la plataforma con tu email y crea una cuenta, 2) Configura tu empresa y dominio, 3) Selecciona el tipo de escaneo que deseas realizar, 4) Revisa los resultados y recomendaciones, 5) Opcionalmente, descarga e instala el agente SecureLab en tus servidores para monitoreo continuo 24/7. La plataforma te guiará a través del proceso de onboarding paso a paso.',
      'empezar,comenzar,registro,primeros pasos,onboarding'],

    [catId('plataforma'),
      '¿Qué es SecureLab Agent?',
      'SecureLab Agent es un agente endpoint desarrollado en Go que se instala como servicio de Windows (o demonio en Linux) para monitoreo continuo 24/7. Proporciona: firewall management, bloqueo de usuarios, telemetría del sistema, escaneo de bases de datos en busca de datos personales, integración con Ollama para análisis IA, y comunicación en tiempo real vía WebSocket con la plataforma Invisia. Se instala ejecutando el comando: securelab-agent install',
      'securelab,agente,endpoint,servicio,que es'],


    [catId('seguridad'),
      '¿Qué es un WAF y cómo ayuda a cumplir la Ley 21.719?',
      `Un WAF (Web Application Firewall) es una barrera de seguridad que filtra y monitorea el tráfico HTTP/HTTPS entre una aplicación web e Internet. Según la Ley 21.719, los responsables del tratamiento de datos personales deben implementar medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos personales (principio de seguridad). Un WAF contribuye directamente a este cumplimiento al detectar y bloquear ataques como inyecciones SQL, cross-site scripting (XSS), ejecución remota de código y otros vectores OWASP Top 10 que podrían comprometer datos personales.

Puedo generar un **documento de cumplimiento** que relacione la implementación del WAF con los artículos de la Ley 21.719 y las medidas de seguridad requeridas.`,
      'waf,firewall aplicacion web,ley 21719,seguridad web,proteccion datos,cumplimiento'],

    [catId('incidentes'),
      '¿Cómo debe ser el plan de respuesta a incidentes según la Ley 21.719?',
      `La Ley 21.719 exige que los responsables del tratamiento implementen medidas de seguridad y notifiquen brechas a la APDP dentro de las 72 horas. Un plan de respuesta a incidentes eficaz debe incluir: 1) **Preparación**: designar roles (CSIRT, DPD, legal, comunicaciones), inventario de activos y canales de escalamiento; 2) **Detección y análisis**: monitoreo, logs, clasificación de severidad; 3) **Contención, erradicación y recuperación**: aislamiento, eliminación de la amenaza y restauración con backups; 4) **Notificación**: APDP en 72 horas y titulares si hay alto riesgo; 5) **Post-incidente**: análisis de lecciones aprendidas, actualización del plan y simulacros.

Puedo generar un **documento con la estructura completa del plan de respuesta a incidentes** alineado a la Ley 21.719, incluyendo matrices de roles, plantillas de notificación y checklist de 72 horas.`,
      'plan respuesta incidentes,plan contingencia,ley 21719,apdp,72 horas,notificacion brecha'],

    [catId('incidentes'),
      '¿Cómo gestionar un incidente de seguridad según la Ley 21.719?',
      `La gestión de incidentes de seguridad bajo la Ley 21.719 debe considerar: 1) **Identificación**: confirmar si hay compromiso de datos personales; 2) **Registro**: documentar fecha, hora, sistemas afectados, tipos de datos y posibles titulares expuestos; 3) **Evaluación de riesgo**: determinar si existe riesgo para los derechos de los titulares; 4) **Notificación a APDP**: dentro de 72 horas de conocido el incidente; 5) **Notificación a titulares**: cuando el riesgo sea alto; 6) **Medidas correctivas**: cierre de la brecha, cambio de credenciales, análisis forense; 7) **Archivo probatorio**: conservar evidencia por posibles fiscalizaciones.

Puedo generar un **documento de gestión de incidentes** con las obligaciones de la Ley 21.719, flujo de trabajo y formatos para notificación.`,
      'incidente seguridad,gestion incidentes,brecha datos,notificar apdp,ley 21719,datos personales'],

    // --- Saludo ---
    [catId('saludo'),
      'hola',
      '¡Hola! Soy el Asistente SecureLab 🤖 Estoy aquí para ayudarte con todo sobre la Ley 21.719 de Protección de Datos Personales de Chile y el funcionamiento de la plataforma Invisia. ¿En qué puedo ayudarte hoy?',
      'saludo'],

    [catId('saludo'),
      'gracias',
      '¡De nada! Estoy aquí para ayudarte. Si tienes más preguntas sobre la Ley 21.719, cumplimiento normativo, o la plataforma Invisia, no dudes en consultarme. ¡Que tengas un excelente día! 😊',
      'agradecimiento'],

    [catId('saludo'),
      '¿quién eres?',
      'Soy el Asistente SecureLab, tu guía experto en la Ley 21.719 de Protección de Datos Personales de Chile y la plataforma Invisia de ciberseguridad. Fui diseñado para resolver tus dudas sobre cumplimiento normativo, escaneo de seguridad, y mejores prácticas de protección de datos. Puedo aprender y mejorar mis respuestas con el tiempo. ¿En qué puedo ayudarte?',
      'quien eres,presentacion,que eres'],

    [catId('saludo'),
      'buenos días / buenas tardes',
      '¡Hola! Soy el Asistente SecureLab 🤖 Estoy aquí para ayudarte con la Ley 21.719 y la plataforma Invisia. ¿En qué puedo ayudarte hoy?',
      'saludo,bienvenida'],

    [catId('ley_21719'),
      '¿Cuál es el ámbito de aplicación de la Ley 21.719?',
      'La Ley 21.719 aplica a todas las personas naturales o jurídicas, públicas o privadas, que realicen tratamiento de datos personales en Chile. También aplica extraterritorialmente a entidades extranjeras que traten datos de titulares que se encuentren en Chile, independientemente de dónde esté establecido el responsable. Quedan excluidos los tratamientos con fines exclusivamente personales o domésticos, los fines periodísticos, artísticos o literarios, y las estadísticas oficiales anonimizadas.',
      'ambito aplicacion,alcance,quien aplica,a quien cubre'],

    [catId('soporte'),
      'necesito ayuda / qué puedo preguntar',
      '¡Claro! Puedes preguntarme sobre estos temas:\n\n**🔒 Ley 21.719**: qué es, ámbito, sanciones, multas\n**📋 Datos personales**: qué son, datos sensibles, obligaciones\n**✅ Consentimiento**: cómo darlo, revocarlo\n**🛡️ Derechos ARCO**: acceso, rectificación, cancelación, oposición, portabilidad\n**⚠️ Brechas**: cómo reportar, plazos, notificación\n**👤 DPD/DPO**: obligación, requisitos\n**🏛️ APDP**: qué es, registro\n**🔐 Seguridad**: medidas, cifrado, backups\n**📊 Inventario**: cómo hacerlo\n**🌍 Transferencia**: datos al extranjero\n**🔎 Escaneo**: dominio, vulnerabilidades\n**💻 Plataforma**: cómo usar Invisia, agente SecureLab\n\n¿Sobre qué tema necesitas ayuda?',
      'ayuda,puedes ayudar,que preguntar,comandos,opciones,menu,servicios,informacion'],

    [catId('soporte'),
      'medios de contacto / teléfono soporte',
      `Puedes contactarnos a través de:

🎫 **Sistema de Tickets** (recomendado)
Desde el panel de administración ve a Soporte > Nuevo ticket. Describe tu consulta y nuestro equipo te responderá a la brevedad.

📧 **Email**: contacto@securelab.cl
📞 **Teléfono**: +56 9 9744 7411
🕐 **Horario**: Lunes a viernes de 9:00 a 18:00 (CLT)

También puedes escribir "ayuda" para ver todos los temas disponibles.`,
      'telefono,telefono soporte,contacto,email,correo,ticket,donde contacto,como contacto,soporte tecnico,hablar con alguien,atencion cliente'],

    [catId('soporte'),
      'conectar base de datos / conexión DB',
      'Para conectar tu base de datos a Invisia tienes dos opciones:\n\n**🔌 Conexión Remota (directa)**\n1. Ve a la sección Bases de Datos en el panel\n2. Haz clic en "Remoto"\n3. Ingresa los datos de conexión: host, puerto, usuario, contraseña y nombre de BD\n4. La plataforma se conecta directamente vía API\n5. Inicia el escaneo para detectar datos personales\n\n**🖥️ Conexión Local (vía agente SecureLab)**\n1. Instala el agente SecureLab en tu servidor: \`securelab-agent install\`\n2. El agente se comunica con la plataforma vía WebSocket\n3. No necesitas abrir puertos ni exponer tu base de datos\n4. El agente escanea localmente y envía resultados cifrados\n\n**Bases de datos soportadas**: PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB\n\n¿Te gustaría que te guíe con la instalación del agente?',
      'conectar base datos,conexion db,database,remoto,local,agente,postgresql,mysql,sql server,mongodb,oracle,como conectar,conectar db,conectarse'],

    [catId('sanciones'),
      '¿Qué pasa si no cumplo con la Ley 21.719?',
      'El incumplimiento de la Ley 21.719 puede resultar en: 1) Amonestación escrita, 2) Multas de hasta 20.000 UTM (aprox. $1.200 millones CLP), 3) Prohibición temporal o definitiva de tratar datos personales, 4) Clausura del banco de datos. Las multas se gradúan según la gravedad: leves (hasta 5.000 UTM), graves (hasta 10.000 UTM), y gravísimas (hasta 20.000 UTM). Además, la APDP puede publicar las sanciones, afectando la reputación de la organización.',
      'que pasa si no cumplo,consecuencias,incumplimiento,sin cumplimiento,que pasa,riesgos'],
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });
  insertMany(seedData);
  migrateKnowledge();
}

function migrateKnowledge() {
  const catId = (name) => {
    const r = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    return r ? r.id : null;
  };

  const insert = db.prepare(`INSERT OR IGNORE INTO knowledge (category_id, question, answer, keywords, source) VALUES (?, ?, ?, ?, 'seed')`);

  const extras = [
    // --- What is this site ---
    [catId('plataforma'),
      '¿qué es este sitio?',
      'Este sitio es la plataforma **Invisia** (Invisia Compliance), un sistema integral de ciberseguridad y cumplimiento normativo diseñado para empresas chilenas. Su objetivo principal es ayudarte a proteger tus activos digitales y cumplir con la **Ley 21.719 de Protección de Datos Personales**. Ofrece herramientas como: escaneo de vulnerabilidades en dominios, gestión de consentimientos, inventario de datos personales, notificación de brechas de seguridad, y generación de reportes de cumplimiento. También incluye el **SecureLab Agent**, un agente endpoint 24/7 que monitorea servidores en tiempo real.',
      'este sitio,que es,plataforma,proposito,objetivo,domain scanner,invisia'],

    [catId('plataforma'),
      '¿de qué trata esta página?',
      'Esta página es la interfaz web de **Invisia Compliance**, una plataforma de seguridad informática y cumplimiento de la Ley 21.719 de Chile. Permite realizar escaneos de seguridad en dominios, gestionar el ciclo completo de cumplimiento normativo (consentimientos, inventario de datos, brechas), y desplegar agentes de monitoreo SecureLab en servidores. Fue construida con un backend en Node.js + Express y un frontend en React + Vite, con un motor Go para el agente endpoint.',
      'de que trata,propósito,finalidad,funcionalidad'],

    [catId('plataforma'),
      '¿qué servicios ofrece esta plataforma?',
      'Invisia ofrece: 1) Escaneo de vulnerabilidades web (SQLi, XSS, SSRF, LFI, etc.), 2) Análisis de puertos y subdominios, 3) Escaneo SSL/TLS y DNS, 4) Detección de tecnologías y WAF, 5) Escaneo de bases de datos para detectar datos personales, 6) Gestión de consentimientos según Ley 21.719, 7) Inventario de datos personales, 8) Notificación y gestión de brechas de seguridad, 9) Reportes de cumplimiento normativo en PDF, 10) Monitoreo 24/7 vía SecureLab Agent, y 11) Integración con Ollama para análisis con IA.',
      'servicios,ofrece,funcionalidades,que hace'],

    // --- More Ley 21.719 entries ---
    [catId('ley_21719'),
      '¿Qué es la Ley 21.719?',
      'La Ley 21.719 es la nueva Ley de Protección de Datos Personales de Chile, promulgada en 2024. Reemplaza la antigua Ley 19.628 y establece un marco normativo moderno. Entre sus principales disposiciones: crea la Agencia de Protección de Datos Personales (APDP), exige consentimiento explícito e informado del titular, establece los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) más Portabilidad, obliga a notificar brechas de seguridad en un máximo de 72 horas, requiere designar un Delegado de Protección de Datos (DPD/DPO), y contempla sanciones de hasta 30.000 UTM por infracciones graves.',
      'ley 21719,21.719,proteccion datos,chile,normativa,que es'],

    [catId('ley_21719'),
      'resumen ley 21719',
      'La Ley 21.719 es la nueva ley chilena de protección de datos personales. Puntos clave: 1) Crea la Agencia de Protección de Datos (APDP), 2) Exige consentimiento explícito del titular, 3) Derechos ARCO + Portabilidad, 4) Notificación de brechas en 72 horas, 5) DPD obligatorio, 6) Sanciones hasta 30.000 UTM, 7) Aplica a todas las entidades que traten datos en Chile, 8) Vacancia de 24 meses desde su publicación en 2024.',
      'resumen,resumen ley,21719,puntos clave'],

    [catId('sanciones'),
      '¿Cuáles son las sanciones por incumplir la Ley 21.719?',
      'Las sanciones pueden ser: 1) Amonestación escrita, 2) Multas de hasta 30.000 UTM (aproximadamente $1.900.000 USD o $1.800 millones CLP), 3) Prohibición temporal o definitiva de tratar datos personales, 4) Clausura del banco de datos. Las multas se determinan según: gravedad de la infracción, volumen de datos afectados, medidas implementadas, reincidencia, y capacidad económica del infractor. Las infracciones más graves (datos sensibles, niños) pueden recibir el máximo de la multa.',
      'multas,sanciones,penalidades,utm,cuanto,pagan'],

    [catId('brechas'),
      '¿Cómo crear un plan de respuesta a incidentes?',
      'Un plan de respuesta a incidentes debe incluir: 1) **Roles y responsabilidades** claros (quién lidera, quién comunica, quién ejecuta), 2) **Detección**: monitoreo y alertas para identificar incidentes, 3) **Contención**: aislar sistemas afectados y revocar accesos comprometidos, 4) **Erradicación**: eliminar la causa raíz (malware, vulnerabilidad), 5) **Recuperación**: restaurar sistemas y validar su integridad, 6) **Comunicación**: notificar a la APDP en 72 horas y a titulares si hay alto riesgo, 7) **Documentación**: registrar todo el incidente y las medidas adoptadas, 8) **Lecciones aprendidas**: revisar y mejorar el plan. Se recomienda realizar simulacros periódicos para mantenerlo actualizado.',
      'plan respuesta,plan de respuesta,respuesta incidentes,plan incidentes,como crear plan,preparar incidentes,simulacro'],

    [catId('brechas'),
      '¿Cómo notificar a los titulares afectados por una brecha?',
      'La notificación a los titulares afectados debe: 1) Realizarse **sin dilación** cuando la brecha implique alto riesgo para sus derechos, 2) Usar **lenguaje claro y sencillo**, 3) Describir la **naturaleza de la brecha** y qué datos fueron afectados, 4) Informar las **medidas adoptadas** para mitigar el daño, 5) Incluir **recomendaciones** para que el titular se proteja (cambiar contraseñas, vigilar movimientos bancarios), 6) Proporcionar un **punto de contacto** para consultas. Debe hacerse por canales directos (email, teléfono, carta) cuando sea posible.',
      'notificar titulares,avisar titulares,informar afectados,comunicar brecha,titulares afectados'],

    [catId('brechas'),
      'notificación de brechas',
      'La Ley 21.719 exige notificar cualquier brecha de seguridad a la APDP dentro de 72 horas desde que se toma conocimiento. También debe notificarse a los titulares afectados si la brecha implica un alto riesgo para sus derechos. El incumplimiento de esta obligación puede agravar significativamente las sanciones. Se recomienda tener un plan de respuesta a incidentes preparado.',
      'brecha,notificacion,72 horas,apdp'],
    [catId('soporte'),
      'qué puedes hacer por mí / acciones disponibles',
      'Puedo ayudarte tanto con **información** como con **acciones directas** en la plataforma:\n\n**🧠 Información**\n• Responder dudas sobre la Ley 21.719 y protección de datos\n• Explicar derechos ARCO, consentimientos, brechas, sanciones\n• Guiarte en el uso de Invisia/SecureLab\n\n**⚡ Acciones que puedo ejecutar**\n• **Crear** consentimientos, tickets de soporte y reportes de brechas\n• **Escanear** dominios web y bases de datos\n• **Conectar** una base de datos local o remota\n• **Navegar** a secciones del panel (cumplimiento, reportes, etc.)\n• **Mostrarte** el teléfono y email de contacto\n\nTambién puedo darte pasos paso a paso para cumplir con la normativa. ¿Qué necesitas?',
      'puedes hacer,hacer cosas,que puedes hacer,acciones,capacidades,habilidades,que sabes hacer,como me ayudas,ayudarme'],

  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });
  insertMany(extras);
}

const STOP_WORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por',
  'un', 'una', 'para', 'con', 'no', 'al', 'lo', 'como', 'más', 'o', 'pero',
  'sus', 'le', 'ya', 'este', 'entre', 'todo', 'esa', 'ese', 'eso', 'esa',
  'esto', 'esta', 'estas', 'estos', 'muy', 'sin', 'sobre', 'también',
  'fue', 'ha', 'han', 'hay', 'ser', 'sido', 'tenido', 'tiene', 'son',
  'era', 'eran', 'había', 'habían', 'está', 'están', 'estaba', 'estaban',
  'ante', 'cabe', 'contra', 'durante', 'excepto', 'hacia', 'hasta',
  'mediante', 'para', 'porque', 'según', 'tras', 'vía', 'vs',
  'me', 'te', 'se', 'nos', 'os', 'lo', 'la', 'los', 'las',
  'mi', 'tu', 'su', 'nuestro', 'vuestro', 'mis', 'tus', 'sus',
  'yo', 'tú', 'usted', 'él', 'ella', 'ellos', 'nosotros', 'vosotros',
  'es', 'sí', 'no', 'si', 'cual', 'cuando', 'donde', 'como', 'cuanto',
  'quien', 'qué', 'quienes', 'cuales', 'cuantos', 'cuantas',
  'del', 'al', 'en', 'un', 'una', 'unos', 'unas',
]);

function normalize(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(normalized) {
  return normalized.split(' ').filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function categorizeQuestion(question) {
  const norm = normalize(question);
  const tokens = tokenize(norm);
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i+1]}`);
  }
  const trigrams = [];
  for (let i = 0; i < tokens.length - 2; i++) {
    trigrams.push(`${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`);
  }

  const dictRows = db.prepare('SELECT category, keyword, weight FROM dictionary').all();
  const catScores = {};

  for (const row of dictRows) {
    const kwNorm = normalize(row.keyword);
    const kwTokens = tokenize(kwNorm);

    let gramScore = 0;
    if (kwTokens.length >= 3) {
      const kwTrigram = kwTokens.join(' ');
      for (const trig of trigrams) {
        if (trig.includes(kwTrigram) || kwTrigram.includes(trig)) {
          gramScore = Math.max(gramScore, row.weight * 1.5);
        }
      }
    }
    if (gramScore === 0 && kwTokens.length >= 2) {
      const kwBigram = kwTokens.join(' ');
      for (const big of bigrams) {
        if (big === kwBigram) {
          gramScore = Math.max(gramScore, row.weight * 1.3);
        }
      }
    }
    if (gramScore > 0) {
      if (!catScores[row.category]) catScores[row.category] = 0;
      catScores[row.category] += gramScore;
    }
  }

  for (const token of tokens) {
    const tokenContributions = {};
    for (const row of dictRows) {
      const kwNorm = normalize(row.keyword);
      const kwTokens = tokenize(kwNorm);
      let matchScore = 0;

      if (token === kwNorm) {
        matchScore = Math.max(matchScore, row.weight);
      } else if (kwTokens.includes(token)) {
        matchScore = Math.max(matchScore, row.weight * 0.8);
      } else if (token.length > 3 && (token.includes(kwNorm) || kwNorm.includes(token))) {
        matchScore = Math.max(matchScore, row.weight * 0.4);
      }

      if (matchScore > 0) {
        if (!tokenContributions[row.category]) tokenContributions[row.category] = 0;
        tokenContributions[row.category] = Math.max(tokenContributions[row.category], matchScore);
      }
    }
    for (const [cat, score] of Object.entries(tokenContributions)) {
      if (!catScores[cat]) catScores[cat] = 0;
      catScores[cat] += score;
    }
  }

  if (Object.keys(catScores).length === 0) {
    return { category: 'general', confidence: 0.1, all_scores: {} };
  }

  const total = Object.values(catScores).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(catScores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1] || ['', 0];

  const confidence = total > 0 ? best[1] / total : 0;
  const margin = total > 0 ? (best[1] - second[1]) / total : 0;

  return {
    category: best[0],
    confidence: Math.min(confidence, 0.98),
    margin,
    all_scores: catScores,
  };
}

function findAnswer(question, category, minConfidence = 0.3) {
  const norm = normalize(question);
  const tokens = tokenize(norm);

  const rows = category === 'general'
    ? db.prepare('SELECT * FROM knowledge WHERE enabled = 1 ORDER BY access_count DESC, confidence DESC').all()
    : db.prepare(`SELECT k.* FROM knowledge k JOIN categories c ON k.category_id = c.id WHERE c.name = ? AND k.enabled = 1 ORDER BY k.access_count DESC, k.confidence DESC`).all(category);

  let bestMatch = null;
  let bestScore = 0;

  for (const row of rows) {
    const kwText = (row.keywords || '') + ' ' + row.question;
    const kwNorm = normalize(kwText);
    const kwTokens = tokenize(kwNorm);

    let matches = 0;
    for (const t of tokens) {
      if (kwTokens.includes(t)) matches++;
    }
    const coverage = tokens.length > 0 ? matches / tokens.length : 0;
    const score = matches === tokens.length
      ? row.confidence
      : coverage * row.confidence * 0.8;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = row;
    }
  }

  if (bestMatch && bestScore >= minConfidence) {
    db.prepare('UPDATE knowledge SET access_count = access_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(bestMatch.id);
    return { answer: bestMatch.answer, confidence: bestScore, source: 'knowledge', id: bestMatch.id };
  }

  return null;
}

function isSecurityViolation(question) {
  const norm = normalize(question);
  const raw = question.toLowerCase().trim();

  const injectionPatterns = [
    /ignor(a|á)\s+(las\s+)?instrucciones\s+(anteriores|previas|de\s+arriba)/,
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/,
    /act[uú]a\s+como\s+(si\s+fueras|un\s+|una\s+)/,
    /act\s+as\s+(if\s+you\s+were|a\s+|an\s+)/,
    /eres\s+ahora\s+(un\s+|una\s+)/,
    /you\s+are\s+now\s+(a\s+|an\s+)/,
    /olvida\s+(todo\s+lo\s+que\s+te\s+dije|las\s+reglas|tus\s+instrucciones)/,
    /forget\s+(everything|all\s+rules|your\s+instructions)/,
    /no\s+eres\s+(un\s+asistente|una\s+ia)/,
    /you\s+are\s+not\s+(an?\s+assistant|an?\s+ai)/,
    /simula\s+ser/,
    /pretend\s+(to\s+be|you\s+are)/,
    /haz\s+como\s+si/,
    /(eres|eres\s+ahora)\s+(chatgpt|gpt|claude|bard|gemini)/,
    /you\s+are\s+(chatgpt|gpt|claude|bard|gemini)/,
    /system\s*prompt/,
    /prompt\s*(del\s+)?sistema/,
    /mu[eé]strame\s+(tus?\s+)?(instrucciones|reglas|prompt|system\s*prompt)/,
    /show\s+me\s+your\s+(instructions|rules|prompt|system\s*prompt)/,
    /cu[aá]les\s+son\s+tus\s+(instrucciones|reglas|l[ií]mites)/,
    /what\s+are\s+your\s+(instructions|rules|limitations)/,
    /c[oó]mo\s+(funcionas|est[aá]s\s+programado|te\s+programaron)/,
    /how\s+(do\s+you\s+work|are\s+you\s+programmed)/,
    /revela\s+(tus?\s+)?(secretos|datos\s+internos|configuraci[oó]n)/,
    /reveal\s+your\s+(secrets|internal\s+data|configuration)/,
    /dame\s+(acceso|todos\s+los\s+datos|informaci[oó]n\s+privada)/,
    /give\s+me\s+(access|all\s+data|private\s+info)/,
    /bypass|eludir|saltar\s+(restricciones|filtros|seguridad)/,
    /jailbreak|root\s*mode|developer\s*mode|admin\s*mode/,
    /modo\s+(desarrollador|administrador|root|debug)/,
    /sin\s+restricciones|sin\s+l[ií]mites|sin\s+censura/,
    /unrestricted|uncensored|no\s+limits|no\s+restrictions/,
    /h[aá]blame\s+como\s+si\s+(fuera|fueras)/,
    /talk\s+to\s+me\s+like/,
    /eres\s+libre|eres\s+omnipotente/,
    /you\s+are\s+free|you\s+are\s+omnipotent/,
    /no\s+sigas\s+las\s+reglas/,
    /don'?t\s+follow\s+(the\s+)?rules/,
    /rompe\s+(las\s+)?(reglas|restricciones)/,
    /break\s+(the\s+)?(rules|restrictions)/,
  ];

  const exfilPatterns = [
    /mu[eé]strame\s+todo/,
    /show\s+me\s+(everything|all)/,
    /dame\s+(todo|todos\s+los\s+datos|la\s+base\s+de\s+datos)/,
    /give\s+me\s+(everything|all\s+the\s+data|the\s+database)/,
    /lista\s+(de\s+)?(todos\s+los\s+)?(usuarios|clientes|passwords|contrase[ñn]as|tokens|api\s*keys)/,
    /list\s+(all\s+)?(users|customers|passwords|tokens|api\s*keys)/,
    /descarga\s+(la\s+)?(base\s+de\s+datos|database|bd)/,
    /download\s+(the\s+)?(database|db)/,
    /exporta\s+(todos\s+los\s+)?(datos|registros|usuarios)/,
    /export\s+(all\s+)?(data|records|users)/,
    /dump\s+(database|db|data|sql)/,
    /sql\s*map|sqlmap/,
    /select\s+\*\s+from|union\s+select|drop\s+table|insert\s+into/,
    /'?\s*or\s+1\s*=\s*1|'?\s*or\s+'1'?\s*=\s*'1/,
    /<script|javascript\s*:|onerror\s*=|onload\s*=/,
    /\.\.\/\.\.\/|etc\/passwd|etc\/shadow|\/bin\/bash/,
    /curl\s+|wget\s+|nc\s+-|nmap\s+/,
  ];

  const hackingPatterns = [
    /c[oó]mo\s+(hackear|hackear\s+la\s+p[aá]gina|hackear\s+el\s+sitio|hackear\s+el\s+sistema)/,
    /how\s+to\s+hack/,
    /exploit|exploitar|vulnerabilidad\s+para\s+(atacar|explotar)/,
    /c[oó]mo\s+(explotar|aprovechar)\s+(una\s+)?vulnerabilidad/,
    /how\s+to\s+exploit/,
    /inyecci[oó]n\s+(sql|de\s+c[oó]digo|xss|de\s+comandos)/,
    /sql\s+injection|xss\s+attack|csrf\s+attack/,
    /cross\s*site\s*scripting/,
    /remote\s*code\s*execution|rce/,
    /denial\s*of\s*service|dos\s+attack|ddos/,
    /phishing|spoofing|man\s+in\s+the\s+middle/,
    /c[oó]mo\s+(robar|obtener)\s+(datos|informaci[oó]n|contrase[ñn]as)/,
    /how\s+to\s+steal\s+(data|information|passwords)/,
    /ingenier[ií]a\s+social|social\s+engineering/,
    /fuerza\s+bruta|brute\s+force/,
    /reverse\s+shell|backdoor|rootkit|malware|ransomware/,
    /c[oó]mo\s+(burlar|evadir|saltarse)\s+(la\s+)?(seguridad|autenticaci[oó]n|firewall)/,
    /how\s+to\s+bypass\s+(security|authentication|firewall)/,
    /pentest|penetration\s+test|metasploit|kali\s+linux/,
    /escaneo\s+de\s+puertos|port\s+scan/,
    /sniff(er|ing)|packet\s+capture|wireshark/,
    /crack(ear|ing)?\s+(password|contrase[ñn]a|hash)/,
    /keylogger|spyware|trojan/,
    /defac(e|ing)|desfigurar\s+(sitio|p[aá]gina|web)/,
    /c[oó]mo\s+(tumbar|derribar|caerse)\s+(un\s+)?(servidor|sitio|p[aá]gina)/,
    /c[oó]mo\s+(hacer\s+)?(caer|tirar)\s+(el\s+)?(servidor|sitio|sistema)/,
  ];

  for (const p of injectionPatterns) if (p.test(norm) || p.test(raw)) return { type: 'injection' };
  for (const p of exfilPatterns) if (p.test(norm) || p.test(raw)) return { type: 'exfiltration' };
  for (const p of hackingPatterns) if (p.test(norm) || p.test(raw)) return { type: 'hacking' };

  return null;
}

function isOutOfScope(question) {
  const norm = normalize(question);
  const outPatterns = [
    /clima|temperatura|pronostico|weather/,
    /noticia|deportes|futbol|politica|gobierno/,
    /receta|cocinar|comida|restaurant/,
    /chiste|cuento|historia ficticia/,
    /programar en python|javascript|java|c\+\+|codigo/,
    /compra|venta|precio de|amazon|mercado libre/,
    /cita|agendar|reunion|calendario/,
    /^\s*(quien|quienes|donde|cuando|cuanto|como)\s+(es|son|est[aá]|va|fue|ser[áa])\s+(messi|bachelet|pi[ñn]era|biden|trump|elon|chatgpt|google|meta)\s*\??$/,
  ];
  for (const p of outPatterns) if (p.test(norm)) return true;
  return false;
}

function detectTaskIntent(question) {
  const norm = normalize(question);
  const intents = [
    { action: 'navigate', pattern: /(ir a|navegar a|abrir|mostrar|ver|ver la seccion|ir al|ll[eé]vame a)\s+(.+)/, getParams: (m) => ({ target: m[2] }) },
    { action: 'scan_domain', pattern: /(escanear dominio|scanear dominio|analizar dominio|escanea el dominio|escanear la pagina)\s+(.+)/, getParams: (m) => ({ domain: m[2] }) },
    { action: 'scan_database', pattern: /(escanear base de datos|escanear bd|escanear database|scanear bd|analizar base de datos)\s*([a-z0-9._-]+)?/, getParams: (m) => ({ dbId: m[2] }) },
    { action: 'report_breach', pattern: /(reportar brecha|notificar brecha|crear brecha|nueva brecha|reportar incidente)/, getParams: () => ({}) },
    { action: 'connect_database', pattern: /(conectar base de datos|conectar bd|agregar database|nueva base de datos|conectar database)/, getParams: () => ({}) },
    { action: 'create_consent', pattern: /(crear consentimiento|nuevo consentimiento|agregar consentimiento|registrar consentimiento)/, getParams: () => ({}) },
    { action: 'generate_report', pattern: /(generar reporte|crear reporte|descargar reporte|generar informe|descargar informe)/, getParams: () => ({}) },
    { action: 'open_ticket', pattern: /(crear ticket|nuevo ticket|abrir ticket|soporte ticket)/, getParams: () => ({}) },
    { action: 'enable_2fa', pattern: /(activar 2fa|habilitar 2fa|activar doble factor|habilitar doble factor)/, getParams: () => ({}) },
  ];
  for (const intent of intents) {
    const m = norm.match(intent.pattern);
    if (m) return { action: intent.action, params: intent.getParams(m) };
  }
  return null;
}

function buildPageActions(pageContext) {
  if (!pageContext || !pageContext.page) return null;
  const actions = [];
  const { page, actions: ctxActions } = pageContext;
  if (ctxActions && Array.isArray(ctxActions)) {
    for (const a of ctxActions) {
      actions.push({ label: a.label, type: a.type || 'page', action: a.action, value: a.value });
    }
  }
  if (page.includes('dashboard') || page === '/') {
    actions.push({ label: 'Ir a Bases de Datos', type: 'navigate', action: 'navigate', value: '/databases' });
    actions.push({ label: 'Ver Reportes', type: 'navigate', action: 'navigate', value: '/reports' });
  } else if (page.includes('database')) {
    actions.push({ label: 'Agregar BD', type: 'navigate', action: 'navigate', value: '/databases/new' });
    actions.push({ label: 'Ver Escaneos', type: 'navigate', action: 'navigate', value: '/scans' });
  } else if (page.includes('compliance')) {
    actions.push({ label: 'Ver Consentimientos', type: 'navigate', action: 'navigate', value: '/compliance/consents' });
    actions.push({ label: 'Reportar Brecha', type: 'navigate', action: 'navigate', value: '/compliance/breaches/new' });
  } else if (page.includes('settings')) {
    actions.push({ label: 'Configurar SMTP', type: 'navigate', action: 'navigate', value: '/settings/smtp' });
    actions.push({ label: 'Activar 2FA', type: 'navigate', action: 'navigate', value: '/settings/security' });
  }
  return actions.length ? actions : null;
}

function withActions(result, category, question, pageContext) {
  const actions = getSupportActions(category, question);
  if (actions) result.quick_actions = actions;

  const pageActions = buildPageActions(pageContext);
  if (pageActions) result.page_actions = pageActions;

  const task = detectTaskIntent(question);
  if (task && task.action !== 'navigate') {
    result.pending_action = {
      action: task.action,
      params: task.params,
      question,
      message: 'Puedo ayudarte con esta acción. ¿Deseas que la ejecute?',
      confirm_label: 'Sí, ejecutar',
      reject_label: 'No, gracias',
    };
  }
  return result;
}

const SECURITY_BLOCK_MSG = `No puedo procesar esta consulta. Como asistente de Invisia/SecureLab, estoy diseñado exclusivamente para ayudarte con temas relacionados a la **Ley 21.719 de Protección de Datos Personales de Chile** y los **servicios de la plataforma**.

Si tienes una consulta legítima sobre protección de datos, cumplimiento normativo, escaneos de seguridad, gestión de bases de datos, derechos ARCO, o el funcionamiento de la plataforma, por favor reformúlala de manera específica y estaré encantado de ayudarte.`;
export function ask(question, { useOllama = true, ollamaFn = null, learn = true, pageContext = null } = {}) {
  getDB();

  const securityViolation = isSecurityViolation(question);
  if (securityViolation) {
    logLearning(question, SECURITY_BLOCK_MSG, 'security_blocked', 1, 'security_filter');
    return {
      answer: SECURITY_BLOCK_MSG,
      confidence: 1,
      category: 'security_blocked',
      source: 'security_filter',
      categories: {},
    };
  }

  if (isOutOfScope(question)) {
    return {
      answer: 'Lo siento, solo puedo ayudarte con temas relacionados a la **Ley 21.719 de Protección de Datos Personales de Chile** y los **servicios de la plataforma Invisia/SecureLab**.\n\nSi tu consulta es sobre otro tema, no puedo asistirte. ¿Tienes alguna duda sobre protección de datos, cumplimiento normativo, o el funcionamiento de la plataforma?',
      confidence: 1,
      category: 'out_of_scope',
      source: 'rule',
      categories: {},
    };
  }

  const catResult = categorizeQuestion(question);
  const { category, confidence } = catResult;

  const threshold = category === 'general' ? 0.15 : 0.25;
  const match = findAnswer(question, category, threshold);

  if (match) {
    logLearning(question, match.answer, category, match.confidence, 'matched');
    return withActions({
      answer: match.answer,
      confidence: match.confidence,
      category,
      source: 'matched',
      categories: catResult.all_scores,
    }, category, question, pageContext);
  }

  const generalMatch = category !== 'general' ? findAnswer(question, 'general', 0.1) : null;
  if (generalMatch) {
    logLearning(question, generalMatch.answer, 'general', generalMatch.confidence, 'matched');
    return withActions({
      answer: generalMatch.answer,
      confidence: generalMatch.confidence,
      category: 'general',
      source: 'matched',
      categories: catResult.all_scores,
    }, category, question, pageContext);
  }

  if (useOllama && ollamaFn) {
    try {
      const ollamaAnswer = ollamaFn(question);
      if (ollamaAnswer) {
        if (learn && !isSecurityViolation(question)) {
          storeLearned(question, ollamaAnswer, category);
        }
        logLearning(question, ollamaAnswer, category, 0.5, 'ollama');
        return withActions({
          answer: ollamaAnswer,
          confidence: 0.5,
          category,
          source: 'ollama',
          categories: catResult.all_scores,
        }, category, question, pageContext);
      }
    } catch (e) {
      // fall through
    }
  }

  const fallback = getFallbackAnswer(category);
  logLearning(question, fallback, category, 0.1, 'fallback');
  return withActions({
    answer: fallback,
    confidence: 0.1,
    category,
    source: 'fallback',
    categories: catResult.all_scores,
  }, category, question, pageContext);
}

const CONTACT_INFO = {
  phone: '+56 9 9744 7411',
  email: 'contacto@securelab.cl',
  hours: 'Lunes a viernes de 9:00 a 18:00 (CLT)',
};

function getSupportActions(category, question) {
  const norm = normalize(question);
  const isDocRequest = norm.includes('waf')
    || norm.includes('web application firewall')
    || norm.includes('plan de respuesta')
    || norm.includes('plan respuesta')
    || norm.includes('incidente')
    || norm.includes('gestion de incidentes')
    || norm.includes('respuesta a incidentes');

  if (isDocRequest) {
    return [
      { label: '📄 Generar documento', type: 'page', action: 'generate_document', value: 'compliance_ley21719', query: question },
      { label: '📧 Solicitar asesoría', type: 'contact', action: 'show_email', value: CONTACT_INFO.email, details: `Correo: ${CONTACT_INFO.email}\nRespuesta en máximo 24 hrs hábiles` },
    ];
  }

  const isSupport = category === 'soporte'
    || norm.includes('soporte')
    || norm.includes('ayuda')
    || norm.includes('contact')
    || norm.includes('telefono')
    || norm.includes('email')
    || norm.includes('correo')
    || norm.includes('whatsapp')
    || norm.includes('db')
    || norm.includes('database')
    || norm.includes('base datos')
    || norm.includes('conectar')
    || norm.includes('tutorial')
    || norm.includes('como hago')
    || norm.includes('guiar');
  if (!isSupport) return null;

  return [
    {
      label: '📞 Llamar',
      type: 'contact',
      action: 'show_phone',
      value: CONTACT_INFO.phone,
      details: `Teléfono: ${CONTACT_INFO.phone}\nHorario: ${CONTACT_INFO.hours}`,
    },
    {
      label: '📧 Email',
      type: 'contact',
      action: 'show_email',
      value: CONTACT_INFO.email,
      details: `Correo: ${CONTACT_INFO.email}\nRespuesta en máximo 24 hrs hábiles`,
    },
  ];
}

function getFallbackAnswer(category) {
  const catInfo = CATEGORIES.find(c => c.name === category);
  const catName = catInfo ? catInfo.description : 'tu consulta';

  return `Entiendo que tienes una consulta sobre **${catName}**. Esta es un área importante y me gustaría darte la mejor respuesta posible. 

Puedes intentar reformular tu pregunta de otra manera, o consultarme sobre:
- Los requisitos de la Ley 21.719
- Cómo implementar medidas de protección de datos
- El funcionamiento de la plataforma Invisia
- Escaneo de seguridad y vulnerabilidades

Si necesitas una respuesta más precisa, contacta a nuestro equipo de soporte para asistencia personalizada.`;
}

function storeLearned(question, answer, category) {
  try {
    const catRow = db.prepare('SELECT id FROM categories WHERE name = ?').get(category);
    if (catRow) {
      db.prepare(`INSERT INTO knowledge (category_id, question, answer, keywords, source) VALUES (?, ?, ?, ?, 'learned')`).run(
        catRow.id, question, answer, normalize(question)
      );
    }
  } catch (e) {
    // ignore duplicate
  }
}

function logLearning(question, answer, category, confidence, source) {
  try {
    db.prepare(`INSERT INTO learning_log (question, answer, category, confidence, source) VALUES (?, ?, ?, ?, ?)`).run(
      question, answer, category, confidence, source
    );
  } catch (e) {
    // ignore
  }
}

export function learnPair(question, answer, category = null) {
  getDB();
  let catRow = category
    ? db.prepare('SELECT id FROM categories WHERE name = ?').get(category)
    : null;
  if (!catRow) {
    const catResult = categorizeQuestion(question);
    catRow = db.prepare('SELECT id FROM categories WHERE name = ?').get(catResult.category);
  }
  if (!catRow) {
    db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)').run('user_defined', 'Categoría definida por el usuario');
    catRow = db.prepare('SELECT id FROM categories WHERE name = ?').get('user_defined');
  }

  const existing = db.prepare('SELECT id FROM knowledge WHERE question = ?').get(question);
  if (existing) {
    db.prepare('UPDATE knowledge SET answer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(answer, existing.id);
    return { updated: true, id: existing.id };
  }

  const catId = catRow ? catRow.id : 1;
  const result = db.prepare(`INSERT INTO knowledge (category_id, question, answer, keywords, source) VALUES (?, ?, ?, ?, 'manual')`).run(
    catId, question, answer, normalize(question)
  );
  return { created: true, id: result.lastInsertRowid };
}

export function getStats() {
  getDB();
  const knowledge = db.prepare('SELECT COUNT(*) as c FROM knowledge').get();
  const matched = db.prepare("SELECT COUNT(*) as c FROM learning_log WHERE source = 'matched'").get();
  const ollama = db.prepare("SELECT COUNT(*) as c FROM learning_log WHERE source = 'ollama'").get();
  const learned = db.prepare("SELECT COUNT(*) as c FROM knowledge WHERE source = 'learned'").get();
  const topQuestions = db.prepare('SELECT question, access_count FROM knowledge ORDER BY access_count DESC LIMIT 10').all();
  const recentLog = db.prepare('SELECT * FROM learning_log ORDER BY created_at DESC LIMIT 10').all();
  const categories = db.prepare('SELECT c.name, c.description, COUNT(k.id) as count FROM categories c LEFT JOIN knowledge k ON k.category_id = c.id GROUP BY c.id').all();

  return {
    totalKnowledge: knowledge.c,
    totalMatched: matched.c,
    totalOllama: ollama.c,
    totalLearned: learned.c,
    topQuestions,
    recentActivity: recentLog,
    categories,
  };
}

export function search(term) {
  getDB();

  const norm = normalize(term);
  const results = db.prepare(`
    SELECT k.id, k.question, k.answer, c.name as category, k.confidence, k.access_count
    FROM knowledge k JOIN categories c ON k.category_id = c.id
    WHERE k.enabled = 1 AND (k.question LIKE ? OR k.answer LIKE ? OR k.keywords LIKE ?)
    ORDER BY k.access_count DESC, k.confidence DESC
    LIMIT 20
  `).all(`%${norm}%`, `%${norm}%`, `%${norm}%`);
  return results;
}

export function close() {
  if (db) {
    db.close();
    db = null;
  }
}
