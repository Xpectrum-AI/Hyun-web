/**
 * Netlify Edge Function – chat proxy with SSE streaming.
 *
 * Receives POST /chat-messages from the @xpectrum/sdk running in the
 * browser and forwards them to the upstream Dify / Xpectrum API,
 * streaming the SSE response back to the client in real-time.
 *
 * Env vars used (set in Netlify dashboard, NOT prefixed with VITE_):
 *   XPECTRUM_API_BASE_URL  or  DIFY_API_BASE_URL   – e.g. https://cloud.xpectrum.co/api/v1
 *   XPECTRUM_API_KEY       or  DIFY_API_KEY         – the Bearer token
 */

export default async function handler(request, context) {
  // ── CORS preflight ────────────────────────────────────────────
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  // Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Resolve upstream URL & key ────────────────────────────────
  const apiBaseUrl =
    Netlify.env.get("XPECTRUM_API_BASE_URL") ||
    Netlify.env.get("DIFY_API_BASE_URL");
  const apiKey =
    Netlify.env.get("XPECTRUM_API_KEY") ||
    Netlify.env.get("DIFY_API_KEY");

  if (!apiBaseUrl || !apiKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured – missing API credentials" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const upstreamUrl = `${apiBaseUrl.replace(/\/+$/, "")}/chat-messages`;

  try {
    const body = await request.text();

    // ── Forward to upstream API ───────────────────────────────────
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    // If upstream failed, relay status + body
    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      console.error(`Upstream error ${upstreamResponse.status}: ${errorBody}`);
      return new Response(errorBody, {
        status: upstreamResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stream the SSE response back to the browser ─────────────
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    // Pipe the upstream readable stream straight through
    return new Response(upstreamResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Chat proxy error:", err);
    return new Response(
      JSON.stringify({
        event: "error",
        answer: "Service temporarily unavailable. Please try again.",
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  path: ["/chat-messages", "/chat-messages/*"],
};
