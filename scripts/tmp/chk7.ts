import { lookupWord } from '../../src/data/dictionary/el';
for(const w of ['γλυκό','εκκλησία','συγχαρητήρια','αναμμένα','κεριά','σου']) console.log(w, lookupWord(w)?'OK':'MISSING');
