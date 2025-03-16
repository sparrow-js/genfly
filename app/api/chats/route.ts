// app/api/chats/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/test';
import { chats } from '@/db/schema';
import type { Message } from 'ai';
import type { IChatMetadata } from '@/lib/persistence/types';
import { auth } from 'auth';
import { desc, eq } from 'drizzle-orm';


export const runtime = 'edge';

export async function GET(request: Request) {

    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // 获取当前用户信息
        const userId = session.user.id;
        
        // 确保userId不为undefined
        if (!userId) {
            return new NextResponse("User ID not found", { status: 400 });
        }
        
        // 选择除messages以外的所有字段
        // const db = getDb();
       try {
        const allChats = await db.select({
          id: chats.id,
          userId: chats.userId,
          urlId: chats.urlId,
          description: chats.description,
          timestamp: chats.timestamp,
          metadata: chats.metadata
      }).from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.timestamp))
        
        // const allChats = await withDb(db => );
        
        return NextResponse.json(allChats);
       } catch (error) {
        console.error('Failed to fetch chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
       }

      
    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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

    // const db = getDb();

    const result = await db
    .insert(chats)
    .values({
      id,
      messages,
      urlId: urlId || id,
      description,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata,
      userId: session?.user?.id || 'guest',
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

    // const result = await withDb(async (db) => {
    //   return db
    //     .insert(chats)
    //     .values({
    //       id,
    //       messages,
    //       urlId: urlId || id,
    //       description,
    //       timestamp: timestamp ? new Date(timestamp) : new Date(),
    //       metadata,
    //       userId: session?.user?.id || 'guest',
    //     })
    //     .onConflictDoUpdate({
    //       target: chats.id,
    //       set: {
    //         messages,
    //         description,
    //         metadata,
    //         timestamp: timestamp ? new Date(timestamp) : new Date(),
    //       },
    //     })
    //     .returning();
    // });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to save chat:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}