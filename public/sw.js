importScripts("/uv/uv.bundle.js", "/uv/uv.config.js", "/uv/uv.sw.js");
const sw = new UVServiceWorker();
self.addEventListener("fetch", (event) => event.respondWith(sw.fetch(event)));
