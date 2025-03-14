// app/api/chats/[id]/route.ts
import { NextResponse } from 'next/server';
import { withDb } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export async function GET(
    request: Request, 
    { params }: { params: Promise<{ id: string }> } // 类型定义
) {
  const { id } = await params; // 从 params 中获取 id


  if (!id) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
  }

  try {
    const chat = await withDb(db =>
      db
        .select()
        .from(chats)
        .where(isUUID(id) ? eq(chats.id, id) : eq(chats.urlId, id))
        .limit(1)
    );

    if (!chat.length) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat[0]);
  } catch (error) {
    console.error('Failed to fetch chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}