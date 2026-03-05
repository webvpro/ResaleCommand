
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing URL', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            redirect: 'follow', // Follow redirects!
            headers: {
                // Mimic browser to avoid getting blocked
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0'
            }
        });

        if (!response.ok) {
            return new Response('Failed to fetch image', { status: response.status });
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new Response(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        return new Response('Proxy Error', { status: 500 });
    }
};
