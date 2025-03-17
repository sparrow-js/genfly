// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import { users, chats } from "./schema";

// const connectionString = process.env.DATABASE_URL || "postgresql://postgres.kvdceclxeyjewlodlncc:Sg9aqDrQ2Txy8Qd8@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";


import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';

import * as schema from "./schema";

// const client = postgres(env.DATABASE_URL);
const client = new Pool({ connectionString: "postgresql://postgres.kvdceclxeyjewlodlncc:3O7Z3osrNPdjSrcM@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"});

export const db = drizzle(client, { schema, logger: true });

// 创建一个获取数据库连接的工厂函数
export function getDb() {
  return db
}

// 在需要时创建连接并在使用后关闭
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  try {
    const result = await fn(db);
    return result;
  } catch (error) {
    throw error;
  }
}




