import { pgTable, serial, text, integer, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").unique(),
  username: text("username"),
  avatar: text("avatar"),
  role: integer("role"),
  platform: text("platform"),
  email: text("email"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  messages: jsonb('messages').$type<any[]>(), // 存储消息数组
  urlId: text('url_id').notNull(),
  description: text('description'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
});

// 如果需要其他相关表，也可以在这里定义
export const previews = pgTable('previews', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id),
  baseUrl: text('base_url').notNull(),
  port: text('port'),
  ready: boolean('ready').default(false),
  isLoading: boolean('is_loading').default(true),
  loadingProgress: integer('loading_progress').default(0),
  timestamp: timestamp('timestamp').defaultNow(),
});