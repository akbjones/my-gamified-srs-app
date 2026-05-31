import { lookupWord as luEs } from '../src/data/dictionary/es';
import { lookupWord as luNl } from '../src/data/dictionary/nl';
console.log('check-in:', JSON.stringify(luEs('check-in')));
console.log('Check-in:', JSON.stringify(luEs('Check-in')));
// Dutch 's'
console.log("'s:", JSON.stringify(luNl("'s")));
console.log("s:", JSON.stringify(luNl("s")));
