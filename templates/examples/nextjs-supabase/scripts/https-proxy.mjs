// Disposable loopback TLS fixture only. Production TLS belongs to deployment infrastructure.

import { readFileSync } from "node:fs";
import { request } from "node:http";
import { createServer } from "node:https";

const origin = new URL(process.env.SECURITY_BASE_URL);
if (
  origin.protocol !== "https:" ||
  !["localhost", "127.0.0.1"].includes(origin.hostname)
)
  throw new Error("TLS fixture must listen on loopback");
createServer(
  {
    key: readFileSync(process.env.CCLAUNCHER_TLS_KEY),
    cert: readFileSync(process.env.CCLAUNCHER_TLS_CERT),
  },
  (incoming, outgoing) => {
    const upstream = request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        method: incoming.method,
        path: incoming.url,
        headers: incoming.headers,
      },
      (response) => {
        outgoing.writeHead(response.statusCode, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on("error", () => {
      outgoing.writeHead(502);
      outgoing.end();
    });
    incoming.on("error", () => upstream.destroy());
    incoming.pipe(upstream);
  },
).listen(Number(origin.port), "127.0.0.1");
