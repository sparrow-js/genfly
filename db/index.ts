import { drizzle } from "drizzle-orm/vercel-postgres";
import { createClient } from '@vercel/postgres';
import { users, chats } from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.kvdceclxeyjewlodlncc:WSu5N87c9HnsbX0k@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

// 创建一个获取数据库连接的工厂函数
export function getDb() {
  const client = createClient({ connectionString });
  return drizzle(client, { schema: { users, chats } });
}

// 在需要时创建连接并在使用后关闭
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  const client = createClient({ connectionString });
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