// app/api/update-files/route.ts
import { NextResponse } from 'next/server';
import { updateFileList } from '@/utils/machines';
import { auth } from 'auth';

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
    
    const res = await updateFileList(appName, files, installDependencies);

    return NextResponse.json({
      success: true,
      result: res,
      data: {},
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