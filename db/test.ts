// src/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = "postgresql://postgres.kvdceclxeyjewlodlncc:WSu5N87c9HnsbX0k@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

const sql = neon(connectionString);
export const db = drizzle({ client: sql, schema, logger: true });

