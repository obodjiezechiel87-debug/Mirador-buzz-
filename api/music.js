module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
  try {
    var q = req.query.q, id = req.query.id, name = req.query.name;

    if (q) {
      var limit = Math.min(parseInt(req.query.limit || "8", 10) || 8, 12);
      var r = await fetch("https://api.deezer.com/search/artist?q=" + encodeURIComponent(q) + "&limit=" + limit);
      var j = await r.json();
      var artists = (j.data || []).map(function (a) {
        return { id: a.id, name: a.name, picture: a.picture_medium || a.picture, fans: a.nb_fan, link: a.link };
      });
      return res.status(200).json({ artists: artists });
    }

    if (id && /^\d+$/.test(id)) {
      var tReq = fetch("https://api.deezer.com/artist/" + id + "/top?limit=6").then(function (x) { return x.json(); });
      var aReq = name
        ? fetch("https://itunes.apple.com/search?entity=musicArtist&limit=5&term=" + encodeURIComponent(name))
            .then(function (x) { return x.json(); }).catch(function () { return { results: [] }; })
        : Promise.resolve({ results: [] });
      var out = await Promise.all([tReq, aReq]);
      var tracks = (out[0].data || []).map(function (t) {
        return {
          title: t.title,
          link: t.link,
          preview: t.preview,
          cover: t.album && (t.album.cover_medium || t.album.cover),
          album: t.album && t.album.title
        };
      });
      var apple = null;
      var list = out[1].results || [];
      var wanted = (name || "").toLowerCase();
      for (var i = 0; i < list.length; i++) {
        if ((list[i].artistName || "").toLowerCase() === wanted) { apple = list[i].artistLinkUrl; break; }
      }
      if (!apple && list[0]) apple = list[0].artistLinkUrl;
      return res.status(200).json({ tracks: tracks, apple: apple });
    }

    res.status(400).json({ error: "Paramètre manquant" });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
