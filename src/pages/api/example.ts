import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({
    message: 'Hello from the API!'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 