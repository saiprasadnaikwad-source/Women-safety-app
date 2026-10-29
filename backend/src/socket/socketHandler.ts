import { Server as SocketIOServer, Socket } from 'socket.io';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET] New client connected: ${socket.id}`);

    // Join journey monitoring room
    socket.on('join_trip', (tripId: string) => {
      socket.join(`trip_${tripId}`);
      console.log(`[SOCKET] Client ${socket.id} joined trip room: trip_${tripId}`);
    });

    // Join authority dashboard room
    socket.on('join_dashboard', () => {
      socket.join('authority_dashboard');
      console.log(`[SOCKET] Authority dashboard connected: ${socket.id}`);
    });

    // Live location update from mobile client
    socket.on('location_update', (data: {
      tripId: string;
      userId: string;
      latitude: number;
      longitude: number;
      speed: number;
      direction: number;
      riskScore: number;
      riskLevel: string;
    }) => {
      // Broadcast to trip room and authority dashboard
      io.to(`trip_${data.tripId}`).emit('location_changed', data);
      io.to('authority_dashboard').emit('live_location_update', data);
    });

    // SOS Emergency Trigger
    socket.on('trigger_sos', (sosData: {
      sosId: string;
      userId: string;
      userName: string;
      tripId?: string;
      latitude: number;
      longitude: number;
      activationMethod: string;
      riskScore: number;
      timestamp: Date;
    }) => {
      console.log(`[SOCKET] !!! SOS TRIGGERED !!! User: ${sosData.userName} Method: ${sosData.activationMethod}`);
      
      // Broadcast CRITICAL ALERT immediately to authority dashboard and trip room
      io.to('authority_dashboard').emit('emergency_alert', sosData);
      if (sosData.tripId) {
        io.to(`trip_${sosData.tripId}`).emit('sos_status_changed', { status: 'ACTIVE', ...sosData });
      }
    });

    // SOS Resolution
    socket.on('resolve_sos', (data: { sosId: string; tripId?: string; resolvedBy: string }) => {
      io.to('authority_dashboard').emit('emergency_resolved', data);
      if (data.tripId) {
        io.to(`trip_${data.tripId}`).emit('sos_status_changed', { status: 'RESOLVED', ...data });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });
}
