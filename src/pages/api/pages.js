import path from "path";
import fs from "fs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "pages-data.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load pages data" });
  }
}
