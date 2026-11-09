/* N34 — service worker: deixa o app instalável e abre mesmo sem internet.
   Só cuida de arquivos do próprio site; chamadas à API (rule34 etc.) passam direto. */
const V = "n34-shell-v15";
/* base do site: "/" ou "/NOME-DO-REPOSITORIO/" no GitHub Pages (vem do escopo em que o worker foi registrado) */
const BASE = new URL(self.registration.scope).pathname;
const SHELL = [BASE, BASE + "manifest.webmanifest", BASE + "icons/icon-192.png", BASE + "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith("n34-") && k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.startsWith(BASE + "api/") || u.pathname.startsWith("/api/") || u.pathname.startsWith("/.netlify/")) return;   /* sincronização: nunca do cache */

  /* páginas (/, /explore, /favorites…): sempre a versão mais nova; offline usa a guardada */
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(BASE, c)); } return res; })
        .catch(() => caches.match(BASE))
    );
    return;
  }

  /* ícones e manifest: do cache primeiro */
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); }
      return res;
    }))
  );
});
