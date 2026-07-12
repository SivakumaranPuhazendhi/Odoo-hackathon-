import { DispatchContext, RuleResult } from './index';

export const cargoWithinCapacity = (ctx: DispatchContext): RuleResult => {
  if (ctx.cargoWeightKg > ctx.vehicle.maxCapacityKg) {
    return { ok: false, message: `Cargo weight (${ctx.cargoWeightKg}kg) exceeds vehicle max capacity (${ctx.vehicle.maxCapacityKg}kg)` };
  }
  return { ok: true };
};
