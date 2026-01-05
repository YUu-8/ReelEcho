import express from "express";
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const q = req.query.query;
    if (!q) return res.status(400).json({ error: "Missing query" });

    // Search TV shows from TVMaze and movies from TMDB
    const results = [];

    try {
      const showRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
      if (showRes.ok) {
        const showData = await showRes.json();
        results.push(...showData.map(x => ({
          id: `tvmaze-${x.show.id}`,
          name: x.show.name,
          type: 'TV Show',
          image: x.show.image?.medium || null,
          summary: x.show.summary || null,
        })));
      }
    } catch (e) {
      console.log('TVMaze search failed:', e.message);
    }

    try {
      const movieRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=8265bd1679663a7ea12ac168da84d2e8&query=${encodeURIComponent(q)}`);
      if (movieRes.ok) {
        const movieData = await movieRes.json();
        if (movieData.results) {
          results.push(...movieData.results.slice(0, 10).map(x => ({
            id: `tmdb-${x.id}`,
            name: x.title || x.original_title,
            type: 'Movie',
            image: x.poster_path ? `https://image.tmdb.org/t/p/w185${x.poster_path}` : null,
            summary: x.overview || null,
          })));
        }
      }
    } catch (e) {
      console.log('TMDB search failed:', e.message);
    }

    res.json(results);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Check if it's a TVMaze or TMDB ID
    if (id.startsWith('tvmaze-')) {
      const tvmazeId = id.replace('tvmaze-', '');
      const r = await fetch(`https://api.tvmaze.com/shows/${tvmazeId}`);
      const s = await r.json();

      res.json({
        id: `tvmaze-${s.id}`,
        name: s.name,
        type: 'TV Show',
        image: s.image?.medium || null,
        summary: s.summary || null,
      });
    } else if (id.startsWith('tmdb-')) {
      const tmdbId = id.replace('tmdb-', '');
      const r = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=8265bd1679663a7ea12ac168da84d2e8`);
      const m = await r.json();

      res.json({
        id: `tmdb-${m.id}`,
        name: m.title || m.original_title,
        type: 'Movie',
        image: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
        summary: m.overview || null,
      });
    } else {
      // Legacy support: assume TVMaze ID if no prefix
      const r = await fetch(`https://api.tvmaze.com/shows/${id}`);
      const s = await r.json();

      res.json({
        id: s.id,
        name: s.name,
        type: 'TV Show',
        image: s.image?.medium || null,
        summary: s.summary || null,
      });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
