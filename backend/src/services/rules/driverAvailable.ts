import { DispatchContext, RuleResult } from './index';

export const driverAvailable = (ctx: DispatchContext): RuleResult => {
  if (ctx.driver.status !== 'Available') {
    return { ok: false, message: `Driver is currently ${ctx.driver.status}` };
  }
  return { ok: true };
};
