// app/api/chats/[id]/route.ts
import { NextResponse } from 'next/server';
import { withDb } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Message } from 'ai';
import type { IChatMetadata } from '@/lib/persistence/types';

export async function GET(request: Request) {
    try {
        const allChats = await withDb(db => db.select().from(chats));
        return NextResponse.json(allChats);
    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const { id, messages, urlId, description, timestamp, metadata } = await request.json() as {
    id: string;
    messages: Message[];
    urlId?: string;
    description?: string;
    timestamp?: string;
    metadata?: IChatMetadata;
  };

  if (!id || !messages) {
    return NextResponse.json({ error: 'ID and messages are required' }, { status: 400 });
  }

  try {
    const result = await withDb(async (db) => {
      return db
        .insert(chats)
        .values({
          id,
          messages,
          urlId: urlId || id,
          description,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          metadata,
        })
        .onConflictDoUpdate({
          target: chats.id,
          set: {
            messages,
            description,
            metadata,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          },
        })
        .returning();
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to save chat:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}