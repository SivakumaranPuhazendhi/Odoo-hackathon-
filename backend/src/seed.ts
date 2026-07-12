import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  // Clear existing data (in a specific order to avoid FK constraint errors)
  await prisma.fuelExpenseLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);

  // Create Specific Role Users
  const fleetManager = await prisma.user.create({ data: { email: 'manager@transitops.com', password: hashedPassword, name: 'Alice Manager', role: 'Fleet Manager' } });
  const safetyOfficer = await prisma.user.create({ data: { email: 'safety@transitops.com', password: hashedPassword, name: 'Sam Safety', role: 'Safety Officer' } });
  const financialAnalyst = await prisma.user.create({ data: { email: 'finance@transitops.com', password: hashedPassword, name: 'Fiona Finance', role: 'Financial Analyst' } });
  
  // Create 10 Drivers
  const driverIds = [];
  for (let i = 1; i <= 10; i++) {
    const u = await prisma.user.create({ data: { email: `driver${i}@transitops.com`, password: hashedPassword, name: `Driver ${i}`, role: 'Driver' } });
    const d = await prisma.driver.create({
      data: { userId: u.id, licenseNumber: `DL-00${i}`, licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: i % 4 === 0 ? 'Suspended' : 'Available' }
    });
    driverIds.push(d.id);
  }
  // Specific drivers for demo
  const driverUser1 = await prisma.user.create({ data: { email: 'alex@transitops.com', password: hashedPassword, name: 'Alex', role: 'Driver' } });
  const driverUser2 = await prisma.user.create({ data: { email: 'sarah@transitops.com', password: hashedPassword, name: 'Sarah', role: 'Driver' } });
  await prisma.driver.create({
    data: { userId: driverUser1.id, licenseNumber: 'DL-ALEX', licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'Available' }
  });
  await prisma.driver.create({
    data: { userId: driverUser2.id, licenseNumber: 'DL-SARAH', licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), status: 'Suspended' }
  });

  // Create 10 Vehicles
  for (let i = 1; i <= 10; i++) {
    await prisma.vehicle.create({
      data: { make: 'Volvo', model: 'VNL', licensePlate: `TRK-00${i}`, status: i % 3 === 0 ? 'On Trip' : 'Available', maxCapacityKg: 10000 + (i * 1000) }
    });
  }

  // Specific vehicles for demo
  const van05 = await prisma.vehicle.create({
    data: { make: 'Ford', model: 'Transit', licensePlate: 'VAN-05', status: 'Available', maxCapacityKg: 2000 }
  });
  await prisma.vehicle.create({
    data: { make: 'Mercedes', model: 'Sprinter', licensePlate: 'VAN-06', status: 'In Shop', maxCapacityKg: 2500 }
  });
  
  // Add mock fuel logs to VAN-05 to trigger predictive maintenance
  for(let i=0; i<5; i++) {
     await prisma.fuelExpenseLog.create({
       data: { vehicleId: van05.id, amountLiters: 50, cost: 100 + (i * 20), date: new Date() } // Increasing cost per liter to simulate drop
     })
  }
}

// Allow running directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeded successfully for demo!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
