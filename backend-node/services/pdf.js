import PDFDocument from 'pdfkit';

export async function generateSecurityReport(data, format = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margins: { top: format.margins || 20, bottom: format.margins || 20, left: format.margins || 20, right: format.margins || 20 },
      info: { Title: 'Invisia V2 Security Report', Author: 'Invisia V2' },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - (format.margins || 20) * 2;

    // Header
    if (format.headerText) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e')
        .text(format.headerText, { align: 'center' });
      doc.moveDown(0.5);
    }

    // Report metadata
    doc.fontSize(9).font('Helvetica').fillColor('#666')
      .text(`Generado: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(1);

    // Horizontal line
    doc.moveTo((format.margins || 20), doc.y)
      .lineTo(pageWidth + (format.margins || 20), doc.y)
      .strokeColor('#3b82f6').lineWidth(2).stroke();
    doc.moveDown(1);

    // Summary section
    if (data.summary) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Resumen Ejecutivo');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#333').text(data.summary);
      doc.moveDown(1);
    }

    // Stats cards
    if (data.stats) {
      drawSection(doc, 'Estadísticas del Sistema', data.stats, pageWidth, format);
    }

    // Agents
    if (data.agents && data.agents.length > 0) {
      drawSection(doc, 'Agentes Conectados', data.agents.map(a => ({
        Hostname: a.hostname,
        Plataforma: a.platform,
        IP: a.ipAddress,
        Estado: a.status,
        'Último Heartbeat': a.lastHeartbeat ? new Date(a.lastHeartbeat).toLocaleString() : '-',
        Firewall: a.firewallStatus || 'unknown',
        'Usuarios Bloqueados': (a.blockedUsers || []).join(', ') || 'none'
      })), pageWidth, format);
    }

    // Alerts
    if (data.alerts && data.alerts.length > 0) {
      drawSection(doc, 'Alertas de Seguridad', data.alerts.map(a => ({
        Título: a.title,
        Severidad: a.severity,
        Fuente: a.source || '-',
        Estado: a.resolved ? 'Resuelta' : 'Pendiente',
        Creada: new Date(a.createdAt).toLocaleString()
      })), pageWidth, format);
    }

    // Firewall rules
    if (data.firewallRules && data.firewallRules.length > 0) {
      drawSection(doc, 'Reglas de Firewall', data.firewallRules.map(r => ({
        Nombre: r.name,
        Tipo: r.type,
        Acción: r.action,
        Protocolo: r.protocol || 'any',
        Puerto: r.port || 'any',
        Estado: r.enabled ? 'Activa' : 'Inactiva'
      })), pageWidth, format);
    }

    // AI Analysis
    if (data.aiAnalysis) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Análisis IA');
      doc.moveDown(0.5);
      if (data.aiAnalysis.recommendations) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Recomendaciones:');
        doc.moveDown(0.3);
        for (const rec of data.aiAnalysis.recommendations) {
          doc.fontSize(10).font('Helvetica').fillColor('#444')
            .text(`• ${rec.description || rec}`);
        }
      }
      if (data.aiAnalysis.risks) {
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#c0392b').text('Riesgos Detectados:');
        doc.moveDown(0.3);
        for (const risk of data.aiAnalysis.risks) {
          doc.fontSize(10).font('Helvetica').fillColor('#444')
            .text(`• ${risk.description || risk}`);
        }
      }
    }

    // Footer
    if (format.footerText) {
      doc.moveDown(2);
      doc.moveTo((format.margins || 20), doc.y)
        .lineTo(pageWidth + (format.margins || 20), doc.y)
        .strokeColor('#ccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').fillColor('#999')
        .text(format.footerText, { align: 'center' });
    }

    if (format.pageNumbers) {
      // Add page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica').fillColor('#999')
          .text(`Página ${i + 1} de ${pages.count}`,
            (format.margins || 20), doc.page.height - (format.margins || 20) - 10,
            { align: 'center', width: pageWidth });
      }
    }

    doc.end();
  });
}

function drawSection(doc, title, items, pageWidth, format) {
  doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text(title);
  doc.moveDown(0.5);

  if (!items || (Array.isArray(items) && items.length === 0)) {
    doc.fontSize(10).font('Helvetica').fillColor('#999').text('No hay datos disponibles.');
    return;
  }

  if (Array.isArray(items)) {
    // Table header
    const keys = Object.keys(items[0] || {});
    if (keys.length > 0) {
      const colW = Math.min(120, (pageWidth - 4) / keys.length);
      let y = doc.y;

      // Draw header
      doc.rect((format.margins || 20), y, pageWidth, 18).fill('#1a1a2e');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#fff');
      let x = (format.margins || 20) + 2;
      for (const key of keys) {
        doc.text(key, x, y + 4, { width: colW, align: 'left' });
        x += colW;
      }

      // Draw rows
      doc.fontSize(7).font('Helvetica').fillColor('#333');
      for (const item of items) {
        y += 18;
        if (y > doc.page.height - 40) {
          doc.addPage();
          y = (format.margins || 20);
        }
        // Alternating row color
        const idx = items.indexOf(item);
        if (idx % 2 === 1) {
          doc.rect((format.margins || 20), y, pageWidth, 18).fill('#f5f5f5');
        }
        x = (format.margins || 20) + 2;
        for (const key of keys) {
          const val = String(item[key] ?? '-');
          doc.text(val, x, y + 4, { width: colW, align: 'left' });
          x += colW;
        }
      }
    }
  } else if (typeof items === 'object') {
    for (const [key, val] of Object.entries(items)) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#555').text(`${key}: `, { continued: true })
        .font('Helvetica').fillColor('#333').text(String(val ?? '-'));
    }
  }
}

export default { generateSecurityReport };
