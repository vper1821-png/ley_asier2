import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TourContext = createContext(null);

const TOUR_STORAGE_KEY = 'securelab_tour_completed';

const STEP_DEFINITIONS = [
  {
    id: 'welcome',
    title: 'Bienvenido a SecureLab',
    text: 'Tu plataforma integral de ciberseguridad y cumplimiento de la <strong>Ley 21.719</strong>.',
    subtext: 'Este recorrido te mostrará cada sección del sistema.',
    selector: '.tour-sidebar-logo',
    placement: 'right',
    icon: 'shield',
    iconGradient: ['#3b82f6', '#1d4ed8'],
  },
  {
    id: 'sidebar-nav',
    title: 'Navegación Principal',
    text: 'Menú de navegación. Desde aquí accedes a todas las secciones de la plataforma.',
    subtext: 'Haz clic en cada módulo para explorarlo.',
    selector: '.tour-nav-items',
    placement: 'right',
    icon: 'menu',
    iconGradient: ['#8b5cf6', '#6d28d9'],
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard',
    text: 'Vista general de tu infraestructura: agentes conectados, bases de datos, cumplimiento y brechas.',
    subtext: 'KPIs principales en un solo vistazo.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'dashboard',
    iconGradient: ['#3b82f6', '#1e40af'],
    nav: 'dashboard',
    detail: {
      title: 'Dashboard — Vista Detallada',
      sections: [
        {
          heading: 'Tarjetas de KPI',
          content: 'En la parte superior encontrarás <strong>5 tarjetas</strong> que muestran en tiempo real: Agentes activos, Bases de datos monitoreadas, Porcentaje de cumplimiento normativo, Brechas abiertas y Usuarios con credenciales vulnerables.',
          selector: '.tour-detail-kpi-grid',
          placement: 'bottom',
        },
        {
          heading: 'Gráficos de Tendencia',
          content: 'Los gráficos muestran la evolución de incidentes de seguridad en los últimos <strong>30 días</strong>. Puedes filtrar por rango de fechas y tipo de evento.',
          selector: '.tour-detail-stats-grid',
          placement: 'top',
        },
        {
          heading: 'Actividad Reciente',
          content: 'Un feed en tiempo real con los últimos eventos: agentes conectados/desconectados, alertas generadas, escaneos completados y cambios en el estado de bases de datos.',
          selector: '.tour-detail-summary',
          placement: 'top',
        },
        {
          heading: 'Resumen de Cumplimiento',
          content: 'Indicador circular con el porcentaje de cumplimiento de la <strong>Ley 21.719</strong>. Incluye consentimientos registrados, DPIAs completados y solicitudes ARCO respondidas.',
          selector: '.tour-detail-tabs',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'agents-section',
    title: 'Agentes de Seguridad',
    text: 'Gestiona los agentes instalados en los endpoints de tu organización.',
    subtext: 'Descargar, monitorear, bloquear o desinstalar agentes remotamente.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'monitor',
    iconGradient: ['#06b6d4', '#0e7490'],
    nav: 'agents',
    detail: {
      title: 'Agentes — Vista Detallada',
      sections: [
        {
          heading: 'Descarga de Agentes',
          content: 'Genera tokens temporales de descarga seguros para cada plataforma: <strong>Windows (x64)</strong>, <strong>Linux (x64)</strong>, <strong>macOS (Intel)</strong> y <strong>macOS (Apple Silicon)</strong>. Cada token expira en 10 minutos y permite una sola descarga.',
          selector: '.tour-detail-2',
          placement: 'left',
        },
        {
          heading: 'Monitoreo en Tiempo Real',
          content: 'La tabla de agentes muestra el hostname, sistema operativo, última conexión, estado (activo/inactivo/bloqueado) y versión del agente instalado. Se actualiza cada <strong>30 segundos</strong>.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Acciones Remotas',
          content: 'Puedes <strong>bloquear</strong> un endpoint (inhabilita USB, red y procesos sospechosos), <strong>desbloquear</strong> o <strong>desinstalar</strong> el agente completamente. Todas las acciones quedan registradas en el log de auditoría.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Alertas de Agentes',
          content: 'Cada agente reporta alertas automáticamente: intentos de acceso no autorizado, procesos maliciosos detectados, cambios en configuraciones críticas y movimientos laterales en la red.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'host-monitor',
    title: 'Monitor de Host',
    text: 'Monitorea el estado de tus servidores y hosts en tiempo real.',
    subtext: 'Uptime, métricas de rendimiento e historial de eventos.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'server',
    iconGradient: ['#10b981', '#047857'],
    nav: 'host-monitor',
    detail: {
      title: 'Monitor de Host — Vista Detallada',
      sections: [
        {
          heading: 'Estado de Hosts',
          content: 'Cada host muestra su <strong>uptime</strong>, dirección IP, sistema operativo, recursos (CPU, RAM, Disco) y el agente asociado. El estado se actualiza cada 15 segundos.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Métricas de Rendimiento',
          content: 'Gráficos de uso de CPU, memoria RAM, disco duro y ancho de banda de red. Puedes configurar <strong>alertas de umbral</strong> (ej: alertar si CPU > 90% por más de 5 minutos).',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Historial de Eventos',
          content: 'Log cronológico de todos los eventos del host: arranques, apagados, reinicios, actualizaciones de software, cambios en servicios y eventos de seguridad.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Inventario de Software',
          content: 'Listado automático de todo el software instalado en cada host, con versiones, fechas de instalación y estado de actualización. Detecta software desactualizado o no autorizado.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'alerts-section',
    title: 'Sistema de Alertas',
    text: 'Recibe notificaciones en tiempo real sobre eventos de seguridad críticos.',
    subtext: 'Alertas de intrusión, brechas y seguimiento de resolución.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'alert',
    iconGradient: ['#f59e0b', '#d97706'],
    nav: 'alerts',
    detail: {
      title: 'Alertas — Vista Detallada',
      sections: [
        {
          heading: 'Tipos de Alerta',
          content: '<strong>Crítica</strong>: Intrusión activa, ransomware, exfiltración de datos. <strong>Alta</strong>: Malware detectado, credenciales comprometidas. <strong>Media</strong>: Configuración insegura, software vulnerable. <strong>Baja</strong>: Intentos fallidos de acceso.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Filtrado y Búsqueda',
          content: 'Filtra por severidad, rango de fechas, agente origen, tipo de evento y estado (nueva/en proceso/resuelta). Búsqueda por texto libre en descripción de la alerta.',
          selector: '.tour-detail-2',
          placement: 'bottom',
        },
        {
          heading: 'Respuesta a Incidentes',
          content: 'Desde cada alerta puedes: <strong>asignar</strong> a un miembro del equipo, <strong>escalar</strong> prioridad, <strong>agregar notas</strong> de investigación, <strong>marcar como resuelta</strong> y <strong>generar reporte</strong> para auditoría.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Notificaciones Push',
          content: 'Las alertas críticas y alta se envían por <strong>email</strong> y <strong>notificación en-app</strong> inmediatamente. Puedes configurar destinatarios adicionales por tipo de alerta.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'reports-section',
    title: 'Reportes',
    text: 'Genera reportes detallados de cumplimiento y seguridad para auditorías.',
    subtext: 'Exportar en PDF, historial de reportes generados.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'report',
    iconGradient: ['#8b5cf6', '#6d28d9'],
    nav: 'reports',
    detail: {
      title: 'Reportes — Vista Detallada',
      sections: [
        {
          heading: 'Tipos de Reporte',
          content: '<strong>Cumplimiento Ley 21.719</strong>: Estado completo de cumplimiento normativo. <strong>Seguridad General</strong>: Resumen de incidentes, vulnerabilidades y estado de agentes. <strong>Auditoría</strong>: Log detallado de todas las acciones realizadas en la plataforma.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Generación Personalizada',
          content: 'Selecciona rango de fechas, secciones a incluir, formato (PDF/CSV) y nivel de detalle. Los reportes se generan en el servidor y quedan disponibles para descarga.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Historial de Reportes',
          content: 'Todos los reportes generados se almacenan con fecha, autor y estado. Puedes re-descargar reportes anteriores o programar generación automática semanal/mensual.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Exportación y Compartir',
          content: 'Descarga en <strong>PDF</strong> para impresión o <strong>CSV</strong> para análisis en Excel. Opción de enviar por email directamente desde la plataforma a auditores o autoridades.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'databases-section',
    title: 'Bases de Datos',
    text: 'Conecta y monitorea tus bases de datos con escaneo automático de datos personales.',
    subtext: 'MySQL, PostgreSQL, SQL Server. Detección de datos sensibles.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'database',
    iconGradient: ['#ec4899', '#be185d'],
    nav: 'databases',
    detail: {
      title: 'Bases de Datos — Vista Detallada',
      sections: [
        {
          heading: 'Conexiones Soportadas',
          content: 'Soporte nativo para <strong>MySQL</strong>, <strong>PostgreSQL</strong>, <strong>SQL Server</strong> y <strong>MariaDB</strong>. Las credenciales se almacenan encriptadas con AES-256. Nunca se almacenan en texto plano.',
          selector: '.tour-detail-1',
          placement: 'left',
        },
        {
          heading: 'Escaneo de Datos Personales',
          content: 'El escaneo automático detecta columnas que contienen datos personales bajo la Ley 21.719: <strong>RUT</strong>, <strong>nombres</strong>, <strong>direcciones</strong>, <strong>emails</strong>, <strong>teléfonos</strong>, <strong>datos de salud</strong> y <strong>datos financieros</strong>. Clasifica la sensibilidad de cada campo.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Monitoreo Continuo',
          content: 'Escaneos programados (diario/semanal) que detectan cambios en el esquema, nuevas tablas con datos sensibles, y accesos no autorizados. Alertas automáticas si se detecta una fuga potencial.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Inventario de Datos',
          content: 'Dashboard con el inventario completo: total de registros con datos personales, distribución por tipo de dato, tablas más expuestas y tiempo de retención de cada categoría.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'compliance-section',
    title: 'Cumplimiento Normativo',
    text: 'Módulo completo de cumplimiento de la Ley 21.719 de protección de datos personales.',
    subtext: 'Consentimientos, inventario, DPIAs, brechas y capacitación.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'check',
    iconGradient: ['#22c55e', '#15803d'],
    nav: 'compliance',
    detail: {
      title: 'Cumplimiento — Vista Detallada',
      sections: [
        {
          heading: 'Registro de Consentimientos',
          content: 'Registra y gestiona el <strong>consentimiento</strong> de cada titular: fecha, propósito, alcance, si es explícito o tácito, y estado (activo/revocado/expirado). Genera evidencia audit trail completa.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Inventario de Datos Personales',
          content: 'Mapa visual de todos los datos personales que maneja tu organización: qué datos, dónde están almacenados, con quién se comparten, base legal para el tratamiento y período de retención.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'DPIAs (Evaluaciones de Impacto)',
          content: 'Crea y gestiona Evaluaciones de Impacto a la Protección de Datos Personales. Formulario guiado con criterios del framework, nivel de riesgo, medidas de mitigación y seguimiento de implementación.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Gestión de Brechas de Datos',
          content: 'Registra brechas de seguridad que involucren datos personales. Calcula automáticamente si se requiere notificación a la <strong>ANPD</strong> o a los titulares según el plazo de 72 horas.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'hardening-section',
    title: 'Hardening de Seguridad',
    text: 'Análisis de endurecimiento de seguridad para identificar configuraciones débiles.',
    subtext: 'Análisis de configuraciones, recomendaciones y score global.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'shield-alert',
    iconGradient: ['#ef4444', '#b91c1c'],
    nav: 'hardening',
    detail: {
      title: 'Hardening — Vista Detallada',
      sections: [
        {
          heading: 'Análisis de Configuraciones',
          content: 'Escaneo automático de <strong>200+ reglas</strong> de seguridad: políticas de contraseña, configuración de firewall, servicios innecesarios abiertos, permisos de archivos críticos y configuración de red.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Score de Seguridad',
          content: 'Calificación global de <strong>0 a 100</strong> basada en el peso de cada regla. Desglose por categoría: Red, Sistema, Aplicaciones, Acceso y Cifrado. Tendencia histórica del score.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Recomendaciones',
          content: 'Cada hallazgo incluye: descripción del problema, nivel de riesgo, pasos específicos para remediación y referencias a estándares (CIS Benchmark, NIST, ISO 27001).',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Exportación para Auditorías',
          content: 'Genera reportes de hardening en PDF con evidencia de cada hallazgo, estado de remediación y comparativa con benchmarks internacionales. Ideal para certificaciones ISO 27001.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'tickets-section',
    title: 'Soporte Técnico',
    text: 'Sistema de soporte técnico integrado. Crea y gestiona tickets de ayuda.',
    subtext: 'Crear tickets con prioridad, seguimiento de estado e historial.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'ticket',
    iconGradient: ['#6366f1', '#4338ca'],
    nav: 'tickets',
    detail: {
      title: 'Soporte Técnico — Vista Detallada',
      sections: [
        {
          heading: 'Crear Tickets',
          content: 'Formulario con: <strong>título</strong>, <strong>descripción detallada</strong>, <strong>categoría</strong> (seguridad, cumplimiento, técnico, consulta), <strong>prioridad</strong> (baja/media/alta/crítica) y <strong>archivos adjuntos</strong>.',
          selector: '.tour-detail-1',
          placement: 'left',
        },
        {
          heading: 'Seguimiento de Estado',
          content: 'Estados del ticket: <strong>Abierto</strong> → <strong>En Progreso</strong> → <strong>Esperando Respuesta</strong> → <strong>Resuelto</strong> → <strong>Cerrado</strong>. Cada cambio queda registrado con timestamp y responsable.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Comentarios y Comunicación',
          content: 'Hilo de comentarios interno entre miembros del equipo y communication directa con el soporte de SecureLab. Historial completo de la conversación adjunto al ticket.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Estadísticas de Soporte',
          content: 'Dashboard con: tickets abiertos por prioridad, tiempo promedio de resolución, tickets por categoría y satisfacción del usuario post-resolución.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'payments-section',
    title: 'Pagos',
    text: 'Gestiona los pagos y facturación de tu plan de servicio.',
    subtext: 'Pagos pendientes, historial y comprobantes de transferencia.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'payment',
    iconGradient: ['#14b8a6', '#0d9488'],
    nav: 'payments',
    detail: {
      title: 'Pagos — Vista Detallada',
      sections: [
        {
          heading: 'Estado de Pagos',
          content: 'Vista clara de pagos <strong>pendientes</strong>, <strong>pagados</strong> y <strong>vencidos</strong>. Incluye monto, fecha límite, concepto y estado de procesamiento.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Métodos de Pago',
          content: 'Soporte para <strong>transferencia bancaria</strong> (con subida de comprobante), <strong>tarjeta de crédito/débito</strong> y <strong>QR de pago</strong>. Todos los pagos quedan registrados con evidencia.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Historial de Transacciones',
          content: 'Registro completo de todas las transacciones: fecha, monto, método, estado, número de comprobante y referencia. Exportable en CSV para contabilidad.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
        {
          heading: 'Facturación',
          content: 'Generación automática de <strong>boletas</strong> y <strong>facturas</strong> según corresponda. Descarga en PDF con todos los datos tributarios requeridos por el SII de Chile.',
          selector: '.tour-detail-2',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'arco-section',
    title: 'Solicitudes ARCO',
    text: 'Gestiona las solicitudes ARCO de los titulares de datos personales.',
    subtext: 'Acceso, Rectificación, Cancelación, Oposición. Seguimiento de plazos.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'file',
    iconGradient: ['#f97316', '#c2410c'],
    nav: 'arco',
    detail: {
      title: 'Solicitudes ARCO — Vista Detallada',
      sections: [
        {
          heading: 'Tipos de Solicitud',
          content: '<strong>Acceso</strong>: El titular quiere ver qué datos tiene la organización. <strong>Rectificación</strong>: Corregir datos inexactos. <strong>Cancelación</strong>: Eliminar datos. <strong>Oposición</strong>: Oponerse al tratamiento de sus datos.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Plazos Legales',
          content: 'La Ley 21.719 establece plazos máximos de respuesta. El sistema muestra <strong>cuenta regresiva</strong> para cada solicitud y genera alertas automáticas antes del vencimiento.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Proceso de Respuesta',
          content: 'Workflow guiado: verificación de identidad → revisión de solicitud → ejecución en bases de datos → generación de respuesta formal → notificación al titular. Todo documentado para auditoría.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Reporte de Cumplimiento ARCO',
          content: 'Dashboard con solicitudes totales, por tipo, tasa de cumplimiento, tiempo promedio de respuesta y solicitudes pendientes próximas a vencer.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'dpo-section',
    title: 'Panel del DPO',
    text: 'Dashboard dedicado para el Delegado de Protección de Datos.',
    subtext: 'Vista consolidada, métricas de protección y reportes para autoridades.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'user',
    iconGradient: ['#a855f7', '#7c3aed'],
    nav: 'dpo',
    detail: {
      title: 'Panel DPO — Vista Detallada',
      sections: [
        {
          heading: 'Dashboard Consolidado',
          content: 'Vista unificada del estado de protección de datos de toda la organización. Incluye <strong>KPIs de cumplimiento</strong>, alertas activas, solicitudes ARCO pendientes y brechas sin resolver.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Métricas de Protección',
          content: 'Gráficos de tendencia: consentimientos obtenidos vs. revocados, solicitudes ARCO por mes, tiempo promedio de respuesta, DPIAs completados y brechas notificadas a la ANPD.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Reportes para Autoridades',
          content: 'Generación de reportes formales listos para presentar ante la <strong>ANPD</strong> o auditorías externas. Incluyen evidencia documental, timeline de eventos y estado de cada obligación.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
        {
          heading: 'Calendario de Obligaciones',
          content: 'Vista calendarizada de todas las obligaciones recurrentes: actualización de políticas, capacitaciones, revisión de DPIAs, informes anuales y auditorías programadas.',
          selector: '.tour-detail-1',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'settings-section',
    title: 'Configuración',
    text: 'Administra la configuración de tu cuenta y preferencias de seguridad.',
    subtext: 'Contraseña, autenticación 2FA y gestión de datos.',
    selector: '.tour-main-content',
    placement: 'top',
    icon: 'settings',
    iconGradient: ['#6b7280', '#374151'],
    nav: 'settings',
    detail: {
      title: 'Configuración — Vista Detallada',
      sections: [
        {
          heading: 'Seguridad de la Cuenta',
          content: 'Cambia tu contraseña (con política de complejidad), activa <strong>autenticación de dos factores (2FA)</strong> vía TOTP y gestiona sesiones activas. Puedes cerrar todas las sesiones remotas con un clic.',
          selector: '.tour-main-content',
          placement: 'top',
        },
        {
          heading: 'Datos Personales',
          content: 'Actualiza tu nombre, email y teléfono. Exporta todos tus datos en formato JSON bajo la Ley 21.719 (derecho de acceso). Solicita la eliminación completa de tu cuenta.',
          selector: '.tour-main-content',
          placement: 'top',
        },
        {
          heading: 'Preferencias',
          content: 'Configura zona horaria, formato de fecha, moneda y notificaciones por email. Elige qué tipos de alertas quieres recibir en tu bandeja de entrada.',
          selector: '.tour-main-content',
          placement: 'top',
        },
        {
          heading: 'Log de Actividad',
          content: 'Historial completo de acciones en tu cuenta: inicios de sesión, cambios de configuración, IP de origen y dispositivo utilizado. Ideal para detectar accesos no autorizados.',
          selector: '.tour-main-content',
          placement: 'top',
        },
      ],
    },
  },
  {
    id: 'theme-section',
    title: 'Personalización Visual',
    text: 'Personaliza la apariencia con 12 temas predefinidos o crea tus propios colores.',
    subtext: 'Selector de temas en la parte inferior del sidebar.',
    selector: '.tour-theme-btn',
    placement: 'top',
    icon: 'palette',
    iconGradient: ['#ec4899', '#be185d'],
  },
  {
    id: 'language-section',
    title: 'Multi-idioma',
    text: 'Cambia entre Español e Inglés con un clic.',
    subtext: 'La interfaz se adapta al idioma seleccionado.',
    selector: '.tour-lang-btn',
    placement: 'top',
    icon: 'globe',
    iconGradient: ['#3b82f6', '#1d4ed8'],
  },
  {
    id: 'notifications-section',
    title: 'Notificaciones',
    text: 'Campana de notificaciones con alertas de seguridad y actualizaciones de agentes.',
    subtext: 'Eventos importantes en tiempo real.',
    selector: '.tour-notifications',
    placement: 'left',
    icon: 'bell',
    iconGradient: ['#f59e0b', '#d97706'],
  },
  {
    id: 'logout-section',
    title: 'Cerrar Sesión',
    text: 'Cierra tu sesión de forma segura cuando termines de trabajar.',
    subtext: 'Se recomienda cerrar sesión en equipos compartidos.',
    selector: '.tour-logout-btn',
    placement: 'left',
    icon: 'logout',
    iconGradient: ['#ef4444', '#b91c1c'],
    nav: 'dashboard',
  },
  {
    id: 'support-chat',
    title: 'Asistente Virtual',
    text: 'El chat de soporte está disponible 24/7 para resolver tus dudas.',
    subtext: 'Haz clic en el ícono de chat en la esquina inferior derecha.',
    selector: '.tour-support-chat',
    placement: 'left',
    icon: 'chat',
    iconGradient: ['#06b6d4', '#0891b2'],
  },
];

const SVG_ICONS = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  report: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  check: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
  ticket: '<path d="M2 9a3 3 0 013-3h14a3 3 0 013 3 3 3 0 01-3 3v0a3 3 0 013 3 3 3 0 01-3 3H5a3 3 0 01-3-3 3 3 0 013-3v0a3 3 0 01-3-3z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  payment: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
  bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  'check-big': '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
};

function TourIcon({ name, size = 20, color = 'white' }) {
  const d = SVG_ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d }} />
  );
}

function getTargetRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computePosition(targetRect, placement, tooltipW, tooltipH, gap = 14) {
  if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 20;
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  const isWideTarget = targetRect.width > 300;

  let top, left;

  if (placement === 'center') {
    return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }

  if (isWideTarget && (placement === 'top' || placement === 'bottom')) {
    left = cx - tooltipW / 2;
    top = targetRect.top + gap + 8;
    if (left < pad) left = pad;
    if (left + tooltipW > vw - pad) left = vw - tooltipW - pad;
    if (top + tooltipH > vh - pad) top = vh - tooltipH - pad;
    if (top < pad) top = pad;
    return { top: `${top}px`, left: `${left}px`, transform: 'none' };
  }

  switch (placement) {
    case 'right':
      left = targetRect.right + gap;
      top = cy - tooltipH / 2;
      if (left + tooltipW > vw - pad) {
        left = targetRect.left - gap - tooltipW;
      }
      if (left < pad) left = pad;
      break;
    case 'left':
      left = targetRect.left - gap - tooltipW;
      top = cy - tooltipH / 2;
      if (left < pad) {
        left = targetRect.right + gap;
      }
      if (left + tooltipW > vw - pad) left = vw - tooltipW - pad;
      break;
    case 'top':
      left = cx - tooltipW / 2;
      top = targetRect.top - gap - tooltipH;
      if (top < pad) {
        top = targetRect.bottom + gap;
      }
      if (left < pad) left = pad;
      if (left + tooltipW > vw - pad) left = vw - tooltipW - pad;
      break;
    case 'bottom':
    default:
      left = cx - tooltipW / 2;
      top = targetRect.bottom + gap;
      if (top + tooltipH > vh - pad) {
        top = targetRect.top - gap - tooltipH;
      }
      if (left < pad) left = pad;
      if (left + tooltipW > vw - pad) left = vw - tooltipW - pad;
      break;
  }

  if (top < pad) top = pad;
  if (top + tooltipH > vh - pad) top = vh - tooltipH - pad;

  return { top: `${top}px`, left: `${left}px`, transform: 'none' };
}

/* ── Tour Tooltip ── */
function TourTooltip({ step, stepIndex, totalSteps, onNext, onBack, onSkip, onComplete, onExplore }) {
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
  const [targetRect, setTargetRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('overview');
  const [detailIdx, setDetailIdx] = useState(0);
  const detailRef = useRef(null);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const hasDetail = !!step.detail;
  const detailSections = step.detail?.sections || [];
  const totalDetailSteps = detailSections.length;
  const isDetailLast = detailIdx >= totalDetailSteps - 1;

  const currentDetail = mode === 'detail' ? detailSections[detailIdx] : null;
  const effectiveSelector = currentDetail?.selector || step.selector;
  const effectivePlacement = currentDetail?.placement || step.placement || 'right';

  const [measuring, setMeasuring] = useState(false);

  useEffect(() => {
    setMode('overview');
    setDetailIdx(0);
    setVisible(false);
    setMeasuring(false);

    const t1 = setTimeout(() => {
      const r = getTargetRect(step.selector);
      if (r) setTargetRect(r);
      setPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setVisible(true);
      setMeasuring(true);
    }, 250);
    return () => clearTimeout(t1);
  }, [step.selector, step.placement, stepIndex]);

  useEffect(() => {
    if (!measuring || !tipRef.current) return;
    const r = getTargetRect(effectiveSelector);
    const w = tipRef.current.offsetWidth || 380;
    const h = tipRef.current.offsetHeight || 300;
    if (r) {
      setPos(computePosition(r, effectivePlacement, w, h));
    }
    requestAnimationFrame(() => setMeasuring(false));
  }, [measuring, effectiveSelector, effectivePlacement, mode, detailIdx]);

  useEffect(() => {
    if (mode === 'detail' && visible) {
      setMeasuring(true);
    }
  }, [mode, detailIdx]);

  useEffect(() => {
    if (!visible || measuring) return;
    let alive = true;
    const reposition = () => {
      if (!alive) return;
      const r = getTargetRect(effectiveSelector);
      if (r) setTargetRect(r);
      if (tipRef.current) {
        const w = tipRef.current.offsetWidth;
        const h = tipRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          setPos(computePosition(r, effectivePlacement, w, h));
        }
      }
    };
    const t = setTimeout(reposition, 200);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      alive = false;
      clearTimeout(t);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [visible, measuring, effectiveSelector, effectivePlacement, mode, detailIdx]);

  const highlightStyle = targetRect ? {
    top: `${targetRect.top - 8}px`,
    left: `${targetRect.left - 8}px`,
    width: `${targetRect.width + 16}px`,
    height: `${targetRect.height + 16}px`,
    borderRadius: '12px',
    opacity: 1,
  } : { opacity: 0 };

  const progress = mode === 'detail'
    ? ((stepIndex + (detailIdx + 1) / totalDetailSteps) / totalSteps) * 100
    : ((stepIndex + 1) / totalSteps) * 100;

  const handleExplore = () => {
    setMode('detail');
    setDetailIdx(0);
  };

  const handleDetailNext = () => {
    if (isDetailLast) {
      onNext();
    } else {
      setDetailIdx(i => i + 1);
    }
  };

  const handleDetailPrev = () => {
    if (detailIdx === 0) {
      setMode('overview');
    } else {
      setDetailIdx(i => i - 1);
    }
  };

  const tooltipClass = `tour-tooltip ${visible ? 'tour-tooltip-visible' : ''}`;

  return (
    <>
      <div className={`tour-overlay ${visible ? 'tour-overlay-visible' : ''}`} />
      <div
        className={`tour-highlight ${visible ? 'tour-highlight-visible' : ''}`}
        style={highlightStyle}
      />

      <div
        ref={tipRef}
        className={tooltipClass}
        style={{
          position: 'fixed',
          zIndex: 100000,
          ...pos,
        }}
      >
        <div className="tour-tooltip-progress">
          <div className="tour-tooltip-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="tour-tooltip-body">
          <div className="tour-tooltip-header">
            <div className="tour-tooltip-icon" style={{
              background: `linear-gradient(135deg, ${step.iconGradient[0]}, ${step.iconGradient[1]})`,
            }}>
              <TourIcon name={step.icon} size={16} />
            </div>
            <div className="tour-tooltip-title-area">
              <span className="tour-tooltip-step-badge">{stepIndex + 1} de {totalSteps}</span>
              <h3 className="tour-tooltip-title">{mode === 'detail' && step.detail ? step.detail.title : step.title}</h3>
            </div>
            <button className="tour-tooltip-close" onClick={onSkip} title="Omitir tour">
              <TourIcon name="x" size={14} />
            </button>
          </div>

          {mode === 'overview' && (
            <div className="tour-tooltip-text">
              <p dangerouslySetInnerHTML={{ __html: step.text }} />
              {step.subtext && <p className="tour-tooltip-subtext">{step.subtext}</p>}
            </div>
          )}

          {mode === 'detail' && detailSections[detailIdx] && (
            <div className="tour-tooltip-text" key={detailIdx}>
              <div className="tour-detail-badge">
                <span className="tour-detail-badge-num">{detailIdx + 1}</span>
                <span className="tour-detail-badge-total">/ {totalDetailSteps}</span>
              </div>
              <h4 className="tour-detail-heading-inline">
                {detailSections[detailIdx].heading}
              </h4>
              <p dangerouslySetInnerHTML={{ __html: detailSections[detailIdx].content }} />
            </div>
          )}

          <div className="tour-tooltip-footer">
            <div className="tour-tooltip-footer-left">
              <button className="tour-btn-skip" onClick={onSkip}>Omitir</button>
            </div>
            <div className="tour-tooltip-nav">
              {mode === 'overview' && !isFirst && (
                <button className="tour-btn-back" onClick={onBack}>
                  <TourIcon name="chevronLeft" size={13} />
                  Atrás
                </button>
              )}
              {mode === 'overview' && hasDetail && (
                <button className="tour-btn-explore" onClick={handleExplore}>
                  <TourIcon name="book" size={13} />
                  Detalles
                </button>
              )}
              {mode === 'detail' && (
                <button className="tour-btn-back" onClick={handleDetailPrev}>
                  <TourIcon name="chevronLeft" size={13} />
                  {detailIdx === 0 ? 'Volver' : 'Atrás'}
                </button>
              )}
              {mode === 'overview' && (
                isLast ? (
                  <button className="tour-btn-finish" onClick={onComplete}>
                    Finalizar
                  </button>
                ) : (
                  <button className="tour-btn-next" onClick={onNext}>
                    Siguiente
                    <TourIcon name="chevronRight" size={13} />
                  </button>
                )
              )}
              {mode === 'detail' && (
                isDetailLast ? (
                  <button className="tour-btn-next" onClick={handleDetailNext}>
                    Continuar
                    <TourIcon name="arrowRight" size={13} />
                  </button>
                ) : (
                  <button className="tour-btn-next" onClick={handleDetailNext}>
                    Siguiente
                    <TourIcon name="chevronRight" size={13} />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function TourProvider({ children, setActiveNav, setMobileSidebar }) {
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStartedRef = useRef(false);

  const hasCompletedTour = useCallback(() => {
    try { return localStorage.getItem(TOUR_STORAGE_KEY) === 'true'; } catch { return false; }
  }, []);

  const markTourCompleted = useCallback(() => {
    try { localStorage.setItem(TOUR_STORAGE_KEY, 'true'); } catch {}
  }, []);

  const navTo = useCallback((navId) => {
    if (setActiveNav) setActiveNav(navId);
    if (setMobileSidebar) setMobileSidebar(false);
  }, [setActiveNav, setMobileSidebar]);

  const currentStep = STEP_DEFINITIONS[stepIndex];

  const startTour = useCallback(() => {
    setStepIndex(0);
    setRunning(true);
  }, []);

  const cancelTour = useCallback(() => {
    setRunning(false);
    markTourCompleted();
  }, [markTourCompleted]);

  const nextStep = useCallback(() => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= STEP_DEFINITIONS.length) {
      setRunning(false);
      markTourCompleted();
      return;
    }
    const nextDef = STEP_DEFINITIONS[nextIdx];
    if (nextDef.nav) navTo(nextDef.nav);
    setTimeout(() => setStepIndex(nextIdx), nextDef.nav ? 200 : 0);
  }, [stepIndex, navTo, markTourCompleted]);

  const prevStep = useCallback(() => {
    const prevIdx = stepIndex - 1;
    if (prevIdx < 0) return;
    const prevDef = STEP_DEFINITIONS[prevIdx];
    if (prevDef.nav) navTo(prevDef.nav);
    setTimeout(() => setStepIndex(prevIdx), prevDef.nav ? 200 : 0);
  }, [stepIndex, navTo]);

  const completeTour = useCallback(() => {
    setRunning(false);
    markTourCompleted();
  }, [markTourCompleted]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!hasCompletedTour()) {
      autoStartedRef.current = true;
      const timer = setTimeout(() => startTour(), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const value = {
    startTour,
    cancelTour,
    isRunning: running,
    hasCompletedTour,
    markTourCompleted,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {running && currentStep && createPortal(
        <TourTooltip
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={STEP_DEFINITIONS.length}
          onNext={nextStep}
          onBack={prevStep}
          onSkip={cancelTour}
          onComplete={completeTour}
          onExplore={() => {}}
        />,
        document.body
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
