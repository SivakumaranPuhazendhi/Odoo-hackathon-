import express from 'express';
import { prisma } from './index';
import { dispatchTrip } from './services/dispatch';
import { eventBus } from './events/eventBus';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { authenticate, authorizeRoles } from './middleware/auth';

const router = express.Router();

// Apply authentication to all routes in this file
router.use(authenticate);

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  const vehicles = await prisma.vehicle.findMany();
  res.json(vehicles);
});

// Get all drivers
router.get('/drivers', async (req, res) => {
  const drivers = await prisma.driver.findMany({ include: { user: true } });
  res.json(drivers);
});

// Get audit logs
router.get('/audit-log', authorizeRoles('Fleet Manager', 'Safety Officer'), async (req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(logs);
});

// Create a trip (V2 using Dispatch Service & Rules Engine)
router.post('/trips', authorizeRoles('Fleet Manager'), async (req, res) => {
  const { vehicleId, driverId, cargoWeightKg } = req.body;
  const result = await dispatchTrip(Number(vehicleId), Number(driverId), Number(cargoWeightKg));
  
  if (!result.success) {
    return res.status(400).json({ error: result.errors?.join('; ') });
  }
  res.json(result.trip);
});

// AI Copilot Endpoint (Powered by Gemini)
router.post('/copilot', authorizeRoles('Fleet Manager'), async (req, res) => {
  const { text } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ needsClarification: "GEMINI_API_KEY environment variable is not set on the backend. Please add it to use the AI Copilot." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const vehicles = await prisma.vehicle.findMany({ select: { licensePlate: true, status: true, maxCapacityKg: true } });
    const drivers = await prisma.driver.findMany({ include: { user: { select: { name: true } } } });
    const fleetState = {
      vehicles: vehicles.map(v => `${v.licensePlate} (${v.status}, Max: ${v.maxCapacityKg}kg)`),
      drivers: drivers.map(d => `${d.user.name} (${d.status})`)
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Request: ${text}\n\nAvailable Fleet State: ${JSON.stringify(fleetState)}`,
      config: {
        systemInstruction: `You are a dispatch assistant for TransitOps. 
Given a natural-language request and the current list of available vehicles/drivers (with status and capacity), 
extract the intent and return STRICT JSON matching the schema. 
If the user's intent is ambiguous or misses information, populate the 'clarify' field with a short question.
Otherwise, populate vehicle_plate, driver_name, and cargo_weight_kg. 
Never invent a vehicle or driver not in the provided list.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vehicle_plate: { type: Type.STRING },
            driver_name: { type: Type.STRING },
            cargo_weight_kg: { type: Type.NUMBER },
            clarify: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    const intent = JSON.parse(resultText);

    if (intent.clarify) {
      return res.json({ needsClarification: intent.clarify });
    }

    if (!intent.vehicle_plate || !intent.driver_name || !intent.cargo_weight_kg) {
       return res.json({ needsClarification: "I couldn't parse the necessary dispatch info. Please try again." });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { licensePlate: intent.vehicle_plate } });
    const driverUser = await prisma.user.findFirst({ where: { name: { contains: intent.driver_name, select: 'name' } } });
    
    if (!vehicle || !driverUser) {
      return res.json({ needsClarification: "I couldn't find that exact vehicle or driver in the system." });
    }
    
    const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
    if (!driver) {
      return res.json({ needsClarification: "That user is not a driver." });
    }

    // Use the EXACT SAME dispatch function as the manual UI
    const result = await dispatchTrip(vehicle.id, driver.id, intent.cargo_weight_kg);
    
    res.json({
      success: result.success,
      explanation: result.success
        ? `Dispatched ${vehicle.licensePlate} with ${driverUser.name}.`
        : `Couldn't dispatch: ${result.errors?.join(', ')}`
    });
  } catch (err: any) {
    console.error(err);
    res.json({ needsClarification: "An error occurred while connecting to the AI Copilot." });
  }
});

// Log Maintenance
router.post('/maintenance', authorizeRoles('Fleet Manager', 'Financial Analyst'), async (req, res) => {
  const { vehicleId, description, cost } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: { vehicleId, description, cost }
      });
      // Removed tx.vehicle.update because the Postgres trigger 'auto_lock_vehicle_on_maintenance' handles this automatically.
      return log;
    });
    
    eventBus.emit('MaintenanceLogged', { vehicleId, cost });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete a trip
router.post('/trips/:id/complete', authorizeRoles('Fleet Manager', 'Driver'), async (req, res) => {
  const tripId = Number(req.params.id);
  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    if (req.user?.role === 'Driver') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.id } });
      if (trip.driverId !== driver?.id) {
        return res.status(403).json({ error: 'You can only complete your own trips' });
      }
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id: tripId },
        data: { status: 'Completed', endDate: new Date() }
      });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'Available' } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'Available' } });
      return t;
    });

    res.json(updatedTrip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Driver Status
router.post('/drivers/:id/toggle-status', authorizeRoles('Fleet Manager', 'Safety Officer'), async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: Number(req.params.id) } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    
    const newStatus = driver.status === 'Suspended' ? 'Available' : 'Suspended';
    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { status: newStatus }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Data
router.get('/dashboard/needs-attention', authorizeRoles('Fleet Manager'), async (req, res) => {
  const suspendedDrivers = await prisma.driver.findMany({ where: { status: 'Suspended' }, include: { user: true } });
  
  const expiringLicenses = await prisma.$queryRaw<any[]>`SELECT * FROM licenses_expiring_soon`;

  const vehicles = await prisma.vehicle.findMany({ include: { maintenanceLogs: { orderBy: { date: 'desc' }, take: 1 } } });
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const overdueVehicles = vehicles.filter(v => {
    if (v.maintenanceLogs.length === 0) return true;
    return new Date(v.maintenanceLogs[0].date) < ninetyDaysAgo;
  });

  res.json({ suspendedDrivers, expiringLicenses, overdueVehicles });
});

router.get('/dashboard/safety-metrics', authorizeRoles('Safety Officer'), async (req, res) => {
  const fleetUtilRaw = await prisma.$queryRaw<any[]>`SELECT * FROM fleet_utilization`;
  const fleetUtil = fleetUtilRaw[0];
  const inShopCount = Number(fleetUtil.in_shop_count || 0);
  const suspendedCount = await prisma.driver.count({ where: { status: 'Suspended' } });
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringDrivers = await prisma.driver.findMany({
    where: { licenseExpiry: { lte: thirtyDaysFromNow } },
    include: { user: true },
    orderBy: { licenseExpiry: 'asc' }
  });

  const totalDrivers = await prisma.driver.count();
  const validDriversCount = await prisma.driver.count({
    where: { licenseExpiry: { gt: thirtyDaysFromNow } }
  });
  const complianceScore = totalDrivers === 0 ? 0 : Math.round((validDriversCount / totalDrivers) * 100);

  res.json({ inShopCount, suspendedCount, expiringDrivers, complianceScore });
});

router.get('/dashboard/financial-metrics', authorizeRoles('Financial Analyst'), async (req, res) => {
  const costRankingRaw = await prisma.$queryRaw<any[]>`SELECT * FROM vehicle_cost_summary`;
  const costRanking = costRankingRaw.map(v => ({
    vehicleId: v.vehicleId,
    licensePlate: v.licensePlate,
    totalCost: Number(v.totalcost),
    tripsCount: Number(v.tripscount),
    costPerTrip: Number(v.tripscount) > 0 ? (Number(v.totalcost) / Number(v.tripscount)) : Number(v.totalcost)
  })).sort((a, b) => b.costPerTrip - a.costPerTrip);

  res.json({ costRanking });
});

router.get('/driver/me', authorizeRoles('Driver'), async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: req.user!.id },
    include: {
      trips: { include: { vehicle: true }, orderBy: { createdAt: 'desc' } }
    }
  });
  res.json(driver);
});

import { seedDatabase } from './seed';

router.post('/admin/reset-demo-data', authorizeRoles('Fleet Manager'), async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Demo data reset successfully.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
