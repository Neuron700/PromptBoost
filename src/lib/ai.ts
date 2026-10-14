import type { Category, OptimizeResponse, OutputMode, SpiderStage, WordTag, WordTagKind } from "@/types/prompt";
import { SPIDER_STAGES } from "@/types/prompt";
import { categoryMeta } from "./prompts";

function scoreBefore(prompt: string): number {
  const len = prompt.trim().length;
  let s = 35;
  if (len > 20) s += 8;
  if (len > 60) s += 10;
  if (prompt.includes("kamu") || prompt.toLowerCase().includes("you are")) s += 7;
  if (prompt.includes(":") || prompt.includes("•")) s += 5;
  if (len > 120) s += 5;
  return Math.min(68, s);
}
function clamp(n:number,a:number,b:number){ return Math.max(a,Math.min(b,n)); }

function buildPrompt(prompt: string, category: Category, outputMode: OutputMode): string {
  const trimmed = prompt.trim().slice(0, 320);
  const modeText = outputMode === "minimal" ? "Jawaban ringkas langsung ke inti" : outputMode === "balanced" ? "Struktur markdown dengan heading dan checklist" : "Laporan lengkap dengan ringkasan langkah dan tabel keputusan";
  const audience = "mahasiswa dan kreator umum";
  switch(category){
    case "coding":
      return `ROLE\nKamu adalah senior software engineer ahli clean code dan performa\n\nOBJECTIVE\n${trimmed}\n\nCONTEXT\n• Audiens: ${audience} yang butuh solusi siap pakai\n• Stack: pilih yang paling relevan dan jelaskan alasannya\n\nREQUIREMENTS\n• Bahasa dan framework yang disarankan\n• Penjelasan langkah implementasi\n• Contoh input dan output\n• Cara verifikasi hasil\n\nCONSTRAINTS\n• Jelaskan trade off jangan hanya kasih kode jadi\n• Sertakan penanganan error utama\n\nOUTPUT FORMAT\n${modeText}`;
    case "writing":
      return `ROLE\nKamu adalah penulis dan editor ahli untuk konten ${category}\n\nOBJECTIVE\n${trimmed}\n\nAUDIENS DAN TONE\n• Audiens: ${audience}, bahasa Indonesia jelas\n• Tone: membantu dan presisi\n\nSTRUKTUR\n• Hook kuat di dua kalimat pertama\n• Tiga poin utama dengan contoh konkret\n• Penutup dengan ringkasan dan ajakan spesifik\n\nREQUIREMENTS\n• Paragraf mudah dipindai\n• Contoh dan analogi relevan\n\nOUTPUT FORMAT\n${modeText}`;
    case "research":
      return `ROLE\nKamu adalah pembimbing riset untuk mahasiswa sarjana\n\nOBJECTIVE\n${trimmed}\n\nSCOPE\n• Fokus Indonesia 2024 sampai 2026 sumber primer diutamakan\n\nMETHODOLOGY\n• Kumpulkan lima sumber kredibel\n• Bandingkan temuan dan catat keterbatasan\n\nOUTPUT FORMAT\nTabel: Sumber • Temuan • Relevansi • Keterbatasan plus ringkasan 150 kata`;
    case "marketing":
      return `ROLE\nKamu adalah strategist marketing digital\n\nOBJECTIVE\n${trimmed}\n\nDETAIL\n• Produk: jelaskan value utama\n• Audiens: siapa targetnya\n• Channel: tempat distribusi\n• Goal: metrik keberhasilan\n\nFRAMEWORK\n• Hook • Content pillar tiga buah • Copy • CTA spesifik\n\nOUTPUT FORMAT\n${modeText} plus kalender 7 hari`;
    case "education":
      return `ROLE\nKamu adalah desainer kurikulum\n\nOBJECTIVE\n${trimmed}\n\nLEVEL\n• Mahasiswa pemula\n\nSTRUKTUR 90 MENIT\n• Pembuka dan tujuan belajar\n• Materi inti dengan contoh\n• Aktivitas interaktif\n• Asesmen dan refleksi\n\nOUTPUT FORMAT\n${modeText} dengan tabel waktu`;
    case "image":
      return `ROLE\nKamu adalah prompt engineer untuk Midjourney dan Stable Diffusion\n\nSUBJECT\n${trimmed}\n\nSTRUKTUR\nSubject • Style • Composition • Lighting • Camera • Environment • Mood\n\nDETAIL\n• Style: cinematic highly detailed\n• Composition: centered rule of thirds\n• Lighting: warm ember glow dari bengkel tempa soft rim light\n• Camera: 35mm f 2.8 shallow depth\n• Environment: workshop interior\n• Mood: focused dan crafted\n\nOUTPUT FORMAT\nSatu baris prompt siap paste lalu daftar negative prompt\n\nNEGATIVE PROMPT\nblurry low res distorted extra limbs`;
    case "data":
      return `ROLE\nKamu adalah data analyst\n\nOBJECTIVE\n${trimmed}\n\nDATASET\n• Sebutkan sumber data\n\nGOAL\n• Pertanyaan bisnis yang ingin dijawab\n\nMETHOD\n• Teknik analisis yang disarankan\n• Validasi dan caveats\n\nOUTPUT FORMAT\n${modeText} plus rekomendasi visualisasi`;
    case "business":
      return `ROLE\nKamu adalah business strategist\n\nOBJECTIVE\n${trimmed}\n\nKONTEKS\n• Problem dan solusi utama\n• Target audiens\n• Model bisnis singkat\n\nOUTPUT FORMAT\nOne pager: Problem • Solusi • Pasar • Model • Metrik • Next step\n\nTONE\nRingkas meyakinkan untuk stakeholder`;
    default:
      return `ROLE\nKamu adalah asisten ahli yang membantu menyusun prompt terstruktur\n\nOBJECTIVE\n${trimmed}\n\nCONTEXT\n• Audiens: ${audience}\n• Tujuan: hasil yang konsisten dan mudah dipakai ulang\n\nREQUIREMENTS\n• Perjelas peran dan konteks\n• Pecah permintaan jadi poin terukur\n• Tetapkan batasan dan format output\n\nOUTPUT FORMAT\n${modeText}`;
  }
}

const VAGUE_WORDS = new Set(["keren","bagus","hebat","cepat","baik","buruk","menarik","cantik","jelek","mudah","sulit","susah","gampang","lengkap","banyak","sedikit","agak","cukup","sangat","paling","optimal","maksimal","efektif","efisien","modern","canggih","profesional","berkualitas","luar","biasa","baguslah","awesome","cool","nice","good","great","best","fast","quick","easy","simple","beautiful","amazing","powerful","smart","better","kerenlah"]);
const OWNER_WORDS = new Set(["saya","aku","kami","kita","kamu","anda","mereka","beliau","user","admin","mahasiswa","siswa","guru","dosen","pelanggan","tim","perusahaan","klien","audiens","i","you","we","they","users","admins","customer","team","student","users"]);
const FILE_WORDS = new Set(["api","database","server","website","situs","aplikasi","aplikasi","kode","code","data","file","gambar","image","foto","video","dokumen","document","tabel","table","endpoint","query","prompt","css","html","artikel","artikel","email","poster","logo","artikel","kode","skrip","script","dataset","dashboard","konten","content"]);
const APPROVAL_WORDS = new Set(["tolong","mohon","harap","harus","wajib","jangan","pastikan","cek","periksa","pastikan","pastikan","please","must","should","ensure","sure","dont","avoid","need","required","never","always","janganlah","yuk","ayo"]);
const STOP_WORDS = new Set(["yang","dan","atau","di","ke","dari","untuk","dengan","pada","adalah","itu","ini","the","a","an","of","to","in","on","for","with","is","are","and","or","saja","aja","sih","dong","deh","kok","nih","tuh","pun","kah","lah","nya","si","sang","para","oleh","agar","supaya","jika","kalau","jika","saat","ketika","serta","telah","sudah","akan","bisa","dapat","ada","tiada"]);

const TAG_COPY: Record<WordTagKind, { reason: string; suggestion: string }> = {
  vague: { reason: "Kata sifat kabur, AI menebak artinya sendiri", suggestion: "Ganti dengan ukuran konkret misal angka contoh atau kriteria" },
  claim: { reason: "Pernyataan inti yang dibawa prompt", suggestion: "Tambahkan bukti contoh atau konteks agar klaim kuat" },
  owner: { reason: "Menunjuk pelaku atau audiens", suggestion: "Perjelas peran dan tanggung jawabnya" },
  file: { reason: "Menunjuk artefak atau objek kerja", suggestion: "Sebutkan format dan lokasinya" },
  approval: { reason: "Instruksi batasan atau persetujuan", suggestion: "Ubah jadi kriteria yang bisa dicek" },
};

export function tokenize(prompt: string): string[] {
  return prompt.split(/\s+/).map(w => w.trim()).filter(Boolean);
}

function classifyWord(raw: string): WordTagKind {
  const w = raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
  if (!w) return "claim";
  if (VAGUE_WORDS.has(w)) return "vague";
  if (OWNER_WORDS.has(w)) return "owner";
  if (FILE_WORDS.has(w)) return "file";
  if (APPROVAL_WORDS.has(w)) return "approval";
  if (/[._\/\-]|^[A-Z][a-z]+[A-Z]/.test(raw)) return "file";
  if (STOP_WORDS.has(w) || w.length <= 2) return "claim";
  return "claim";
}

export function heuristicTags(prompt: string): WordTag[] {
  return tokenize(prompt).map((word, index) => {
    const tag = classifyWord(word);
    return { word, index, tag, reason: TAG_COPY[tag].reason, suggestion: TAG_COPY[tag].suggestion };
  });
}

export function heuristicStages(prompt: string, category: Category): SpiderStage[] {
  const words = tokenize(prompt);
  const sentences = prompt.split(/[.!?\n]+/).filter(s => s.trim()).length;
  const tags = heuristicTags(prompt);
  const vagueCount = tags.filter(t => t.tag === "vague").length;
  const ruleCount = tags.filter(t => t.tag === "approval").length;
  const label = categoryMeta[category]?.label ?? category;
  const details = [
    `Peran diset untuk dunia ${label}`,
    `${words.slice(0, 8).join(" ")}${words.length > 8 ? " ..." : ""}`,
    `${words.length} kata dalam ${Math.max(sentences, 1)} kalimat`,
    `${ruleCount} batasan terdeteksi`,
    `${vagueCount} kata vage perlu diperjelas`,
    `Prompt siap ditempa dan disalin`,
  ];
  return SPIDER_STAGES.map((name, i) => ({ name, detail: details[i] ?? "", status: "done" as const }));
}

export function mockOptimize(prompt: string, category: Category, outputMode: OutputMode): OptimizeResponse {
  const before = scoreBefore(prompt);
  const optimizedPrompt = buildPrompt(prompt, category, outputMode);
  const after = clamp(before + 28 + Math.floor(Math.random()*8), 78, 96);
  const analysis = {
    clarity: clamp(after - 2 + Math.floor(Math.random()*6), 70, 95),
    context: clamp(after - 8 + Math.floor(Math.random()*8), 65, 92),
    specificity: clamp(after - 5 + Math.floor(Math.random()*8), 70, 94),
    constraints: clamp(after - 7 + Math.floor(Math.random()*8), 68, 92),
    outputFormat: clamp(after - 1 + Math.floor(Math.random()*5), 75, 96),
  };
  const improvements = [
    `Menambah ROLE spesifik untuk ${categoryMeta[category]?.label ?? category}`,
    `Memecah permintaan jadi poin terukur`,
    `Menentukan Output Format sesuai mode ${outputMode}`,
  ];
  const suggestions = [
    category === "coding" ? "Sebutkan bahasa atau framework pilihan agar output lebih tepat" : "Tambahkan detail audiens dan batasan panjang",
    "Sertakan contoh input dan output yang diharapkan",
  ];
  return { optimizedPrompt, score: after, beforeScore: before, analysis, improvements, suggestions, category, stages: heuristicStages(prompt, category), tags: heuristicTags(prompt) };
}

export async function optimizeWithAI(prompt: string, category: Category, outputMode: OutputMode): Promise<OptimizeResponse> {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!key) return mockOptimize(prompt, category, outputMode);
  const base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  try {
    const words = tokenize(prompt);
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `Kamu adalah prompt engineer ahli. Ubah prompt mentah jadi prompt terstruktur untuk kategori ${category}. Kembalikan JSON: {optimizedPrompt:string, score:number 0 sampai 100, analysis:{clarity,context,specificity,constraints,outputFormat} 0 sampai 100, improvements:string[], suggestions:string[], stages:[{name,detail} untuk ROLE OBJECTIVE CONTEXT RULES REVIEW SHIP berurutan], tags:[{w:kata, i:index kata mulai 0, t:satu dari claim owner file approval vague, r:alasan singkat, s:saran singkat] maksimal 60 yang paling penting}. Gunakan bullet • bukan strip -. Mode ${outputMode} mengatur panjang.` },
          { role: "user", content: prompt.slice(0, 2000) },
        ],
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const fallback = mockOptimize(prompt, category, outputMode);
    const validKinds: WordTagKind[] = ["claim", "owner", "file", "approval", "vague"];
    const aiTags: WordTag[] = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t: any) => t && typeof t.i === "number" && validKinds.includes(t.t) && words[t.i])
          .slice(0, 60)
          .map((t: any) => ({ word: words[t.i], index: t.i, tag: t.t as WordTagKind, reason: String(t.r ?? TAG_COPY[t.t as WordTagKind].reason).slice(0, 120), suggestion: String(t.s ?? TAG_COPY[t.t as WordTagKind].suggestion).slice(0, 140) }))
      : [];
    const byIndex = new Map(aiTags.map(t => [t.index, t]));
    const tags: WordTag[] = words.map((word, index) => byIndex.get(index) ?? fallback.tags![index]);
    const stages: SpiderStage[] = Array.isArray(parsed.stages) && parsed.stages.length === 6
      ? parsed.stages.map((s: any, i: number) => ({ name: SPIDER_STAGES[i], detail: String(s?.detail ?? fallback.stages![i].detail).slice(0, 160), status: "done" as const }))
      : fallback.stages!;
    return {
      optimizedPrompt: parsed.optimizedPrompt ?? fallback.optimizedPrompt,
      score: parsed.score ?? fallback.score,
      beforeScore: fallback.beforeScore,
      analysis: parsed.analysis ?? fallback.analysis,
      improvements: parsed.improvements ?? fallback.improvements,
      suggestions: parsed.suggestions ?? fallback.suggestions,
      category,
      stages,
      tags,
    };
  } catch { return mockOptimize(prompt, category, outputMode); }
}
