// app/api/update-files/route.ts
import { NextResponse } from 'next/server';
import { updateFileList } from '@/utils/machines';
import { auth } from 'auth';
export const maxDuration = 300;

export const runtime = 'edge';
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: { appName: string; files: { path: string; content: string }[]; installDependencies: string } = await request.json();
    const { appName, files, installDependencies } = body;

    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();

    function noticeHost(data: any) {
      writer.write(
        `data: ${JSON.stringify({
          event: 'message',
          data: data,
        })} \n\n`,
      );
    }
    

    updateFileList(
      appName,
      files,
      installDependencies, 
      (result: any) => {
        noticeHost(result);
      })
    .then((result) => {
      noticeHost({
        event: 'complete',
        result: result,
      });
    })
    .finally(() => {
      writer.close();
    });

    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}