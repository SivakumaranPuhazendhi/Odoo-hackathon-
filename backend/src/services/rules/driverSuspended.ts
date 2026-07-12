import { DispatchContext, RuleResult } from './index';

export const driverSuspended = (ctx: DispatchContext): RuleResult => {
  if (ctx.driver.status === 'Suspended') {
    return { ok: false, message: 'Cannot assign a suspended driver to a trip' };
  }
  return { ok: true };
};
