import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';
import * as schema from "./schema";


const connectionString = process.env.DATABASE_URL!;

export function getDb() {
  const client = new Pool({ connectionString });
  return drizzle(client, { schema });
}

// 在需要时创建连接并在使用后关闭
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  const client = new Pool({ connectionString });
  const db = drizzle(client, { schema });
  try {
    const result = await fn(db);
    await client.end();
    return result;
  } catch (error) {
    await client.end();
    throw error;
  }
}