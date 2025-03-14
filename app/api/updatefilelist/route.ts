// app/api/update-files/route.ts
import { NextResponse } from 'next/server';
import { updateFileList } from '@/utils/machines';

export const runtime = 'edge';
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: { appName: string; files: { path: string; content: string }[] } = await request.json();
    const { appName, files } = body;

    await updateFileList(appName, files);

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
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