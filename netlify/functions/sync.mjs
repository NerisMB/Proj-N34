import { getStore } from "@netlify/blobs";

// Guarda só texto cifrado (n34v1.<base64>), indexado por um hash. Não vê User ID nem API Key.
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response("id inválido", { status: 400 });
  const store = getStore("n34-sync");
  if (req.method === "GET") {
    const v = await store.get(id);
    return v ? new Response(v, { headers: { "content-type": "text/plain", "cache-control": "no-store" } }) : new Response(null, { status: 204 });
  }
  if (req.method === "PUT") {
    const body = await req.text();
    if (!body.startsWith("n34v1.")) return new Response("formato inválido", { status: 400 });
    if (body.length > 3_000_000) return new Response("grande demais", { status: 413 });
    await store.set(id, body);
    return new Response("ok");
  }
  return new Response("método não permitido", { status: 405 });
};
