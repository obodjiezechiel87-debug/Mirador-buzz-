function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .trim();
}
function tag(block, name) {
  var m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">"));
  return m ? decode(m[1]) : "";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  try {
    var name = String(req.query.q || "").trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: "Paramètre manquant" });

    var query = '"' + name + '" (musique OR chanteur OR chanteuse OR artiste OR album OR concert OR clip) when:30d';
    var url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=fr&gl=FR&ceid=FR:fr";
    var r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MiradorBuzz/1.0)" } });
    if (!r.ok) return res.status(502).json({ error: "Source indisponible" });
    var xml = await r.text();

    var items = [];
    var blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (var i = 0; i < blocks.length && items.length < 8; i++) {
      var b = blocks[i];
      var title = tag(b, "title");
      var source = tag(b, "source");
      if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3));
      var link = tag(b, "link");
      var date = tag(b, "pubDate");
      if (title && link) items.push({ title: title, source: source, link: link, date: date ? new Date(date).toISOString() : null });
    }
    return res.status(200).json({ items: items });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
