import { conjugate, findInfinitive } from "../../src/data/conjugation/el.ts";
const tests = ["πληρώνω","ξαναπαίρνω","συμπληρώνω","αποταμιεύω","δανείζομαι","κολλάω","εξοφλώ"];
for (const v of tests){
  const t = conjugate(v);
  if(!t){ console.log(v, "=> NO TABLE"); continue; }
  console.log("== "+v+" ==");
  for(const k of Object.keys(t)) console.log("  ", k, JSON.stringify(t[k]));
}
