import express from "express";
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const q = req.query.query;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const r = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`
    );
    const data = await r.json();

    res.json(
      data.map(x => ({
        id: x.show.id,
        name: x.show.name,
        image: x.show.image?.medium || null,
        summary: x.show.summary || null,
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const r = await fetch(`https://api.tvmaze.com/shows/${req.params.id}`);
    const s = await r.json();

    res.json({
      id: s.id,
      name: s.name,
      image: s.image?.medium || null,
      summary: s.summary || null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
