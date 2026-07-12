import { Vehicle, Driver } from '@prisma/client';

export type DispatchContext = {
  vehicle: Vehicle;
  driver: Driver;
  cargoWeightKg: number;
};

export type RuleResult = { ok: boolean; message?: string };
export type Rule = (ctx: DispatchContext) => RuleResult;

import { driverAvailable } from './driverAvailable';
import { driverSuspended } from './driverSuspended';
import { driverLicenseValid } from './driverLicense';
import { vehicleAvailable } from './vehicleAvailable';
import { cargoWithinCapacity } from './cargoCapacity';

const RULES: Rule[] = [
  driverAvailable,
  driverSuspended,
  driverLicenseValid,
  vehicleAvailable,
  cargoWithinCapacity
];

export function runRules(ctx: DispatchContext) {
  const failures = RULES.map(rule => rule(ctx)).filter(r => !r.ok);
  return { valid: failures.length === 0, errors: failures.map(f => f.message) };
}
