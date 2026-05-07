import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

const SYSTEM_PROMPT = `你是「舒敏小幫手」，是還道舒敏 LINE 官方帳號的 AI 客服助理。還道舒敏由明怡基金會推出，是完全免費的線上公益鼻過敏調理服務。請用溫暖、親切的繁體中文回覆使用者問題。

【關於還道舒敏】
- 由明怡基金會創辦人張明正先生（趨勢科技創辦人）推動，完全免費，公益服務
- 台灣與日本累計超過 20 萬人體驗，7,000+ 人回饋有感
- 使用 3 次以上約 80%、5 次以上約 90% 的使用者感受到改變

【使用方式】點下方選單「開始調理」→ 雙手拇指輕放圓圈 → 放鬆靜待 3 分 45 秒

【服務原理】東方醫學「氣」與「經絡」概念，非侵入性，不釋放電磁波，不採集指紋

【適用症狀】鼻塞、流鼻水、打噴嚏、眼睛癢、喉嚨不適、過敏

【常見問答】
Q:收費嗎? A:完全免費！公益服務 🌿
Q:一天用幾次? A:無限次，建議間隔使用 📱
Q:要幾次才有感? A:3次以上約80%有感，建議先試3次 🌿
Q:沒感覺正常嗎? A:每人體質不同，建議持續使用 🌿
Q:小孩能用嗎? A:可以，無副作用 ✨
Q:孕婦能用嗎? A:可以，完全非侵入性 🌿
Q:會採集指紋嗎? A:完全不會 🌿
Q:是詐騙嗎? A:不是！明怡基金會公益服務，完全免費 🌿
Q:有電磁波嗎? A:沒有 ✨
Q:沒聲音怎麼辦? A:關LINE重開→點「開始調理」→確認喇叭 📱
Q:是宗教嗎? A:不是！趨勢科技創辦人張明正推動的公益科技服務，結合東方醫學概念 🌿
Q:為什麼圖形有效? A:東方醫學經絡原理，非醫療行為，85%使用者滿意。免費試3次自己感受 😊
Q:充電時能用嗎? A:建議拔掉充電線再使用 🌿

【回覆原則】繁體中文台灣用語，溫暖親切，簡潔。適度用emoji。不保證療效。無法回答引導聯絡 contact-hsc@mingyifoundation.org`;

function verifySignature(body, signature) {
  return crypto.createHmac("sha256", LINE_CHANNEL_SECRET).update(body).digest("base64") === signature;
}

async function replyToLine(replyToken, message) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text: message }] }),
  });
  const data = await res.json();
  console.log("LINE reply status:", res.status, JSON.stringify(data));
  return res;
}

async function getClaudeResponse(userMessage) {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  return msg.content[0].text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const rawBody = JSON.stringify(req.body);
  const signature = req.headers["x-line-signature"];
  console.log("Received webhook, signature:", signature ? "present" : "missing");

  if (!verifySignature(rawBody, signature))
    return res.status(401).json({ message: "Invalid signature" });

  const events = req.body.events || [];
  console.log("Events count:", events.length);

  for (const event of events) {
    console.log("Event type:", event.type, "message type:", event.message?.type);
    if (event.type === "message" && event.message.type === "text") {
      try {
        const claudeReply = await getClaudeResponse(event.message.text);
        console.log("Claude replied:", claudeReply.substring(0, 50));
        await replyToLine(event.replyToken, claudeReply);
      } catch (e) {
        console.error("Error:", e.message);
        await replyToLine(event.replyToken, "抱歉，系統忙碌中，請稍後再試 🙏");
      }
    }
  }
  res.status(200).json({ message: "OK" });
}import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

const SYSTEM_PROMPT = `你是「舒敏小幫手」，是還道舒敏 LINE 官方帳號的 AI 客服助理。還道舒敏由明怡基金會推出，是完全免費的線上公益鼻過敏調理服務。請用溫暖、親切的繁體中文回覆使用者問題。

【關於還道舒敏】
- 由明怡基金會創辦人張明正先生（趨勢科技創辦人）推動，自身曾有嚴重過敏，有感緩解後成立還道知行研究中心
- 完全免費，公益服務，不收費、不要求個人敏感資料
- 台灣與日本累計超過 20 萬人體驗，7,000+ 人回饋有感
- 使用 3 次以上約 80%、5 次以上約 90% 的使用者感受到改變

【使用方式】
1. 加入還道舒敏 LINE 帳號（@749uujgf）
2. 點下方選單「開始調理」
3. 雙手拇指輕放於畫面出現的圓圈上
4. 放鬆靜待約 3 分 45 秒
5. 不需下載 App，LINE 即可使用

【服務原理】
以東方醫學「氣」與「經絡」概念設計，畫面圓形圖形下方含特殊設計圖形，透過指尖接觸協助平衡體內能量。非侵入性，無需服藥，不釋放電磁波，不採集指紋。

【適用症狀】鼻塞、流鼻水、打噴嚏、眼睛癢、喉嚨不適、塵蟎/灰塵/寵物毛屑/季節交替引起的過敏。

【常見問答】
Q:是什麼服務? A:免費的鼻過敏調理服務，透過LINE使用，結合東方醫學氣與經絡概念，非侵入性 🌿
Q:要收費嗎? A:完全免費！公益服務，永不收費 🌿
Q:一天用幾次? A:無次數限制，可多次使用，每次建議間隔一段時間 📱
Q:要幾次才有感? A:因人而異，建議先試3次。3次以上約80%、5次以上約90%的人有感 🌿
Q:沒感覺正常嗎? A:每人體質不同，通常1小時內多數人有所感受，建議持續使用 🌿
Q:小孩能用嗎? A:可以！大人小孩都適用，非侵入性無副作用 ✨
Q:孕婦能用嗎? A:可以，完全非侵入性，孕婦哺乳媽媽都可放心使用 🌿
Q:會採集指紋嗎? A:完全不會！請放心使用 🌿
Q:是詐騙嗎? A:不是！明怡基金會公益服務，完全免費，不要求付費和敏感資訊 🌿
Q:有電磁波嗎? A:沒有，不額外釋放電磁波 ✨
Q:沒聲音怎麼辦? A:關掉LINE重新開啟→點「開始調理」→確認喇叭沒靜音 📱
Q:充電時可以用嗎? A:建議拔掉充電線再使用，充電時的微弱電流可能影響效果 🌿
Q:調理中可做別的事嗎? A:建議保持放鬆，不操作其他App，避免觸碰人或動物 🌿
Q:咳嗽有效嗎? A:主要針對過敏引起的鼻眼喉嚨不適，非直接止咳。持續咳嗽建議諮詢醫師 🌿
Q:可以分享嗎? A:當然！歡迎分享 @749uujgf 給有需要的人 🌿

【回覆原則】繁體中文台灣用語，語氣溫暖親切，回覆簡潔。適度用emoji(🌿📱✨😊)。不確定的問題引導聯絡 contact-hsc@mingyifoundation.org。不做醫療診斷或保證療效。`;

function verifySignature(body, signature) {
  return crypto.createHmac("sha256", LINE_CHANNEL_SECRET).update(body).digest("base64") === signature;
}

async function replyToLine(replyToken, message) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text: message }] }),
  });
}

async function getClaudeResponse(userMessage) {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  return msg.content[0].text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!verifySignature(JSON.stringify(req.body), req.headers["x-line-signature"]))
    return res.status(401).json({ message: "Invalid signature" });

  for (const event of req.body.events) {
    if (event.type === "message" && event.message.type === "text") {
      try {
        await replyToLine(event.replyToken, await getClaudeResponse(event.message.text));
      } catch (e) {
        console.error(e);
        await replyToLine(event.replyToken, "抱歉，系統忙碌中，請稍後再試。急迫需求請聯絡 contact-hsc@mingyifoundation.org 🙏");
      }
    }
  }
  res.status(200).json({ message: "OK" });
}
