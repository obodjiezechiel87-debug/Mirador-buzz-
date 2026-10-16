// Clips vidéo officiels d'un artiste, via l'API YouTube Data v3.
// Nécessite la variable d'environnement YOUTUBE_API_KEY (à ajouter dans Vercel).
// Renvoie : id de la vidéo, titre, chaîne, miniature.
function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .trim();
}

module.exports = async function handler(req, res) {
  try {
    var name = String(req.query.q || "").trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: "Paramètre manquant" });

    var key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ items: [], reason: "no_key" });
    }

    // La recherche coûte 100 points de quota : on garde la réponse 7 jours en cache
    // pour que chaque artiste ne consomme le quota qu'une fois par semaine.
    // Mode "nouveautés" (?new=1) : clips les plus récents (90 derniers jours), cache 12 h.
    var isNew = String(req.query.new || "") === "1";
    res.setHeader("Cache-Control", isNew
      ? "s-maxage=43200, stale-while-revalidate=43200"
      : "s-maxage=604800, stale-while-revalidate=86400");

    var url = "https://www.googleapis.com/youtube/v3/search"
      + "?part=snippet&type=video&videoEmbeddable=true&videoSyndicated=true&videoCategoryId=10"
      + (isNew
        ? "&order=date&maxResults=3&publishedAfter=" + encodeURIComponent(new Date(Date.now() - 90 * 86400000).toISOString())
        : "&maxResults=6")
      + "&q=" + encodeURIComponent(name + " clip officiel")
      + "&key=" + encodeURIComponent(key);
    var r = await fetch(url);
    if (!r.ok) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ items: [], reason: r.status === 403 ? "quota" : "error" });
    }
    var data = await r.json();

    var items = [];
    (data.items || []).forEach(function (it) {
      var id = it.id && it.id.videoId;
      var sn = it.snippet || {};
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      var th = sn.thumbnails || {};
      var thumb = (th.high || th.medium || th.default || {}).url || "";
      items.push({ id: id, title: decode(sn.title), channel: decode(sn.channelTitle), thumb: thumb, date: sn.publishedAt || "" });
    });
    return res.status(200).json({ items: items });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: "Erreur serveur" });
  }
};
