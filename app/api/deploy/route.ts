// app/api/deploy/route.ts
import { NextResponse } from 'next/server';
import { createScopedLogger } from '@/utils/logger';
import { deployApp } from '@/utils/machines';
import { auth } from 'auth';

const logger = createScopedLogger('api.deploy');

export const runtime = 'edge';

export async function POST(request: Request) {

  try {
    const data: { appName: string } = await request.json();

    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { appName } = data;
    logger.info('Deployment API called with data:', data);

    try {
      const deployData = await deployApp(appName);
      // logger.info('Successfully created machine for Fly.io application:', deployData);
      return NextResponse.json({
        status: 'success',
        message: 'Successfully created Fly.io application',
        data: deployData,
      });
    } catch (error) {
      logger.error('Error creating Fly.io application:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Error creating Fly.io application',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error in deployment API:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to process deployment request',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Deployment API is available',
    timestamp: new Date().toISOString(),
  });
}

// Handle unsupported methods
export async function OPTIONS() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}