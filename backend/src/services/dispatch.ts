import { prisma } from '../index';
import { runRules } from './rules';
import { eventBus } from '../events/eventBus';
import { computeRiskScore } from './riskScore';

export async function dispatchTrip(vehicleId: number, driverId: number, cargoWeightKg: number) {
  // 1. Fetch Vehicle and Driver
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });

  if (!vehicle) return { success: false, errors: ['Vehicle not found'] };
  if (!driver) return { success: false, errors: ['Driver not found'] };

  // 2. Run Pluggable Rule Engine
  const { valid, errors } = runRules({ vehicle, driver, cargoWeightKg });
  
  if (!valid) {
    eventBus.emit('TripBlocked', { tripId: null, errors, vehicleId, driverId });
    return { success: false, errors };
  }

  // 3. Dispatch Atomically
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Mock metrics for risk score
      const cargoRatio = cargoWeightKg / vehicle.maxCapacityKg;
      const riskScore = computeRiskScore(8, 30, cargoRatio);

      // Create the trip in Draft state initially
      const trip = await tx.trip.create({
        data: {
          vehicleId,
          driverId,
          cargoWeightKg,
          status: 'Draft',
          riskScore,
          startDate: null
        }
      });

      // Call Postgres atomic dispatch function to finalize the transaction
      await tx.$executeRaw`SELECT dispatch_trip_atomic(${trip.id}, ${vehicleId}, ${driverId}, ${riskScore})`;

      // Re-fetch the trip since the function updated it
      const updatedTrip = await tx.trip.findUnique({ where: { id: trip.id } });
      
      if (!updatedTrip) {
        throw new Error('Trip was not found after atomic dispatch');
      }

      return { trip: updatedTrip, riskScore };
    });

    eventBus.emit('TripDispatched', { 
      tripId: result.trip.id, 
      vehicleId, 
      driverId, 
      riskScore: result.riskScore 
    });
    
    return { success: true, trip: result.trip };
  } catch (err: any) {
    return { success: false, errors: [err.message] };
  }
}
