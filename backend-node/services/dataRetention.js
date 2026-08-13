import { DataConsent, DataInventory, ComplianceConfig, AuditLog } from '../models/compliance.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let intervalId = null;

export function startDataRetentionScheduler() {
  if (intervalId) return;
  console.log('[DATA-RETENTION] Starting data retention scheduler (interval: 1h)');
  intervalId = setInterval(runRetentionCheck, CHECK_INTERVAL_MS);
  // Run once on start after 5 minutes
  setTimeout(runRetentionCheck, 5 * 60 * 1000);
}

export function stopDataRetentionScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[DATA-RETENTION] Data retention scheduler stopped');
  }
}

async function runRetentionCheck() {
  try {
    console.log('[DATA-RETENTION] Running retention check...');
    const configs = await ComplianceConfig.find({}).lean();
    let totalDeleted = 0;

    for (const config of configs) {
      const userId = config.userId;
      const retentionDays = parseInt(config.dataRetentionPolicy) || 1825; // default 5 years

      // Check consents with expiration dates
      const expiredConsents = await DataConsent.find({
        userId,
        expiresAt: { $lt: new Date(), $ne: null },
        revokedAt: null,
      }).lean();

      if (expiredConsents.length > 0) {
        await DataConsent.updateMany(
          { userId, expiresAt: { $lt: new Date(), $ne: null }, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
        await AuditLog.create({
          userId,
          action: 'delete',
          resource: 'consent',
          description: `Retención automática: ${expiredConsents.length} consentimiento(s) expirado(s) revocados (política: ${retentionDays} días)`,
          metadata: { automaticRetention: true, count: expiredConsents.length, retentionDays },
        });
        totalDeleted += expiredConsents.length;
        console.log(`[DATA-RETENTION] User ${userId}: revoked ${expiredConsents.length} expired consents`);
      }

      // Check old inventory items without retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const oldInventory = await DataInventory.find({
        userId,
        createdAt: { $lt: cutoffDate },
        retentionDays: { $exists: false },
        active: true,
      }).lean();

      // Mark old inventory items as inactive (don't delete, just deactivate)
      if (oldInventory.length > 0) {
        await DataInventory.updateMany(
          { userId, createdAt: { $lt: cutoffDate }, retentionDays: { $exists: false }, active: true },
          { $set: { active: false } }
        );
        await AuditLog.create({
          userId,
          action: 'modify',
          resource: 'data_inventory',
          description: `Retención automática: ${oldInventory.length} item(s) del inventario desactivado(s) por expiración (política: ${retentionDays} días)`,
          metadata: { automaticRetention: true, count: oldInventory.length, retentionDays },
        });
        console.log(`[DATA-RETENTION] User ${userId}: deactivated ${oldInventory.length} old inventory items`);
      }
    }

    if (totalDeleted > 0 || configs.length > 0) {
      console.log(`[DATA-RETENTION] Check complete. ${totalDeleted} consent(s) revoked across ${configs.length} user(s)`);
    }
  } catch (err) {
    console.error('[DATA-RETENTION] Error during retention check:', err.message);
  }
}
