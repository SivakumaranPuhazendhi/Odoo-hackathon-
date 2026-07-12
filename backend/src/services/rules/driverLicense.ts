import { DispatchContext, RuleResult } from './index';

export const driverLicenseValid = (ctx: DispatchContext): RuleResult => {
  if (new Date(ctx.driver.licenseExpiry) < new Date()) {
    return { ok: false, message: 'Driver license has expired' };
  }
  return { ok: true };
};
