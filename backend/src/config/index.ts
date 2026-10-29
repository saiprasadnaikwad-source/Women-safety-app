import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/women_safety_db',
  jwtSecret: process.env.JWT_SECRET || 'women_safety_super_secret_jwt_key_2026',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  smsApiKey: process.env.SMS_API_KEY || 'demo_sms_key',
  emailApiKey: process.env.EMAIL_API_KEY || 'demo_email_key',
  mapApiKey: process.env.MAP_API_KEY || 'demo_map_key'
};
