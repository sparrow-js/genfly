// import { drizzle } from "drizzle-orm/vercel-postgres";
import { createClient } from '@vercel/postgres';
import * as schema from "./schema";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.kvdceclxeyjewlodlncc:WSu5N87c9HnsbX0k@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

// 创建一个获取数据库连接的工厂函数
export function getDb() {
 
  const sql = neon(connectionString);

  const db = drizzle(sql, { schema, logger: true });
  return db;
}

// 在需要时创建连接并在使用后关闭
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema, logger: true });
  try {
    const result = await fn(db);
    return result;
  } catch (error) {
    throw error;
  }
}