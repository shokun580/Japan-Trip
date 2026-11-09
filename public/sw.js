// Offline copy of the trip. Pages and their client-side payloads are fetched from the
// network first and the last good answer is kept, so an underground platform with no
// signal still shows the plan that was open last. The build's own files, fonts and
// icons never change under one name, so those come straight from the cache.
// Changing the trip always needs the network: those are POSTs and pass straight through.

const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

const OFFLINE_HTML = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ยังไม่มีเน็ต</title></head>
<body style="margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#bdd5ea;color:#495867;font-family:'LINE Seed Sans TH',Thonburi,system-ui,sans-serif;text-align:center">
<div><p style="margin:0;font-size:1.25rem;font-weight:600">ยังไม่มีเน็ต</p><p style="margin:10px 0 0;line-height:1.6">หน้านี้ยังไม่เคยเปิดตอนมีเน็ต เลยยังไม่มีสำเนาไว้ให้ดู</p><p style="margin-top:20px"><a href="/" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#495867;color:#f7f7ff;text-decoration:none;font-weight:500">กลับหน้าแผนเที่ยว</a></p></div>
</body></html>`;

self.addEventListener("install", () => { self.skipWaiting(); });

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== PAGES && key !== ASSETS) await caches.delete(key);
    await self.clients.claim();
  })());
});

// The page asks for the screens it wants ready for later (the plan and the checklist)
// as soon as it is up, so neither has to have been visited first.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "warm" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(Promise.all(event.data.urls.map((url) => networkFirst(new Request(url, { credentials: "same-origin" }), pageKey(new URL(url, self.location.origin), false)).catch(() => {}))));
});

// A note's photo never changes under its id either, so a ticket opened once is still
// there on a platform with no signal.
const isAsset = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/notes/image/") || /\.(png|svg|ico|woff2)$/.test(url.pathname);

// Next adds a changing _rsc query to its payload requests; the cache key drops it and
// marks the payload apart from the page's HTML at the same address.
function pageKey(url, rsc) {
  const key = new URL(url.href);
  key.searchParams.delete("_rsc");
  if (rsc) key.searchParams.set("__sw", "rsc");
  return key.href;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  if (isAsset(url)) { event.respondWith(cacheFirst(request)); return; }
  if (request.mode === "navigate") { event.respondWith(networkFirst(request, pageKey(url, false), true)); return; }
  if (request.headers.get("RSC") === "1") event.respondWith(networkFirst(request, pageKey(url, true)));
});

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // Not a redirect: without a name, a note's photo comes back as the name picker.
  if (response.ok && !response.redirected) cache.put(request, response.clone());
  return response;
}

// Only a plain 200 is kept: a redirect to the name picker must never stand in for a
// page, and an error page is not a copy worth having.
async function networkFirst(request, key, navigation = false) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic" && !response.redirected) {
      cache.put(key, response.clone());
      if (navigation || !key.includes("__sw=rsc")) keepAssetsOf(response.clone());
    }
    return response;
  } catch (error) {
    const hit = await cache.match(key);
    if (hit) return hit;
    if (navigation) return new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
    throw error;
  }
}

// A page is only as good as the scripts it loads: the chunks a page names in its HTML
// go into the asset cache with it, so a page that was warmed but never opened still
// comes up whole. A page's own chunk is named inside the page data rather than a
// script tag, so the search covers the whole document. Anything already cached is
// skipped.
async function keepAssetsOf(response) {
  try {
    const html = await response.text();
    const cache = await caches.open(ASSETS);
    const urls = new Set();
    for (const match of html.matchAll(/static\/(?:chunks|css|media)\/[^"'\\\s<>]+\.(?:js|css|woff2)/g)) urls.add(`/_next/${match[0]}`);
    await Promise.all([...urls].map(async (url) => {
      if (await cache.match(url)) return;
      const asset = await fetch(url);
      if (asset.ok) await cache.put(url, asset);
    }));
  } catch { /* the page itself is still cached */ }
}
