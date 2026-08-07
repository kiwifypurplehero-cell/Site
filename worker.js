/** Cloudflare Worker estático: sem banco, autenticação, cookies ou secrets. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.method === 'GET' && request.headers.get('Accept')?.includes('text/html')) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }
    return response;
  }
};
