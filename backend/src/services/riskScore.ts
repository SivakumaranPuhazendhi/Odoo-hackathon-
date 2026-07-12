export function computeRiskScore(driverHoursSinceRest: number, daysSinceMaintenance: number, cargoRatio: number) {
  const score = (driverHoursSinceRest / 12) * 40
              + (daysSinceMaintenance / 90) * 35
              + cargoRatio * 25;
  return Math.min(100, Math.round(score));
}
