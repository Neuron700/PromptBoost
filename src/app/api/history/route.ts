import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

type Item = {
  id: string;
  title: string;
  original: string;
  optimized: string;
  category: string;
  score: number;
  createdAt: string;
  user_id?: string | null;
};

const filePath = path.join(process.cwd(), "data", "history.json");

function read(): Item[] {
  try { if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch {}
  return [];
}
function write(items: Item[]) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(items.slice(0, 100), null, 2), "utf8");
  } catch {}
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from("prompt_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (!error && data) {
        return NextResponse.json(data.map((d:any)=>({
          id: String(d.id),
          title: d.title ?? d.raw_prompt?.slice(0,48) ?? "Untitled",
          original: d.raw_prompt ?? d.original_prompt ?? "",
          optimized: d.optimized_prompt ?? "",
          category: d.category ?? "general",
          score: d.score ?? 0,
          createdAt: d.created_at ?? new Date().toISOString(),
        })));
      }
    }
  } catch {}
  // fallback file untuk anon
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>null);
  if (!body?.original || !body?.optimized) return NextResponse.json({ error: "data tidak lengkap" }, { status: 400 });
  const item: Item = {
    id: String(Date.now()),
    title: String(body.title ?? body.original).slice(0,48),
    original: String(body.original),
    optimized: String(body.optimized),
    category: String(body.category ?? "general"),
    score: Number(body.score ?? 0),
    createdAt: new Date().toISOString(),
  };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("prompt_history").insert({
        user_id: user.id,
        raw_prompt: item.original,
        optimized_prompt: item.optimized,
        category: item.category,
        score: item.score,
        title: item.title,
      });
      if (error) {
        // fallback jika kolom title belum ada
        await supabase.from("prompt_history").insert({
          user_id: user.id,
          raw_prompt: item.original,
          optimized_prompt: item.optimized,
          category: item.category,
          score: item.score,
        });
      }
      return NextResponse.json(item);
    }
  } catch {}
  // anon fallback file
  const items = read();
  items.unshift(item);
  write(items);
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && id) {
      await supabase.from("prompt_history").delete().eq("id", id).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }
    if (user && !id) {
      await supabase.from("prompt_history").delete().eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }
  } catch {}
  if (!id) { write([]); return NextResponse.json({ ok:true }); }
  const items = read().filter(i=>i.id!==id);
  write(items);
  return NextResponse.json({ ok:true });
}
