import { NextResponse } from "next/server";
import { withDb } from '@/db';
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "auth";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 类型定义
) {
  try {
    const { id: chatId } = await params;

    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return withDb(async (db) => {
      // Check if chat exists
      const existingChat = await db.select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!existingChat || existingChat.length === 0) {
        return new NextResponse("Chat not found", { status: 404 });
      }

      // Delete the chat
      const deletedChat = await db.delete(chats)
        .where(eq(chats.id, chatId))
        .returning();

      if (!deletedChat || deletedChat.length === 0) {
        return new NextResponse("Failed to delete chat", { status: 500 });
      }

      return NextResponse.json(deletedChat[0]);
    });

  } catch (error) {
    console.error("[CHAT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
