import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Item = {
  id: string;
  title: string;
  original: string;
  optimized: string;
  category: string;
  score: number;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "history.json");

function read(): Item[] {
  try {
    // try supabase style file first
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {}
  return [];
}
function write(items: Item[]) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(items.slice(0, 100), null, 2), "utf8");
  } catch {}
}

// Supabase passthrough if env exists
async function supabaseGet(): Promise<Item[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url}/rest/v1/prompts?select=*&order=created_at.desc&limit=50`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.map((d: any) => ({
      id: String(d.id),
      title: d.title ?? d.original?.slice(0, 48) ?? "Untitled",
      original: d.original_prompt ?? d.original ?? "",
      optimized: d.optimized_prompt ?? d.optimized ?? "",
      category: d.category ?? "general",
      score: d.score ?? 0,
      createdAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
    }));
  } catch { return null; }
}

export async function GET() {
  const sb = await supabaseGet();
  if (sb) return NextResponse.json(sb);
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.original || !body?.optimized) return NextResponse.json({ error: "data tidak lengkap" }, { status: 400 });
  const item: Item = {
    id: String(Date.now()),
    title: String(body.title ?? body.original).slice(0, 48),
    original: String(body.original),
    optimized: String(body.optimized),
    category: String(body.category ?? "general"),
    score: Number(body.score ?? 0),
    createdAt: new Date().toISOString(),
  };
  // try supabase insert
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      await fetch(`${url}/rest/v1/prompts`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          title: item.title,
          original_prompt: item.original,
          optimized_prompt: item.optimized,
          category: item.category,
          score: item.score,
        }),
      });
    } catch {}
  }
  const items = read();
  items.unshift(item);
  write(items);
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (id && url && key) {
    try {
      await fetch(`${url}/rest/v1/prompts?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
    } catch {}
  }
  if (!id) {
    write([]);
    return NextResponse.json({ ok: true });
  }
  const items = read().filter((i) => i.id !== id);
  write(items);
  return NextResponse.json({ ok: true });
}
