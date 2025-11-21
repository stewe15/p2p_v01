import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const backendUrl = "http://localhost:5000/events";

  const backendResponse = await fetch(backendUrl, {
    headers: {
      Accept: "text/event-stream",
    },
  });

  if (!backendResponse.ok || !backendResponse.body) {
    return new Response("SSE backend error", { status: 502 });
  }

  return new Response(backendResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
