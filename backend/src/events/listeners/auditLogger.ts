import { eventBus } from '../eventBus';
import { prisma } from '../../index';

eventBus.on('TripDispatched', async (e) => {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: 'TripDispatched',
        entityType: 'Trip',
        entityId: e.tripId,
        detail: `Dispatched vehicle ${e.vehicleId} with driver ${e.driverId}. Risk score: ${e.riskScore}`,
        actor: e.actor || 'system'
      }
    });
  } catch (err) {
    console.error('Failed to log TripDispatched:', err);
  }
});

eventBus.on('TripBlocked', async (e) => {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: 'TripBlocked',
        entityType: 'Trip',
        entityId: e.tripId || 0, // 0 means it never got created
        detail: `Trip blocked. Errors: ${e.errors.join('; ')}`,
        actor: e.actor || 'system'
      }
    });
  } catch (err) {
    console.error('Failed to log TripBlocked:', err);
  }
});

eventBus.on('MaintenanceLogged', async (e) => {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: 'MaintenanceLogged',
        entityType: 'Vehicle',
        entityId: e.vehicleId,
        detail: `Vehicle locked for maintenance. Cost: ${e.cost}`,
        actor: 'system'
      }
    });
  } catch (err) {
    console.error('Failed to log MaintenanceLogged:', err);
  }
});
