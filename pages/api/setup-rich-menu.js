import { Buffer } from "buffer";
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const IMG_B64 = process.env.RICH_MENU_IMG;

export default async function handler(req, res) {
  if (req.query.key !== "shumiSetup2024") return res.status(403).json({ error: "forbidden" });
  try {
    // Delete existing menus
    const listRes = await fetch("https://api.line.me/v2/bot/richmenu/list", { headers: { Authorization: `Bearer ${TOKEN}` } });
    const list = await listRes.json();
    for (const m of (list.richmenus || [])) {
      await fetch(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, { method: "DELETE", headers: { Authorization: `Bearer ${TOKEN}` } });
    }
    // Create new menu
    const menuRes = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        size: { width: 2500, height: 843 }, selected: true, name: "Ask Shumi Menu", chatBarText: "選單",
        areas: [
          { bounds: { x: 0, y: 0, width: 1250, height: 843 }, action: { type: "message", label: "Ask Shumi", text: "Ask Shumi" } },
          { bounds: { x: 1250, y: 0, width: 1250, height: 843 }, action: { type: "message", label: "內測回饋", text: "內測回饋" } }
        ]
      })
    });
    const menu = await menuRes.json();
    if (!menu.richMenuId) return res.status(500).json({ error: "create_failed", detail: menu });
    // Upload image from env var
    const imgBuffer = Buffer.from(IMG_B64, "base64");
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${menu.richMenuId}/content`, {
      method: "POST", headers: { "Content-Type": "image/png", Authorization: `Bearer ${TOKEN}` }, body: imgBuffer
    });
    if (!uploadRes.ok) return res.status(500).json({ error: "upload_failed", status: uploadRes.status });
    await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${menu.richMenuId}`, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` } });
    res.status(200).json({ ok: true, richMenuId: menu.richMenuId });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
