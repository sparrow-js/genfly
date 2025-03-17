// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import { users, chats } from "./schema";

const connectionString = process.env.DATABASE_URL!;


import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';

import * as schema from "./schema";

// const client = postgres(env.DATABASE_URL);
const client = new Pool({ connectionString });

export const db = drizzle(client, { schema });

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




