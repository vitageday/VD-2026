// ═══════════════════════════════════════════════════════════════
// DGR 2026 Минск — прокси-сервер (Cloudflare Worker)
// ═══════════════════════════════════════════════════════════════
export default {
  async fetch(request, env) {
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const targetBase = env.APPS_SCRIPT_URL;
    if (!targetBase) {
      return new Response(
        JSON.stringify({ error: 'APPS_SCRIPT_URL не настроен в Worker' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let targetUrl = targetBase;
    let init = {};

    if (request.method === 'GET') {
      const url = new URL(request.url);
      targetUrl = targetBase + '?' + url.searchParams.toString();
      init = { method: 'GET' };

    } else if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Некорректное тело запроса' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      body.token = env.WRITE_TOKEN;
      init = {
        method: 'POST',
        body: JSON.stringify(body),
      };

    } else {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const resp = await fetch(targetUrl, init);
    const text = await resp.text();

    return new Response(text, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
