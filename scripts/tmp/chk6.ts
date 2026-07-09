import { lookupWord } from '../../src/data/dictionary/el';
for(const w of ['πως','σαββατοκύριακο','χειμώνα','μας','κρύο']) console.log(w, lookupWord(w)?'OK':'MISSING');
