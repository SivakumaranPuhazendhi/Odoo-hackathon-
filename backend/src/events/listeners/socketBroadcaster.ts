import { eventBus } from '../eventBus';
import { io } from '../../index';

eventBus.on('TripDispatched', (e) => {
  io.emit('fleetUpdate', { type: 'TripDispatched', data: e });
});

eventBus.on('TripBlocked', (e) => {
  io.emit('fleetUpdate', { type: 'TripBlocked', data: e });
});

eventBus.on('MaintenanceLogged', (e) => {
  io.emit('fleetUpdate', { type: 'MaintenanceLogged', data: e });
});

eventBus.on('MaintenanceFlagged', (e) => {
  io.emit('fleetUpdate', { type: 'MaintenanceFlagged', data: e });
});
