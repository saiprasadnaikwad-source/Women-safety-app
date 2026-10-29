import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './models/db';
import { setupSocketHandlers } from './socket/socketHandler';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import tripRoutes from './routes/tripRoutes';
import sosRoutes from './routes/sosRoutes';
import incidentRoutes from './routes/incidentRoutes';
import safeLocationRoutes from './routes/safeLocationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import anomalyRoutes from './routes/anomalyRoutes';
import routeRoutes from './routes/routeRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import ocrRoutes from './routes/ocrRoutes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with permissive CORS for development
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Women Safety Backend Engine',
    timestamp: new Date()
  });
});

// Register REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/safe-locations', safeLocationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/anomaly', anomalyRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/ocr', ocrRoutes);

// Global Error Handler
app.use(errorHandler);

// Setup Socket.IO Event Handlers
setupSocketHandlers(io);

// Start Server & Connect Database
const PORT = config.port;

connectDatabase(config.mongoUri).then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Women Safety Transport System Backend Server Running`);
    console.log(` Port: http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/health`);
    console.log(` Real-Time Socket.IO Active`);
    console.log(`=======================================================`);
  });
});

export default app;
