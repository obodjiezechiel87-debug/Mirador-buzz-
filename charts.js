// Fonction serveur (Vercel) : classements musicaux. Aucune clé nécessaire.
//  - Apple Music : /api/charts?source=apple&country=ci   (titres les plus écoutés du pays)
//  - Deezer      : /api/charts?source=deezer&genre=0     (classement par style, monde)
//  - Styles Deezer : /api/charts?source=deezer&list=genres
module.exports = async function handler(req, res) {
  try {
    var src = String(req.query.source || "");

    if (src === "apple") {
      var cc = String(req.query.country || "ci").toLowerCase();
      if (!/^[a-z]{2}$/.test(cc)) return res.status(400).json({ error: "Pays invalide" });
      var r = await fetch("https://rss.marketingtools.apple.com/api/v2/" + cc + "/music/most-played/100/songs.json");
      if (!r.ok) { res.setHeader("Cache-Control", "s-maxage=600"); return res.status(200).json({ items: [], reason: "unavailable" }); }
      var j = await r.json();
      var list = (j.feed && j.feed.results) || [];
      var items = list.map(function (s, i) {
        var g = (s.genres || []).map(function (x) { return x.name; }).filter(function (n) { return n && n !== "Music"; });
        return { rank: i + 1, title: s.name, artist: s.artistName, cover: s.artworkUrl100, url: s.url, genres: g };
      });
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
      return res.status(200).json({ items: items });
    }

    if (src === "deezer") {
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
      if (String(req.query.list || "") === "genres") {
        var gr = await fetch("https://api.deezer.com/genre");
        var gj = await gr.json();
        var genres = (gj.data || []).map(function (g) { return { id: g.id, name: g.name }; });
        return res.status(200).json({ genres: genres });
      }
      var gid = String(req.query.genre || "0");
      if (!/^\d+$/.test(gid)) return res.status(400).json({ error: "Style invalide" });
      var tr = await fetch("https://api.deezer.com/chart/" + gid + "/tracks?limit=50");
      var tj = await tr.json();
      var tracks = (tj.data || []).map(function (t, i) {
        return {
          rank: i + 1, title: t.title, artist: t.artist && t.artist.name, link: t.link, preview: t.preview,
          cover: t.album && (t.album.cover_medium || t.album.cover), album: t.album && t.album.title
        };
      });
      return res.status(200).json({ items: tracks });
    }

    res.status(400).json({ error: "Paramètre manquant" });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
