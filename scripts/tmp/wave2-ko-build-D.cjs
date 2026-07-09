const fs = require('fs');
const T = __dirname + '/';
const srcs = [1,2,3,4].map(n => JSON.parse(fs.readFileSync(T + `wave2-ko-D-src${n}.json`, 'utf8')));
const n11 = srcs[0].concat(srcs[1]);
const n12 = srcs[2].concat(srcs[3]);
const TAGMAP = { g: 'general', w: 'work', t: 'travel', f: 'family' };
// keep tip density in the 35-45% band: drop the weakest tips
const DROP_TIP = new Set([
  1053,1059,1066,1075,1090,1091,1096,1098,1102,1111,
  1118,1120,1127,1132,1134,1145,1149,1152,1161,1162,1166,1174,
  1178,1185,1192,1203,1204,1208,1213,1215,1227,1232,1235,
  1239,1245,1249,1255,1256,1259,1260,1264,1268,1270,1276,1277,1284,1288,1291,1299,
]);
// add travel/family tags where the card serves that goal
const ADD_TAG = {
  1063:'t',1072:'t',1074:'t',1124:'t',1126:'t',1128:'t',1129:'t',1133:'t',
  1187:'t',1188:'t',1237:'t',1239:'t',1240:'t',1241:'t',1242:'t',1249:'t',
  1252:'t',1256:'t',1258:'t',1259:'t',
  1220:'f',1228:'f',
};
const cards = [];
let n = 1051;
for (const [node, list] of [['node-11', n11], ['node-12', n12]]) {
  for (const [target, english, tags, tip] of list) {
    const id = `ko-${n}`;
    let tagStr = tags;
    if (ADD_TAG[n] && !tagStr.includes(ADD_TAG[n])) tagStr += ADD_TAG[n];
    const card = {
      id, target, english,
      audio: `ko-${id}.mp3`,
      tags: [...tagStr].map(c => TAGMAP[c]),
      grammarNode: node,
      priority: n,
    };
    if (tip && !DROP_TIP.has(n)) card.grammar = tip;
    cards.push(card);
    n++;
  }
}
fs.writeFileSync(T + 'wave2-ko-cards-D.json', JSON.stringify(cards, null, 1) + '\n');
const tips = cards.filter(c => c.grammar).length;
const tag = t => cards.filter(c => c.tags.includes(t)).length;
console.log(`cards=${cards.length} tips=${tips} (${(tips/cards.length*100).toFixed(1)}%) work=${tag('work')} travel=${tag('travel')} family=${tag('family')}`);
