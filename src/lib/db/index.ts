import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' })

// Supabase connection string
let databaseUrl = process.env.DATABASE_URL!;

// Supabase için pooler connection kullan (IPv6 sorunlarını önler)
if (databaseUrl.includes('supabase.co')) {
  // Direct connection'dan pooler connection'a geç
  let projectRef: string | undefined;
  let password: string | undefined;
  
  // Direct connection formatından bilgileri çıkar
  if (databaseUrl.includes('db.') && !databaseUrl.includes('pooler')) {
    projectRef = databaseUrl.match(/db\.([^.]+)\.supabase\.co/)?.[1];
    password = databaseUrl.match(/postgres:([^@]+)@/)?.[1];
  }
  // Pooler connection formatından bilgileri çıkar
  else if (databaseUrl.includes('pooler')) {
    projectRef = databaseUrl.match(/postgres\.([^:]+):/)?.[1];
    password = databaseUrl.match(/postgres\.[^:]+:([^@]+)@/)?.[1];
  }
  
  // Pooler connection string oluştur
  if (projectRef && password) {
    // Transaction mode (port 5432) veya Session mode (port 6543)
    // Kullanıcının verdiği connection string'de port varsa onu kullan, yoksa 6543 (Session mode) kullan
    const portMatch = databaseUrl.match(/:(\d+)\/postgres/);
    const port = portMatch ? portMatch[1] : '6543';
    
    // Supabase pooler connection formatı: postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:[PORT]
    databaseUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:${port}/postgres?sslmode=require`;
    console.log('[DB] Using pooler connection for project:', projectRef, 'port:', port);
  } else {
    console.error('[DB] Could not extract projectRef or password from connection string');
  }
}

// Supabase connection string'inde sslmode yoksa ekle
if (databaseUrl.includes('supabase.co') && !databaseUrl.includes('sslmode')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}sslmode=require`;
}

// postgres-js client oluştur
const client = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false }, // Supabase için SSL ayarı
  max: 1, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
