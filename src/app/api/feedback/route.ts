import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

const filePath = path.join(process.cwd(), "data", "feedback.json");
const TARGET = "syahlanbudi73@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!message || message.length < 10) return NextResponse.json({ error: "Pesan feedback minimal 10 karakter" }, { status: 400 });
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });

    const entry = {
      id: String(Date.now()),
      name: name.slice(0, 60),
      email: email.slice(0, 80),
      message: message.slice(0, 2000),
      rating: Number(body.rating ?? 0),
      createdAt: new Date().toISOString(),
      target: TARGET,
    };

    // simpan ke supabase jika ada tabel feedback (abaikan error jika tabel belum ada)
    try {
      const supabase = await createClient();
      await supabase.from("feedback").insert({
        name: entry.name,
        email: entry.email,
        message: entry.message,
        rating: entry.rating,
      });
    } catch {}

    // simpan ke file lokal juga
    try {
      const arr = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
      arr.unshift(entry);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(arr.slice(0, 200), null, 2), "utf8");
    } catch {}

    // kirim email beneran via Gmail SMTP kalau sudah dikonfigurasi
    const smtpUser = process.env.FEEDBACK_SMTP_USER || TARGET;
    const smtpPass = (process.env.FEEDBACK_SMTP_PASS || "").replace(/\s/g, "");
    if (!smtpPass) {
      return NextResponse.json({ ok: true, stored: true, emailSent: false, message: "Feedback tersimpan, tapi email belum aktif. Pasang FEEDBACK_SMTP_PASS agar masuk inbox." });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: `PromptBoost Feedback <${smtpUser}>`,
        to: TARGET,
        replyTo: entry.email,
        subject: `Feedback PromptBoost rating ${entry.rating} dari ${entry.name || entry.email}`,
        text: `Nama: ${entry.name || "-"}\nEmail: ${entry.email}\nRating: ${entry.rating}/5\nWaktu: ${entry.createdAt}\n\nPesan:\n${entry.message}`,
      });
    } catch (e: any) {
      console.error("FEEDBACK SMTP ERROR", e?.message);
      return NextResponse.json({ ok: true, stored: true, emailSent: false, message: "Feedback tersimpan tapi email gagal terkirim. Cek App Password Gmail." });
    }

    return NextResponse.json({ ok: true, stored: true, emailSent: true, message: `Feedback terkirim ke ${TARGET}. Terima kasih!` });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal kirim feedback" }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (fs.existsSync(filePath)) return NextResponse.json(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {}
  return NextResponse.json([]);
}
