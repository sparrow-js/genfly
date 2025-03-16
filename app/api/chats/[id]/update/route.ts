import { NextResponse } from "next/server";
import { withDb } from '@/db';
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ChatHistoryItem } from "@/lib/persistence/types";
import { auth } from "auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 类型定义
) {

  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const body = await request.json();
    const { description } = body;

    if (!description) {
      return new NextResponse("Description is required", { status: 400 });
    }

    // Validate description
    const trimmedDesc = description.trim();
    if (trimmedDesc.length === 0 || trimmedDesc.length > 100) {
      return new NextResponse(
        "Description must be between 1 and 100 characters",
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]+$/.test(trimmedDesc)) {
      return new NextResponse(
        "Description can only contain letters, numbers, spaces, and basic punctuation",
        { status: 400 }
      );
    }

    const { id: chatId } = await params;
    
    // 使用 withDb 更新数据库中的聊天描述
    return withDb(async (db) => {
      // 首先检查聊天是否存在
      const existingChat = await db.select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);
      
      if (!existingChat || existingChat.length === 0) {
        return new NextResponse("Chat not found", { status: 404 });
      }
      
      // 更新数据库中的聊天描述
      const updatedChat = await db.update(chats)
        .set({ description: trimmedDesc })
        .where(eq(chats.id, chatId))
        .returning();
      
      if (!updatedChat || updatedChat.length === 0) {
        return new NextResponse("Failed to update chat", { status: 500 });
      }
      
      return NextResponse.json(updatedChat[0]);
    });

  } catch (error) {
    console.error("[CHAT_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
