import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' } // For hackathon demo
});

// Import event listeners to register them
import './events/listeners/auditLogger';
import './events/listeners/socketBroadcaster';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

import routes from './routes';
import authRoutes from './routes/auth';
import bcrypt from 'bcryptjs';


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});



app.get('/api/trigger-predictive', async (req, res) => {
  const { checkFuelEfficiencyTrends } = await import('./services/maintenancePredictor');
  await checkFuelEfficiencyTrends();
  res.json({ message: 'Predictive maintenance check triggered.' });
});

app.use('/api', routes);

httpServer.listen(PORT, () => {
  console.log(`TransitOps Backend running on http://localhost:${PORT}`);
});

export { app, prisma };
