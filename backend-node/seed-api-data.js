import { getDB } from './services/assistant.js';

const db = getDB();

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
insertCat.run('api_reference', 'Referencia de APIs y endpoints del backend');

const catRow = db.prepare('SELECT id FROM categories WHERE name = ?').get('api_reference');
if (!catRow) { console.error('Category not found'); process.exit(1); }
const catId = catRow.id;

const dictEntries = [
  ['api_reference','api','api',1.0],
  ['api_reference','endpoint','api',1.0],
  ['api_reference','endpoints','api',1.0],
  ['api_reference','ruta','api',0.8],
  ['api_reference','rutas','api',0.8],
  ['api_reference','backend','api',0.9],
  ['api_reference','back end','api',0.9],
  ['api_reference','servidor','api',0.6],
  ['api_reference','token','api',0.7],
  ['api_reference','autenticacion','api',0.8],
  ['api_reference','auth','api',0.8],
  ['api_reference','login','api',0.7],
  ['api_reference','register','api',0.7],
  ['api_reference','apis','api',1.0],
  ['api_reference','peticion','api',0.7],
  ['api_reference','peticiones','api',0.7],
  ['api_reference','request','api',0.8],
  ['api_reference','compliance api','api',0.9],
  ['api_reference','consentimiento api','api',0.9],
  ['api_reference','inventario api','api',0.9],
  ['api_reference','brecha api','api',0.9],
  ['api_reference','arco api','api',0.9],
  ['api_reference','database api','api',0.9],
  ['api_reference','agente api','api',0.9],
  ['api_reference','reporte api','api',0.9],
  ['api_reference','alerta api','api',0.9],
  ['api_reference','ticket api','api',0.9],
  ['api_reference','pago api','api',0.9],
  ['api_reference','smtp api','api',0.9],
  ['api_reference','notificacion api','api',0.9],
  ['api_reference','chat api','api',0.9],
  ['api_reference','asistente api','api',0.9],
  ['api_reference','monitor api','api',0.9],
  ['api_reference','onboarding api','api',0.9],
  ['api_reference','dpia api','api',0.9],
  ['api_reference','dpa api','api',0.9],
  ['api_reference','pseudonimizacion api','api',0.9],
  ['api_reference','capacitacion api','api',0.9],
  ['api_reference','portabilidad api','api',0.9],
  ['api_reference','supresion api','api',0.9],
  ['api_reference','ropa api','api',0.9],
  ['api_reference','transferencia api','api',0.9],
  ['api_reference','laboral api','api',0.9],
  ['api_reference','compliant companies api','api',0.9],
  ['api_reference','empresas cumplen api','api',0.9],
  ['api_reference','hardening api','api',0.9],
  ['api_reference','waf api','api',0.9],
  ['api_reference','admin api','api',0.9],
  ['api_reference','usuario api','api',0.9],
  ['api_reference','cuenta api','api',0.9],
  ['api_reference','passkey api','api',0.9],
  ['api_reference','captcha api','api',0.9],
  ['api_reference','rest api','api',0.8],
  ['api_reference','como usar api','api',0.9],
  ['api_reference','como crear','api',0.6],
  ['api_reference','como escanear','api',0.7],
  ['api_reference','como reportar api','api',0.8],
];

const insertDict = db.prepare('INSERT OR IGNORE INTO dictionary (category, keyword, synonym_group, weight) VALUES (?, ?, ?, ?)');
const insertDictMany = db.transaction((rows) => { for (const row of rows) insertDict.run(...row); });
insertDictMany(dictEntries);

const knowledge = [
  [catId, '¿Qué APIs tiene el backend?', 'El backend de Invisia/SecureLab tiene **24 módulos de API**:\n\n**Auth:** `/api/login`, `/api/register`, `/api/changePassword`\n**Compliance:** `/api/invisia/compliance/*` (config, consents, inventory, breaches, templates, trainings, arco-requests, pseudonymization, dpia, dpa, audit-log, portability, suppression, ropa-pdf, report, labor-clause, transfer-validation)\n**Databases:** `/api/databases/*` (CRUD, scan, logs, client actions)\n**Agents:** `/api/agents/*` (CRUD, install, uninstall, restart)\n**Dashboard:** `/api/dashboard/*`\n**Reports:** `/api/reports/*`\n**Alerts:** `/api/alerts/*`\n**Tickets:** `/api/tickets/*`\n**Chat:** `/api/chat/*`\n**Assistant:** `/api/assistant/*`\n**Payments:** `/api/payments/*`\n**Notifications:** `/api/notifications/*`\n**SMTP:** `/api/smtp/*`\n**Onboarding:** `/api/onboarding/*`\n**Monitor:** `/api/host-monitor/*`\n**Admin:** `/api/admin/*`\n**ARCO:** `/api/arco/*`\n**Companies:** `/api/compliant-companies`\n**Account:** `/api/account/*`\n**Passkey:** `/api/passkey/*`\n**Captcha:** `/api/captcha/*`\n**Hardening:** `/api/hardening/check-waf`\n\nLa mayoría requieren token JWT. ¿Sobre cuál necesitas detalles?', 'apis,backend,endpoints,lista apis,todas las apis,que apis hay,api referencia'],
  [catId, '¿Cómo funciona la API de autenticación?', '**Auth API:**\n- `POST /api/login` — Body: email, password. Retorna token + user.\n- `POST /api/register` — Body: companyName, domain, email, password.\n- `POST /api/changePassword` — Body: token, newPassword.\n- `DELETE /api/auth/users/:userId?token=X` — Admin: elimina usuario.\n\nToken JWT expira en 24h. Se envía en body.token, query.token, o header Authorization: Bearer.', 'auth api,login api,register api,autenticacion,token api'],
  [catId, '¿Qué endpoints hay para compliance?', '**Compliance API** (`/api/invisia/compliance`):\n- GET/POST `/config` — Configuración de cumplimiento\n- GET/POST `/consents`, POST `/consents/:id/revoke`, PUT `/consents/:id`\n- GET/POST `/inventory`, PUT/DELETE `/inventory/:id`\n- GET/POST `/breaches`, POST `/breaches/:id/resolve`\n- GET/POST `/templates`, DELETE `/templates/:id`\n- GET `/overview`, GET `/stats`\n- GET/POST `/arco-requests`, POST `/arco-requests/:id/respond`, POST `/:id/reject`\n- GET/POST `/trainings`, POST `/trainings/:id/complete`, DELETE `/:id`\n- GET/POST `/pseudonymization`, PUT/DELETE `/:id`, POST `/:id/execute`, POST `/:id/revert`\n- GET/POST `/dpia`, PUT/DELETE `/:id`, POST `/:id/approve`, GET `/:id/pdf`\n- GET/POST `/dpa`, PUT/DELETE `/:id`, GET `/:id/pdf`\n- GET/POST `/audit-log`\n- POST `/portability/export`, POST `/suppression/execute`\n- GET `/report`, GET `/ropa-pdf`, GET `/labor-clause`\n- POST `/transfer-validation`\n\nTodas requieren token.', 'compliance api,apis compliance,endpoints compliance,consentimientos api,inventario api,brechas api'],
  [catId, '¿Qué endpoints hay para bases de datos y agentes?', '**Databases API** (`/api/databases`): GET/POST `/`, PUT/DELETE `/:id`, POST `/:id/scan`, GET `/:id/scan-results`, GET `/:id/logs`, DELETE `/logs/delete-by-query`, POST `/:id/client/uninstall`, POST `/:id/client/reconnect-db`, POST `/:id/client/reconnect-agent`, POST `/:id/client/restart`.\n\n**Agents API** (`/api/agents`): GET/POST `/`, PUT/DELETE `/:id`, POST `/:id/install`, POST `/:id/uninstall`, POST `/:id/restart`, GET `/:id/status`.\n\nTodas requieren token.', 'databases api,bases datos api,agentes api,agents api,scan api'],
  [catId, '¿Qué endpoints hay para reportes, alertas y tickets?', '**Reports:** GET `/api/reports`, POST `/api/reports/generate`, GET `/:id/download`, DELETE `/:id`.\n**Alerts:** GET/POST `/api/alerts`, PUT/DELETE `/:id`, POST `/public` (sin auth).\n**Tickets:** GET/POST `/api/tickets`, GET `/:id`, POST `/:id/reply`, PUT `/:id/status`.\n\nTodas requieren token (excepto alerts/public).', 'reportes api,alerts api,alertas api,tickets api,soporte api'],
  [catId, '¿Qué endpoints hay para chat, asistente y notificaciones?', '**Chat:** GET/POST `/api/chat/sessions`, GET/DELETE `/:id`, POST `/:id/messages`.\n**Asistente IA:** POST `/api/assistant/ask`, POST `/learn`, GET `/stats`, POST `/search`, POST `/feedback`.\n**Notifications:** GET `/api/notifications`, POST `/mark-read`, POST `/mark-all-read`, DELETE `/:id`.\n\nTodas requieren token.', 'chat api,asistente api,assistant api,notificaciones api,ia api'],
  [catId, '¿Qué endpoints hay para pagos, cuenta y administración?', '**Payments:** GET `/api/payments/plans`, POST `/subscribe`, POST `/webhook`, GET `/history`.\n**Account:** GET/PUT `/api/account/profile`, POST `/change-password`, POST `/enable-2fa`, POST `/disable-2fa`, POST `/verify-2fa`.\n**Admin:** GET/POST `/api/admin/alerts`, PUT/DELETE `/:id`, GET/PUT `/settings`, GET `/logs`, GET `/users`, PUT `/:id`, POST `/:id/suspend`, POST `/:id/activate`.\n**SMTP:** GET/POST `/api/smtp/config`, POST `/test`.\n\nAdmin y SMTP requieren rol admin.', 'pagos api,payments api,cuenta api,account api,admin api,smtp api,2fa api'],
  [catId, '¿Qué endpoints públicos hay sin autenticación?', 'Endpoints sin token: POST `/api/login`, POST `/api/register`, GET `/api/compliant-companies?search=X`, POST `/api/arco/submit`, GET `/api/arco/track/:id`, POST `/api/alerts/public`, POST `/api/admin/alerts/public`, GET `/api/hardening/check-waf?domain=X`, POST `/api/assistant/ask` (token opcional), GET/POST `/api/captcha/*`, POST `/api/passkey/*`, POST `/api/onboarding/submit`.', 'endpoints publicos,sin autenticacion,public api,no token,apis publicas'],
  [catId, '¿Cómo creo un consentimiento por API?', '`POST /api/invisia/compliance/consents` con token, titularEmail, titularName, purpose, dataCategories, source. Ejemplo: `token=eyJ...&titularEmail=cliente@email.com&titularName=Juan&purpose=Marketing&dataCategories=email,nombre&source=web`.', 'crear consentimiento api,como crear consentimiento,consentimiento post'],
  [catId, '¿Cómo reporto una brecha de seguridad por API?', '`POST /api/invisia/compliance/breaches` con token, type, severity (low/medium/high/critical), description, affectedData, affectedUsers, sensitiveDataInvolved, childrenDataInvolved, detectedAt. Si es critical o involucra datos sensibles, notifica automáticamente a la APDP.', 'reportar brecha api,crear brecha,brecha seguridad endpoint'],
  [catId, '¿Cómo escaneo una base de datos por API?', '1) `POST /api/databases` con token, type, host, port, dbName, username, password, dbType. 2) `POST /api/databases/:id/scan` con token. 3) `GET /api/databases/:id/scan-results?token=X`. El escaneo busca patrones de datos personales en tablas y columnas.', 'escanear api,scan database api,como escanear bd'],
  [catId, '¿Cómo gestionar solicitudes ARCO por API?', 'Crear (público): `POST /api/arco/submit` con nombre, rut, email, telefono, tipo, descripcion. Listar: `GET /api/invisia/compliance/arco-requests?token=X`. Responder: `POST /api/invisia/compliance/arco-requests/:id/respond`. Rechazar: `POST /api/invisia/compliance/arco-requests/:id/reject`. Seguimiento: `GET /api/arco/track/:id`. Plazo legal: 10 días hábiles.', 'arco api,solicitar arco,responder arco,derechos arco endpoint'],
  [catId, '¿Cómo usar el asistente IA por API?', '`POST /api/assistant/ask` con question (requerido), token, session_id, page_context. Responde con answer, confidence, category, source, quick_actions, page_actions, pending_action. También: POST `/learn`, GET `/stats`, POST `/search`, POST `/feedback`.', 'asistente api,assistant ask,ia api,como usar asistente'],
];

const insertKnow = db.prepare('INSERT OR IGNORE INTO knowledge (category_id, question, answer, keywords, source) VALUES (?, ?, ?, ?, ?)');
const insertKnowMany = db.transaction((rows) => { for (const row of rows) insertKnow.run(row[0], row[1], row[2], row[3], 'seed'); });
insertKnowMany(knowledge);

console.log('API data seeded successfully');
