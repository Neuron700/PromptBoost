import { NextRequest, NextResponse } from "next/server";
import { optimizeWithAI } from "@/lib/ai";
import type { Category, OutputMode } from "@/types/prompt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim();
    const category = (body.category ?? "general") as Category;
    const outputMode = (body.outputMode ?? "balanced") as OutputMode;

    if (!prompt) return NextResponse.json({ error: "Prompt kosong. Tulis ide mentah terlebih dahulu." }, { status: 400 });
    // no limit per user request 11d
    const allowed: Category[] = ["coding","writing","research","marketing","education","image","data","business","general"];
    if (!allowed.includes(category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });

    const result = await optimizeWithAI(prompt, category, outputMode);
    return NextResponse.json(result);
  } catch (e:any) {
    console.error("OPTIMIZE ERROR", e?.message, e?.stack);
    return NextResponse.json({ error: `Gagal memproses: ${e?.message ?? "unknown"} coba lagi` }, { status: 500 });
  }
}
