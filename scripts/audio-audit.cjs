const fs = require("fs");
const path = require("path");

const langs = [
  ["spanish","es"], ["italian","it"], ["french","fr"], ["portuguese","pt"],
  ["german","de"], ["dutch","nl"], ["swedish","sv"], ["welsh","cy"],
  ["hindi","hi"], ["turkish","tr"], ["russian","ru"]
];

for (const [dir, code] of langs) {
  const deck = JSON.parse(fs.readFileSync("src/data/" + dir + "/deck.json", "utf8"));
  const withAudio = deck.filter(c => c.audio && c.audio.trim() !== "").length;
  const noAudio = deck.length - withAudio;

  // Check if actual mp3 files exist for cards that have audio field
  let missing = 0;
  let checked = 0;
  const missingExamples = [];
  for (const card of deck) {
    if (!card.audio || card.audio.trim() === "") continue;
    checked++;
    const audioPath = path.join("public/quest-audio", card.audio);
    if (!fs.existsSync(audioPath)) {
      missing++;
      if (missingExamples.length < 3) missingExamples.push(card.audio);
    }
  }

  console.log(code.toUpperCase() + ": " + withAudio + "/" + deck.length + " have audio field | " + missing + "/" + checked + " files missing" + (noAudio > 0 ? " | " + noAudio + " cards have NO audio field" : "") + (missingExamples.length > 0 ? " | e.g. " + missingExamples.join(", ") : ""));
}
