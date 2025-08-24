import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Set up database connection with fallback for development
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/querylinker_dev';

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using default connection for development");
  process.env.DATABASE_URL = DATABASE_URL;
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Allow graceful fallback for development
  connectionTimeoutMillis: 5000,
  max: 1
});

// Initialize database with error handling
let db: any;
try {
  db = drizzle({ client: pool, schema });
} catch (error) {
  console.error('Database initialization failed:', error);
  // Create a mock database for development
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) })
  };
}

export { db };