import express from "express";
import { createServer } from "node:http";
import { createBareServer } from "@tomphttp/bare-server-node";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const app = express();
const bare = createBareServer("/bare/");
const server = createServer();

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

const uvDist = path.join(__dirname, "node_modules/@titaniumnetwork-dev/ultraviolet/dist");
app.use("/uv/", express.static(uvDist));
app.use("/uv/uv.config.js", (_req, res) =>
  res.sendFile(path.join(__dirname, "public/uv/uv.config.js"))
);

app.post("/api/run", async (req, res) => {
  const { language, files, stdin } = req.body || {};
  if (!language || !files?.length)
    return res.status(400).json({ error: "language and files are required" });
  try {
    const r = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, version: "*", files, stdin: stdin || "" }),
    });
    res.json(await r.json());
  } catch (err) {
    res.status(502).json({ error: "runner unreachable", detail: String(err) });
  }
});

const dataFile = path.join(__dirname, "data", "state.json");
fs.mkdirSync(path.dirname(dataFile), { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "{}");

app.get("/api/state", (_req, res) =>
  res.json(JSON.parse(fs.readFileSync(dataFile, "utf-8")))
);
app.post("/api/state", (req, res) => {
  fs.writeFileSync(dataFile, JSON.stringify(req.body ?? {}, null, 2));
  res.json({ ok: true });
});

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else if (req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.end();
});

server.listen(PORT, () => {
  console.log(`\n  🪐  Universe is running\n      → http://localhost:${PORT}\n`);
});
