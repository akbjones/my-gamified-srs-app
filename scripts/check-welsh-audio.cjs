const fs = require("fs");
const d = JSON.parse(fs.readFileSync("src/data/welsh/deck.json", "utf8"));
const withAudio = d.filter(c => c.audio && c.audio.trim() !== "").length;
console.log("Welsh cards with audio:", withAudio, "/", d.length);
if (withAudio > 0) {
  console.log("Sample:", d[0].audio, d[100].audio, d[500].audio);
}
