import { NextRequest } from "next/server";
import http from "http";

export const runtime = "nodejs"; // важно! чтобы Next не испортил поток

export async function GET(req: NextRequest) {
  const backendUrl = "http://localhost:5000/events";

  return new Response(
    new ReadableStream({
      start(controller) {
        const request = http.get(backendUrl, (proxyRes) => {
          proxyRes.on("data", (chunk) => {
            try {
              controller.enqueue(chunk);
            } catch {
              // поток уже закрыт — просто игнорируем
            }
          });

          proxyRes.on("end", () => {
            try {
              controller.close();
            } catch {
              // уже закрыт — ничего страшного
            }
          });
        });

        request.on("error", (err) => {
          console.error("SSE proxy error:", err);
          try {
            controller.close();
          } catch {}
        });

        // если клиент закрыл соединение — закроем и бэкенд
        req.signal.addEventListener("abort", () => {
          request.destroy();
          try {
            controller.close();
          } catch {}
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
