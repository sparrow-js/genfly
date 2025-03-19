// app/api/update-files/route.ts
import { NextResponse } from 'next/server';
import { updateFileList } from '@/utils/machines';
import { auth } from 'auth';


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

    async function noticeHost(data: any) {
      await writer.write(
        `data: ${JSON.stringify({
          event: 'message',
          data: data,
        })} \n\n`,
      );
    }

    setTimeout(async () => {
      await noticeHost({
        event: 'start',
        message: 'Updating file list...',
      });
    }, 10);
    

    updateFileList(
      appName,
      files,
      installDependencies, 
      async (result: any) => {
        await noticeHost(result);
      })
    .then(async(result) => {
      await noticeHost({
        event: 'complete',
        result: result,
      });

      await writer.close();
    })
    

    return new Response(responseStream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
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