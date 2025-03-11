import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gloatjdytjubmfkeyjgl',
    password: 'blQ3VT0NVcz54YV7',
    database: 'postgres',
  },
} satisfies Config; 