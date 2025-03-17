import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';

import * as schema from "./schema";

// const client = postgres(env.DATABASE_URL);



// 在需要时创建连接并在使用后关闭
// export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
//   try {
//     const client = new Pool({ connectionString: "postgresql://postgres.kvdceclxeyjewlodlncc:3O7Z3osrNPdjSrcM@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"});
//     const db = drizzle(client, { schema, logger: true });
//     const result = await fn(db);
//     return result;
//   } catch (error) {
//     throw error;
//   }
// }



import { users, chats } from "./schema";

// 创建一个获取数据库连接的工厂函数
export function getDb() {
  const client = new Pool({ connectionString: "postgresql://postgres.kvdceclxeyjewlodlncc:3O7Z3osrNPdjSrcM@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"});
  return drizzle(client, { schema: { users, chats } });
}

// 在需要时创建连接并在使用后关闭
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  const client = new Pool({ connectionString: "postgresql://postgres.kvdceclxeyjewlodlncc:3O7Z3osrNPdjSrcM@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"});
  const db = drizzle(client, { schema: { users, chats } });
  try {
    const result = await fn(db);
    await client.end();
    return result;
  } catch (error) {
    await client.end();
    throw error;
  }
}