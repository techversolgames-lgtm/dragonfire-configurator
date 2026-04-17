/**
 * /api/pages – returns a list of manufacturers/pages for the Navbar search.
 * Returns an empty list when no CMS integration is configured.
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.status(200).json({ manufacturers: [] });
}
