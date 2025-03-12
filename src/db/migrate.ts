import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres.gloatjdytjubmfkeyjgl:blQ3VT0NVcz54YV7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

// for migrations
const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  try {
    console.log('Removing not-null constraint from product_id in order_items table...');
    
    await migrationClient.unsafe(`
      ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;
    `);
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 