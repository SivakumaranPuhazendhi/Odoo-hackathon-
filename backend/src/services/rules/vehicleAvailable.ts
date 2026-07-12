import { DispatchContext, RuleResult } from './index';

export const vehicleAvailable = (ctx: DispatchContext): RuleResult => {
  if (ctx.vehicle.status !== 'Available') {
    return { ok: false, message: `Vehicle is currently ${ctx.vehicle.status}` };
  }
  return { ok: true };
};
