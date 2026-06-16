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

  const base = apiBaseUrl.replace(/\/+$/, "");
  const url = new URL(request.url);

  // ── POST /workflow-run or /workflow-book — workflow proxies ──
  if (request.method === "POST" && (url.pathname === "/workflow-run" || url.pathname === "/workflow-book")) {
    const wfBaseUrl = (Netlify.env.get("WORKFLOW_API_BASE_URL") || "https://cloud-v2.xpectrum.co/v1").replace(/\/+$/, "");
    const isBooking = url.pathname === "/workflow-book";
    const wfKey = isBooking
      ? (Netlify.env.get("BOOKING_WORKFLOW_API_KEY") || "app-6KvdN7TJjDGfxPSJqC18Mhlk")
      : (Netlify.env.get("WORKFLOW_API_KEY") || "app-NX9DPU2Oe4zvngT4bdQSUiGY");

    try {
      const body = await request.text();
      const upstreamRes = await fetch(`${wfBaseUrl}/workflows/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${wfKey}`, "Content-Type": "application/json" },
        body,
      });
      const data = await upstreamRes.text();
      return new Response(data, {
        status: upstreamRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Workflow proxy error:", err);
      return new Response(JSON.stringify({ error: "Upstream workflow error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── GET /conversations or /messages(/*) — proxy JSON requests ──
  // Note: /messages (no trailing slash) is used for getMessages?conversation_id=...
  // and /messages/* for per-message endpoints like /messages/{id}/suggested-questions
  if (request.method === "GET" && (
    url.pathname.startsWith("/conversations") ||
    url.pathname.startsWith("/messages")
  )) {
    try {
      const upstreamUrl = `${base}${url.pathname}${url.search}`;
      const upstreamResponse = await fetch(upstreamUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await upstreamResponse.text();
      return new Response(data, {
        status: upstreamResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Messages proxy error:", err);
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── POST /chat-messages — streaming SSE ───────────────────────
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const upstreamUrl = `${base}/chat-messages`;

  try {
    const body = await request.text();

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      console.error(`Upstream error ${upstreamResponse.status}: ${errorBody}`);
      return new Response(errorBody, {
        status: upstreamResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

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
  path: ["/chat-messages", "/chat-messages/*", "/conversations", "/conversations/**", "/messages", "/messages/**", "/workflow-run", "/workflow-book"],
};
