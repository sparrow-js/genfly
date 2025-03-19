import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { repoName, path = '' } = await request.json();

    const baseUrl = 'https://api.github.com';
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers.Authorization = 'token ' + token;
    }

    const response = await fetch(`${baseUrl}/repos/${repoName}/contents/${path}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    // If it's a single file, return its content
    if (!Array.isArray(data)) {
      if (data.type === 'file') {
        const content = atob(data.content);
        return NextResponse.json([{
          name: data.name,
          path: data.path,
          content,
        }]);
      }
    }

    // Process directory contents recursively
    const contents = await Promise.all(
      data.map(async (item: any) => {
        if (item.type === 'dir') {
          // Recursively get contents of subdirectories
          const subResponse = await fetch(`${baseUrl}/repos/${repoName}/contents/${item.path}`, {
            headers,
          });
          const subData = await subResponse.json();
          return subData;
        } else if (item.type === 'file') {
          // Fetch file content
          const fileResponse = await fetch(item.url, {
            headers,
          });
          const fileData: any = await fileResponse.json();
          const content = atob(fileData.content);

          return [{
            name: item.name,
            path: item.path,
            content,
          }];
        }
        return [];
      }),
    );

    return NextResponse.json(contents.flat());

  } catch (error) {
    console.error('Error fetching repo contents:', error);
    return NextResponse.json({ error: 'Failed to fetch repo contents' }, { status: 500 });
  }
}
