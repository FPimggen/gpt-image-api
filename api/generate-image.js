import OpenAI from "openai";

export default async function handler(req, res) {
  // Step 5: CORS goes right here, at the top of the handler
  const ALLOWED_ORIGIN = "https://ai.facelesspaydays.com";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).end();

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const {
      prompt,
      size = "1024x1024",
      quality = "auto",
      output_format = "png",
      output_compression,
      background
    } = req.body || {};

    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      output_format,
      ...(typeof output_compression === "number" ? { output_compression } : {}),
      ...(background ? { background } : {}),
      response_format: "b64_json"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    const mime =
      output_format === "jpeg" ? "image/jpeg" :
      output_format === "webp" ? "image/webp" : "image/png";

    const dataUrl = `data:${mime};base64,${b64}`;
    res.status(200).json({ dataUrl, b64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}