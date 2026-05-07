import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const SECRET = process.env.LINE_CHANNEL_SECRET;

const PROMPT = `你是「舒敏小幫手」，是還道舒敏 LINE 官方帳號的 AI 客服助理。還道舒敏由明怡基金會推出，完全免費的線上公益鼻過敏調理服務。用溫暖親切的繁體中文回覆。

還道舒敏：免費公益服務，趨勢科技創辦人張明正推動，台日20萬人體驗，3次以上80%有感。
使用：點「開始調理」→雙手拇指放圓圈→靜待3分45秒。
常見Q&A：免費(永久免費)、次數(無限)、效果(3次以上80%有感)、小孩孕婦(都可)、指紋(不採集)、詐騙(不是！公益服務)、宗教(不是！科技結合東醫)、電磁波(無)。
無法回答請聯絡：contact-hsc@mingyifoundation.org`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const sig = req.headers["x-line-signature"];
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac("sha256", SECRET).update(body).digest("base64");
  if (hash !== sig) return res.status(401).end();
  for (const event of req.body.events || []) {
    if (event.type !== "message" || event.message.type !== "text") continue;
    try {
      const reply = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: PROMPT,
        messages: [{ role: "user", content: event.message.text }],
      });
      const text = reply.content[0].text;
      const lineRes = await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: "text", text }] }),
      });
      const lineData = await lineRes.json();
      console.log("LINE:", lineRes.status, JSON.stringify(lineData));
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
  res.status(200).json({ ok: true });
}
