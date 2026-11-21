/**
 * SPORT NUTRITION CLASSROOM — Cloudflare Worker API Proxy
 *
 * Deploy as a TEST-only Worker. Configure GAS_API_URL as a Worker variable.
 * No credentials or student data are logged or stored by this Worker.
 */
const ALLOWED_ORIGIN = "https://worrawutt-source.github.io";
const MAX_BODY_BYTES = 65536;
const ALLOWED_ACTION = /^(auth\.(verify|me|requestLinkOtp|linkStudent|requestEmailChange|confirmEmailChange)|course\.(list|create|update)|semester\.(list|create|update)|offering\.(list|create|update)|instructor\.(assign|unassign)|import\.(preview|execute|result)|enrollment\.(list|update)|assignment\.(list|get|create|update|open|close)|group\.(list|create|join|leave|members|selectRepresentative|addMember|removeMember)|submission\\.(create|list|get|revise)|grade\\.(create|update|get|history)|gradeReview\\.(create|list|update)|notification\\.(send|log|retry))$/;

function corsHeaders(origin) {
  const headers = new Headers({
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  if (origin === ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

function jsonResponse(body, status, origin) {
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function failure(code, message) {
  return {
    success: false,
    requestId: null,
    data: null,
    error: { code, message }
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) {
        return jsonResponse(failure("ORIGIN_NOT_ALLOWED", "Origin is not allowed."), 403, origin);
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return jsonResponse(failure("ORIGIN_NOT_ALLOWED", "Origin is not allowed."), 403, origin);
    }

    if (request.method !== "POST") {
      return jsonResponse(failure("METHOD_NOT_ALLOWED", "Only POST is supported."), 405, origin);
    }

    const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
    if (!contentType.startsWith("text/plain") && !contentType.startsWith("application/json")) {
      return jsonResponse(failure("UNSUPPORTED_MEDIA_TYPE", "Unsupported content type."), 415, origin);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return jsonResponse(failure("PAYLOAD_TOO_LARGE", "Request body is too large."), 413, origin);
    }

    let raw;
    try {
      raw = await request.text();
    } catch (_) {
      return jsonResponse(failure("INVALID_BODY", "Unable to read request body."), 400, origin);
    }
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return jsonResponse(failure("PAYLOAD_TOO_LARGE", "Request body is too large."), 413, origin);
    }

    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (_) {
      return jsonResponse(failure("INVALID_JSON", "Request body must be valid JSON."), 400, origin);
    }
    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope) ||
        typeof envelope.action !== "string" || !ALLOWED_ACTION.test(envelope.action) ||
        !envelope.payload || typeof envelope.payload !== "object" || Array.isArray(envelope.payload)) {
      return jsonResponse(failure("INVALID_REQUEST", "Request envelope or action is invalid."), 400, origin);
    }

    if (!env.GAS_API_URL) {
      return jsonResponse(failure("PROXY_NOT_CONFIGURED", "Backend proxy is not configured."), 503, origin);
    }

    let upstreamUrl;
    try {
      upstreamUrl = new URL(env.GAS_API_URL);
      if (upstreamUrl.protocol !== "https:" ||
          upstreamUrl.hostname !== "script.google.com" ||
          !upstreamUrl.pathname.includes("/macros/s/") ||
          !upstreamUrl.pathname.endsWith("/exec")) {
        throw new Error("INVALID_GAS_API_URL");
      }
    } catch (_) {
      return jsonResponse(failure("PROXY_NOT_CONFIGURED", "Backend proxy configuration is invalid."), 503, origin);
    }

    try {
      // Let the Fetch runtime follow Google's ContentService redirect.
      // GAS commonly responds to POST with a redirect to a one-time
      // script.googleusercontent.com URL containing the JSON response.
      const upstream = await fetch(upstreamUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: raw,
        redirect: "follow"
      });

      const responseText = await upstream.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch (_) {
        const contentType = (upstream.headers.get("Content-Type") || "").toLowerCase();
        const finalHost = upstream.url ? new URL(upstream.url).hostname : "unknown";
        const diagnostic = {
          upstreamStatus: upstream.status,
          contentType: contentType.split(";")[0] || "unknown",
          finalHost: ["script.google.com", "script.googleusercontent.com"].includes(finalHost)
            ? finalHost : "other"
        };
        return jsonResponse({
          ...failure("UPSTREAM_INVALID_RESPONSE", "Backend did not return JSON."),
          diagnostic
        }, 502, origin);
      }

      const status = upstream.ok ? 200 : upstream.status;
      return jsonResponse(responseBody, status, origin);
    } catch (_) {
      // Never log request bodies, LINE ID tokens, OTPs, or upstream URLs.
      return jsonResponse(failure("UPSTREAM_UNAVAILABLE", "Backend service is temporarily unavailable."), 502, origin);
    }
  }
};
