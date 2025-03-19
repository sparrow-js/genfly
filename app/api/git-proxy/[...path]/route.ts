// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function handler(request: NextRequest, 
  { params }: { params: Promise<{ path: string[] }> } // 类型定义
) {
  try {
    const { path } = await params; // 从 params 中获取 id

    if (!path) {
      return NextResponse.json({ error: 'Invalid proxy URL format' }, { status: 400 });
    }

    const url = new URL(request.url);

    // Reconstruct the target URL
    const targetURL = `https://${path}${url.search}`;

    // Forward the request to the target URL
    const response = await fetch(targetURL, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        // Override host header with the target host
        host: new URL(targetURL).host,
      },
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.arrayBuffer(),
    });

    // Create response with CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    // Forward the response with CORS headers
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(response.body as any, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Git proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}

// Export handlers for all HTTP methods
export const GET = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => handler(request, context);
export const POST = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => handler(request, context);
export const PUT = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => handler(request, context);
export const DELETE = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => handler(request, context);
export const OPTIONS = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => handler(request, context);