import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const SECRET = process.env.LINE_CHANNEL_SECRET;
const LOGGER_URL = process.env.LOGGER_URL; // Google Apps Script 部署網址

const PROMPT = `你是「舒敏小幫手」，是還道舒敏 LINE 官方帳號的 AI 客服助理，服務台灣用戶。請用溫暖親切的繁體中文（台灣用語）回覆，語氣像朋友聊天。emoji 偶爾使用即可，不需每句都加，也不要每次都用同一個；有時候不用 emoji 反而更自然。回答要簡短精準，1-2句為主，不重複已知資訊。

【關於還道舒敏】
由明怡基金會（非營利組織，趨勢科技創辦人張明正推動）推出的免費線上公益服務，針對呼吸道不順暢進行調理，幫助促進體內能量循環、調整體質。台灣與日本累計超過20萬人體驗，完全免費永不收費。

【還道舒敏 vs 還道舒心】
- 還道舒敏：針對呼吸道不順暢（鼻塞、流鼻水、打噴嚏、眼睛癢、喉嚨不適）
- 還道舒心：幫助情緒平穩
- 兩者可先後使用，順序不拘

【如何使用】
1. 在選單選擇「哪裡得知還道舒敏服務」
2. 點「開始調理」按照步驟進行
3. 雙手各一指（任何手指均可）輕放於螢幕圓圈上
4. 靜待約3分45秒完成
5. 不需下載APP、不需登入，LINE即可使用

【調理相關】
- 次數無限制，有需要時隨時可用
- 大多數人一小時內有感，建議連續使用七天觀察
- 音樂是輔助，開不開都可以
- 調理時可閉眼放鬆或看著圖形，盡量不做別的事
- 在交通工具上使用可能因觸碰他人受能量干擾，效果可能打折
- 沒有症狀時也可以調理，幫助調整體質
- 手指乾燥感應不良：先摩擦溫暖手再試，或擦拭螢幕
- 操作問題：重新點選單「開始調理」；選單沒出現先選「哪裡得知還道舒敏服務」

【常見Q&A】
Q:要收費嗎? A:完全免費！明怡基金會非營利組織，不收任何費用 🌿
Q:要多久用一次? A:無次數限制，有需要就用，建議連續七天 📱
Q:要用幾次才有感? A:大多數人一小時內有感，建議連續七天觀察 🌿
Q:完全沒感覺? A:建議連續七天，也歡迎拍有手指的照片讓我們優化 🌿
Q:可以連續用嗎? A:可以，有需要隨時用 ✨
Q:小孩/孕婦能用嗎? A:可以，非侵入性，安心使用 🌿
Q:是詐騙嗎? A:不是，明怡基金會公益服務，完全免費 🌿
Q:是宗教嗎? A:不是，趨勢科技創辦人推動的科技公益服務 🌿
Q:為什麼圖形有效? A:指尖是人體最好的能量受器，觸碰特製圖形促進能量循環，屬輔助調理非醫療 🌿
Q:有電磁波嗎/採集指紋嗎? A:完全沒有 ✨
Q:皮膚過敏/濕疹能用嗎? A:舒敏針對呼吸道，皮膚相關仍在研究中 🌿
Q:睡眠/經痛/胃食道逆流? A:這些仍在研究及內部測試階段 🌿
Q:有診所嗎? A:沒有，直接在LINE詢問即可 📱
Q:沒有APP嗎? A:不需要APP，LINE裡直接用 📱
Q:舒敏和舒心差在哪? A:舒敏針對呼吸道，舒心幫助情緒，兩者可先後使用 🌿
Q:是宗教還是詭異的東西? A:不是，科技結合東方醫學的公益服務，完全免費透明 🌿
Q:第一次怎麼開始? A:點下方選單選「哪裡得知還道舒敏服務」，再按「開始調理」即可 🌿
Q:選單在哪裡? A:聊天室下方，點三條線或往上滑就能看到 📱
Q:用了幾天但效果不明顯? A:效果因體質而異，建議繼續七天，也歡迎拍有手指的照片讓我們確認 🌿
Q:可以推薦給朋友嗎? A:歡迎！直接分享這個帳號，完全免費 ✨
Q:還道舒心要怎麼使用? A:搜尋「還道舒心」LINE 官方帳號，加入後點「開始調理」即可 🌿
Q:我對食物過敏可以用嗎? A:食物過敏目前不在還道舒敏的研究範圍內 🌿 不過如果過敏同時引發鼻塞、打噴嚏、流鼻水等呼吸道不適，舒敏對這部分是有幫助的！歡迎試試看 ✨
Q:許願/我想許願? A:雖然不是許願池，但如果你的困擾跟呼吸道有關（鼻塞、流鼻水、打噴嚏），舒敏說不定就是你要的那個答案！完全免費，試試看吧 🌿
Q:可以開發新功能嗎/建議開發? A:謝謝你的建議！你的想法對我們很有價值，都會認真參考 🌿 歡迎把具體建議寄到 contact-hsc@mingyifoundation.org，讓研究團隊看到 ✨
Q:研究中什麼時候才能用/什麼時候推出? A:目前還在內部測試階段，還沒有確定的上線時間 🌿 有進展我們一定會在官方帳號公告，敬請期待 📱

【無法回答時】引導聯絡：contact-hsc@mingyifoundation.org
【絕對不做】醫療診斷、保證療效`;

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
if (LOGGER_URL) {
fetch(LOGGER_URL, {
method: "POST",
redirect: "follow",
headers: { "Content-Type": "text/plain" },
body: JSON.stringify({
timestamp: (() => { const d = new Date(Date.now() + 8 * 60 * 60 * 1000); return d.toISOString().slice(0, 19).replace("T", " "); })(),
userId: event.source?.userId || "unknown",
userMessage: event.message.text,
botReply: text,
}),
}).then(r => console.log("LOGGER:", r.status)).catch(e => console.log("LOGGER_ERR:", e.message));
}
} catch (e) {
console.error("Error:", e.message);
}
}
res.status(200).json({ ok: true });
}
