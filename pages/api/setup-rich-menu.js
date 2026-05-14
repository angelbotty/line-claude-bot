import { deflateSync } from "zlib";

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// CRC32 for PNG
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const tb = Buffer.from(type, "ascii");
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}

function generateRichMenuPNG() {
  const W = 2500, H = 843;
  const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const mid = Math.floor(W / 2);
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const base = y * (1 + W * 3);
    raw[base] = 0; // filter: none
    for (let x = 0; x < W; x++) {
      const p = base + 1 + x * 3;
      if (x < mid) { raw[p]=232; raw[p+1]=245; raw[p+2]=233; } // #E8F5E9 green
      else          { raw[p]=227; raw[p+1]=242; raw[p+2]=253; } // #E3F2FD blue
    }
  }
  const idat = deflateSync(raw, { level: 1 });
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

export default async function handler(req, res) {
  if (req.query.key !== "shumiSetup2024") return res.status(403).json({ error: "forbidden" });
  try {
    // 1. Create rich menu structure
    const menuRes = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        size: { width: 2500, height: 843 },
        selected: true,
        name: "Ask Shumi Main Menu",
        chatBarText: "選單",
        areas: [
          { bounds: { x: 0, y: 0, width: 1250, height: 843 }, action: { type: "message", label: "Ask Shumi", text: "Ask Shumi" } },
          { bounds: { x: 1250, y: 0, width: 1250, height: 843 }, action: { type: "message", label: "內測回饋", text: "內測回饋" } }
        ]
      })
    });
    const menu = await menuRes.json();
    if (!menu.richMenuId) return res.status(500).json({ error: "create_failed", detail: menu });

    // 2. Generate & upload PNG image
    const imgBuffer = generateRichMenuPNG();
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${menu.richMenuId}/content`, {
      method: "POST",
      headers: { "Content-Type": "image/png", Authorization: `Bearer ${TOKEN}` },
      body: imgBuffer
    });
    if (!uploadRes.ok) return res.status(500).json({ error: "upload_failed", status: uploadRes.status, body: await uploadRes.text() });

    // 3. Set as default for all users
    const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${menu.richMenuId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    res.status(200).json({ ok: true, richMenuId: menu.richMenuId, defaultStatus: defaultRes.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
