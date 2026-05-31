/**
 * Fix minor QC issues:
 * 1. FR: duplicate target "après la pluie, le beau temps." (ids 3769, 3918) — replace 3918
 * 2. TR: duplicate target "dost kara günde belli olur." (ids tr-3443, tr-3871) — replace tr-3871
 */
const fs = require("fs");

// Fix French duplicate
let frDeck = JSON.parse(fs.readFileSync("src/data/french/deck.json", "utf8"));
const fr3918 = frDeck.find(c => c.id === 3918);
if (fr3918 && fr3918.target.toLowerCase().includes("après la pluie")) {
  fr3918.target = "Chaque nuage a une doublure argentée, même les jours les plus sombres.";
  fr3918.english = "Every cloud has a silver lining, even on the darkest days.";
  console.log("FR: Replaced duplicate card 3918");
}
fs.writeFileSync("src/data/french/deck.json", JSON.stringify(frDeck, null, 2) + "\n");

// Fix Turkish duplicate
let trDeck = JSON.parse(fs.readFileSync("src/data/turkish/deck.json", "utf8"));
const tr3871 = trDeck.find(c => c.id === "tr-3871");
if (tr3871 && tr3871.target.toLowerCase().includes("dost kara")) {
  tr3871.target = "Gerçek arkadaş, zor zamanlarda yanında olandır.";
  tr3871.english = "A true friend is the one who is by your side in difficult times.";
  console.log("TR: Replaced duplicate card tr-3871");
}
fs.writeFileSync("src/data/turkish/deck.json", JSON.stringify(trDeck, null, 2) + "\n");

console.log("Done fixing minor QC issues");
