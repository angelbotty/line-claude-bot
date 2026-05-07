import { Client, validateSignature } from "@line/bot-sdk";
import Anthropic from "@anthropic-ai/sdk";

export const config = {
  api: {
      bodyParser: false,
        },
        };

        async function getRawBody(readable) {
          const chunks = [];
            for await (const chunk of readable) {
                chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
                  }
                    return Buffer.concat(chunks);
                    }

                    const anthropic = new Anthropic({
                      apiKey: process.env.ANTHROPIC_API_KEY,
                      });

                      async function getClaudeReply(userMessage) {
                        const systemPrompt =
                            process.env.BOT_SYSTEM_PROMPT ||
                                "你是一個友善的客服助理，請用繁體中文回覆。回答要簡潔清楚，適合在手機上閱讀。";

                                  const response = await anthropic.messages.create({
                                      model: "claude-haiku-4-5-20251001",
                                          max_tokens: 1024,
                                              system: systemPrompt,
                                                  messages: [{ role: "user", content: userMessage }],
                                                    });

                                                      return response.content[0].text;
                                                      }

                                                      async function handleEvent(client, event) {
                                                        if (event.type !== "message" || event.message.type !== "text") {
                                                            return;
                                                              }

                                                                const userMessage = event.message.text;
                                                                  const replyToken = event.replyToken;

                                                                    try {
                                                                        const replyText = await getClaudeReply(userMessage);
                                                                            await client.replyMessage(replyToken, {
                                                                                  type: "text",
                                                                                        text: replyText,
                                                                                            });
                                                                                              } catch (error) {
                                                                                                  console.error("Claude API error:", error);
                                                                                                      await client.replyMessage(replyToken, {
                                                                                                            type: "text",
                                                                                                                  text: "抱歉，我現在有點忙，請稍後再試看看 🙏",
                                                                                                                      });
                                                                                                                        }
                                                                                                                        }
                                                                                                                        
                                                                                                                        export default async function handler(req, res) {
                                                                                                                          if (req.method === "GET") {
                                                                                                                              return res.status(200).json({ status: "LINE Claude Bot is running! 🤖" });
                                                                                                                                }
                                                                                                                                
                                                                                                                                  if (req.method !== "POST") {
                                                                                                                                      return res.status(405).json({ error: "Method not allowed" });
                                                                                                                                        }
                                                                                                                                        
                                                                                                                                          const rawBody = await getRawBody(req);
                                                                                                                                            const bodyString = rawBody.toString("utf8");
                                                                                                                                            
                                                                                                                                              const signature = req.headers["x-line-signature"];
                                                                                                                                                const channelSecret = process.env.LINE_CHANNEL_SECRET;
                                                                                                                                                
                                                                                                                                                  if (!signature || !validateSignature(bodyString, channelSecret, signature)) {
                                                                                                                                                      return res.status(403).json({ error: "Invalid signature" });
                                                                                                                                                        }
                                                                                                                                                        
                                                                                                                                                          let body;
                                                                                                                                                            try {
                                                                                                                                                                body = JSON.parse(bodyString);
                                                                                                                                                                  } catch (e) {
                                                                                                                                                                      return res.status(400).json({ error: "Invalid JSON" });
                                                                                                                                                                        }
                                                                                                                                                                        
                                                                                                                                                                          const client = new Client({
                                                                                                                                                                              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
                                                                                                                                                                                  channelSecret: process.env.LINE_CHANNEL_SECRET,
                                                                                                                                                                                    });
                                                                                                                                                                                    
                                                                                                                                                                                      try {
                                                                                                                                                                                          await Promise.all(body.events.map((event) => handleEvent(client, event)));
                                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                                console.error("Error handling events:", error);
                                                                                                                                                                                                  }
                                                                                                                                                                                                  
                                                                                                                                                                                                    return res.status(200).json({ message: "OK" });
                                                                                                                                                                                                    }
