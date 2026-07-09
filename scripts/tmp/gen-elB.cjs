/* Wave-3 slice B generator: el-1551..el-1800.
   node-15 (1551..1675) Καιρός & εποχές; node-16 (1676..1800) Γιορτές.
   Tags: g=general(always), t=travel, w=work, f=family. */
const fs = require('fs');

// [target, english, tags, grammar|null]
const N15 = [
// — weather small talk / asking —
["Τι καιρό κάνει έξω σήμερα;","What's the weather like outside today?","g","Τι καιρό κάνει; (ti keró káni) = what's the weather like — καιρός goes with κάνω."],
["Κάνει πολλή ζέστη από το πρωί.","It's very hot since this morning.","g","κάνει ζέστη (káni zésti) = it's hot; κάνει κρύο = it's cold."],
["Σήμερα κάνει κρύο, πάρε ένα μπουφάν.","Today it's cold, take a jacket.","g,f",null],
["Ο καιρός είναι υπέροχος για βόλτα.","The weather is lovely for a walk.","g",null],
["Είδες τι ωραία μέρα σήμερα;","Did you see what a nice day it is today?","g",null],
["Λένε πως θα βρέξει όλο το Σαββατοκύριακο.","They say it'll rain all weekend.","g","θα βρέξει (tha vréksi) = it'll rain — one-off future, perfective."],
["Τι λέει το δελτίο καιρού για αύριο;","What does the forecast say for tomorrow?","g,t","το δελτίο καιρού (to deltío keroú) = the weather forecast."],
["Ο καιρός είναι άστατος αυτές τις μέρες.","The weather is unsettled these days.","g",null],
["Επιτέλους βγήκε ο ήλιος!","Finally the sun came out!","g",null],
["Μάλλον θα έχουμε καταιγίδα το απόγευμα.","We'll probably have a storm this afternoon.","g",null],
// — heat / heatwave —
["Λιώνω από τη ζέστη εδώ μέσα.","I'm melting from the heat in here.","g","λιώνω από τη ζέστη (lióno apó ti zésti) = I'm melting from the heat."],
["Σήμερα έχει σαράντα βαθμούς στη σκιά!","Today it's forty degrees in the shade!","g","βαθμοί (vathmí) = degrees: έχει σαράντα βαθμούς = it's forty degrees."],
["Ο καύσωνας κρατάει όλη την εβδομάδα.","The heatwave lasts all week.","g","ο καύσωνας (o káfsonas) = the heatwave — the deadly summer heat spells."],
["Δεν έκλεισα μάτι με τη ζέστη.","I didn't sleep a wink with the heat.","g,f","δεν έκλεισα μάτι (den éklisa máti) = I didn't sleep a wink."],
["Άνοιξε το κλιματιστικό, σε παρακαλώ.","Turn on the air conditioner, please.","g,f",null],
["Πίνω νερό συνέχεια μέσα στον καύσωνα.","I drink water constantly during the heatwave.","g",null],
["Το μεσημέρι η ζέστη είναι αφόρητη.","At noon the heat is unbearable.","g","αφόρητη (afóriti) = unbearable — for heat, noise, anything too much."],
["Μη βγαίνεις έξω το μεσημέρι με τέτοια ζέστη.","Don't go out at noon in such heat.","g,f","μη βγαίνεις (mi vyénis) = don't go out — μη + present for a standing rule."],
["Ιδρώνω μόλις βγω στον δρόμο.","I sweat the moment I step onto the street.","g",null],
["Ο ήλιος είναι πολύ δυνατός τον Αύγουστο.","The sun is very strong in August.","g,t",null],
["Βάλε ένα καπέλο για τον ήλιο.","Put on a hat for the sun.","g,f",null],
["Τα βράδια δεν δροσίζει καθόλου φέτος.","The evenings don't cool down at all this year.","g","δροσίζει (drosízi) = it cools down — of the evening air."],
["Ανεβαίνει πολύ η θερμοκρασία το μεσημέρι.","The temperature rises a lot at midday.","g","ανεβαίνει η θερμοκρασία (anevéni i thermokrasía) = the temperature rises."],
["Έχει μεγάλη υγρασία κοντά στη θάλασσα.","It's very humid near the sea.","g,t","η υγρασία (i iɣrasía) = humidity — heavy by the coast."],
["Θέλω ένα παγωμένο νερό τώρα αμέσως.","I want an ice-cold water right now.","g",null],
["Πήγαινε στη σκιά, κάνει δροσιά εκεί.","Go into the shade, it's cool there.","g","κάνει δροσιά (káni drosiá) = it's cool/breezy — the opposite of κάνει ζέστη."],
["Ο ανεμιστήρας δεν φτάνει με τέτοια ζέστη.","The fan isn't enough in this heat.","g,f",null],
["Πάμε για μπάνιο, έχει πολλή ζέστη.","Let's go for a swim, it's very hot.","g,t",null],
// — cold / winter —
["Έξω παγώνει, βάλε ένα κασκόλ.","It's freezing outside, put on a scarf.","g,f","παγώνει (paɣóni) = it's freezing — literally 'it freezes'."],
["Χθες βράδυ πάγωσα στη στάση.","Last night I froze at the bus stop.","g","πάγωσα (páɣosa) = I froze — the aorist, one finished moment."],
["Φέτος ο χειμώνας είναι βαρύς.","This year the winter is harsh.","g",null],
["Χιονίζει στα βουνά από το πρωί.","It's snowing in the mountains since morning.","g","χιονίζει (çonízi) = it's snowing."],
["Πέρσι χιόνισε ακόμα και στην Αθήνα.","Last year it even snowed in Athens.","g","χιόνισε (çónise) = it snowed — the one-off aorist."],
["Τα χέρια μου πάγωσαν από το κρύο.","My hands froze from the cold.","g",null],
["Άναψε το τζάκι, κρυώνουμε όλοι.","Light the fireplace, we're all cold.","g,f","άναψε (ánapse) = light it! — the command of ανάβω."],
["Βάλε κάτι ζεστό, έξω έχει παγωνιά.","Put on something warm, it's freezing outside.","g,f","η παγωνιά (i paɣoniá) = freezing cold weather."],
["Ο βοριάς είναι τσουχτερός σήμερα.","The north wind is biting today.","g","ο βοριάς (o voriás) = the cold north wind."],
["Το χιόνι έστρωσε σε όλη την πλατεία.","The snow settled over the whole square.","g","έστρωσε το χιόνι (éstrose to çóni) = the snow settled/blanketed."],
["Κάνει τσουχτερό κρύο τα ξημερώματα.","It's bitterly cold at dawn.","g",null],
["Πίνω ζεστό τσάι όλο τον χειμώνα.","I drink hot tea all winter long.","g",null],
["Βάλε γάντια, θα παγώσουν τα δάχτυλά σου.","Put on gloves, your fingers will freeze.","g,f","θα παγώσουν (tha paɣósun) = they'll freeze — one-off future."],
["Η ομίχλη το πρωί δεν σε αφήνει να δεις.","The morning fog won't let you see.","g,t","η ομίχλη (i omíçli) = the fog."],
["Έχει τόση υγρασία που παγώνεις μέχρι το κόκκαλο.","It's so damp you freeze to the bone.","g",null],
["Ο χειμώνας φέτος άργησε να έρθει.","Winter was late to arrive this year.","g",null],
// — rain / storms —
["Βρέχει καρεκλοπόδαρα, μη βγεις έξω.","It's pouring, don't go out.","g","βρέχει καρεκλοπόδαρα (kareklopódara) = it's raining cats and dogs."],
["Πάρε ομπρέλα, θα βρέξει σε λίγο.","Take an umbrella, it'll rain soon.","g,f",null],
["Έβρεχε ασταμάτητα όλη τη νύχτα.","It rained non-stop all night.","g","έβρεχε (évreçe) = it was raining — imperfect for the whole-night background."],
["Μας βρήκε η βροχή στον δρόμο.","The rain caught us on the way.","g","μας βρήκε η βροχή (mas vríke i vroçí) = the rain caught us out."],
["Ακούς τους κεραυνούς; Έρχεται καταιγίδα.","Do you hear the thunder? A storm's coming.","g,f","οι κεραυνοί (i keravní) = the thunderclaps."],
["Η αστραπή φώτισε όλο τον ουρανό.","The lightning lit up the whole sky.","g","φώτισε (fótise) = it lit up — aorist of φωτίζω."],
["Πλημμύρισαν οι δρόμοι από τη βροχή.","The streets flooded from the rain.","g,t","πλημμύρισαν (plimírisan) = they flooded."],
["Ξέχασα την ομπρέλα μου στο λεωφορείο.","I forgot my umbrella on the bus.","g,t",null],
["Μόλις άνοιξα την πόρτα, άρχισε η βροχή.","The moment I opened the door, the rain started.","g","Two finished events, two aorists: άνοιξα... άρχισε (ánixa... árçise)."],
["Ο ουρανός μαύρισε, θα ρίξει καταιγίδα.","The sky went black, it'll pour.","g","θα ρίξει (tha ríksi) = it'll pour — ρίχνει βροχή, the sky 'throws' rain."],
["Έγινα μούσκεμα χωρίς ομπρέλα.","I got soaked without an umbrella.","g","έγινα μούσκεμα (éɣina múskema) = I got drenched — literally 'I became soaking'."],
["Χαλάζι έπεσε πάνω στα αυτοκίνητα.","Hail fell on the cars.","g","το χαλάζι (to çalázi) = hail; it 'falls' like rain: έπεσε χαλάζι."],
["Μετά τη βροχή βγήκε ουράνιο τόξο.","After the rain a rainbow came out.","g","το ουράνιο τόξο (to uránio tókso) = the rainbow."],
["Πάρε το αδιάβροχό σου για το βουνό.","Take your raincoat for the mountain.","g,t","το αδιάβροχο (to adiávroxo) = the raincoat — a-'not' + βρέχω 'wet'."],
// — wind / meltemi —
["Φυσάει δυνατά σήμερα στο νησί.","It's blowing hard on the island today.","g,t","φυσάει (fisái) = it's windy — the wind 'blows'."],
["Το μελτέμι φυσάει δυνατά τον Αύγουστο.","The meltemi blows hard in August.","g,t","το μελτέμι (to meltémi) = the dry north wind of the Aegean summer."],
["Με το μελτέμι δεν φεύγουν τα πλοία.","With the meltemi the ferries don't sail.","g,t",null],
["Ο αέρας πήρε την ομπρέλα της παραλίας.","The wind carried off the beach umbrella.","g,t",null],
["Πρόσεχε το καπέλο σου, φυσάει δυνατά.","Watch your hat, it's blowing hard.","g,t","πρόσεχε (próseçe) = keep watching — the ongoing command of προσέχω."],
["Ο άνεμος δυνάμωσε το βράδυ.","The wind picked up in the evening.","g","δυνάμωσε (dinámose) = it strengthened — aorist of δυναμώνω."],
["Τα κύματα είναι τεράστια με τόσο αέρα.","The waves are huge with so much wind.","g,t","τα κύματα (ta kímata) = the waves."],
["Δεν άνοιξαν οι ομπρέλες με τον αέρα.","The umbrellas didn't open in the wind.","g,t",null],
["Οι σημαίες ανεμίζουν από το πρωί.","The flags have been flapping since morning.","g","ανεμίζουν (anemízun) = they flutter — from άνεμος, wind."],
["Έκλεισαν τα σχολεία λόγω κακοκαιρίας.","Schools closed because of the bad weather.","g,w","η κακοκαιρία (i kakokería) = bad weather; λόγω = because of."],
// — sun / clear skies —
["Ο ήλιος λάμπει και δεν έχει ούτε σύννεφο.","The sun's shining and there's not a single cloud.","g","ούτε σύννεφο (úte sínefo) = not even a cloud."],
["Τι υπέροχη λιακάδα σήμερα!","What lovely sunshine today!","g","η λιακάδα (i liakáða) = bright sunshine, a sunny spell."],
["Ο ουρανός είναι καταγάλανος σήμερα.","The sky is deep blue today.","g","κατα- makes it intense: καταγάλανος (kataɣálanos) = deep blue."],
["Βγήκε ο ήλιος μετά από μέρες βροχής.","The sun came out after days of rain.","g",null],
["Έχει ωραία λιακάδα, πάμε για καφέ έξω.","There's nice sunshine, let's have coffee outside.","g,f",null],
["Πάρε τα γυαλιά ηλίου σου, χτυπάει ο ήλιος.","Grab your sunglasses, the sun's glaring.","g,t","τα γυαλιά ηλίου (ta ɣaliá ilíu) = sunglasses."],
["Το ηλιοβασίλεμα εδώ είναι μαγικό.","The sunset here is magical.","g,t","το ηλιοβασίλεμα (to iliovasílema) = the sunset."],
["Ο ήλιος είναι δυνατός ακόμα και με σύννεφα.","The sun is strong even with clouds.","g,t",null],
// — seasons in general —
["Ποια εποχή σου αρέσει πιο πολύ;","Which season do you like most?","g","η εποχή (i epoçí) = the season."],
["Η αγαπημένη μου εποχή είναι το φθινόπωρο.","My favorite season is autumn.","g","το φθινόπωρο (to fthinóporo) = autumn."],
["Στην Ελλάδα το καλοκαίρι κρατάει πολύ.","In Greece summer lasts a long time.","g,t",null],
["Ο χειμώνας εδώ είναι ήπιος και σύντομος.","Winter here is mild and short.","g","ήπιος (ípios) = mild — for weather and climate."],
["Την άνοιξη τα πάντα ανθίζουν.","In spring everything blooms.","g","ανθίζουν (anthízun) = they bloom, from το άνθος = flower."],
["Το φθινόπωρο πέφτουν τα φύλλα από τα δέντρα.","In autumn the leaves fall from the trees.","g","τα φύλλα (ta fíla) = the leaves."],
["Αλλάζει η ώρα τον Οκτώβριο.","The clocks change in October.","g","αλλάζει η ώρα (alázi i óra) = the clocks change — the hour 'changes'."],
["Οι μέρες μικραίνουν τον χειμώνα.","The days get shorter in winter.","g","μικραίνουν (mikrénun) = they get smaller/shorter."],
["Τον Ιούνιο οι μέρες μεγαλώνουν πολύ.","In June the days get much longer.","g","μεγαλώνουν (meɣalónun) = they grow longer."],
["Κάθε εποχή έχει τη δική της ομορφιά.","Each season has its own beauty.","g","τη δική της (ti dikí tis) = its own — δικός agrees like an adjective."],
["Προτιμάω την άνοιξη από το καλοκαίρι.","I prefer spring to summer.","g",null],
["Το κλίμα εδώ είναι μεσογειακό.","The climate here is Mediterranean.","g,t","το κλίμα (to klíma) = the climate."],
["Φέτος η άνοιξη ήρθε νωρίς.","This year spring came early.","g",null],
["Μου αρέσει η μυρωδιά μετά τη βροχή.","I love the smell after the rain.","g","η μυρωδιά (i miroðiá) = the smell."],
// — spring —
["Την άνοιξη ο καιρός είναι άστατος.","In spring the weather is changeable.","g",null],
["Τα λουλούδια άνθισαν νωρίς φέτος.","The flowers bloomed early this year.","g","άνθισαν (ánthisan) = they bloomed — the finished aorist."],
["Ο καιρός γλυκαίνει μέρα με τη μέρα.","The weather is getting milder day by day.","g","γλυκαίνει (ɣlikéni) = it's turning mild — the weather 'sweetens'."],
["Έχω αλλεργία στη γύρη κάθε άνοιξη.","I'm allergic to pollen every spring.","g",null],
["Την άνοιξη κάνουμε εκδρομές στην εξοχή.","In spring we take trips to the countryside.","g,f,t","η εξοχή (i eksoçí) = the countryside."],
["Ο ουρανός γέμισε χελιδόνια.","The sky filled with swallows.","g","τα χελιδόνια (ta çeliðónia) = the swallows, spring's messengers."],
["Η αυλή μυρίζει υπέροχα την άνοιξη.","The yard smells wonderful in spring.","g,f",null],
["Τον Μάρτιο ο καιρός αλλάζει συνέχεια.","In March the weather keeps changing.","g",null],
// — autumn —
["Το φθινόπωρο αρχίζουν οι πρώτες βροχές.","In autumn the first rains begin.","g",null],
["Μυρίζει βροχή, θα βρέξει σύντομα.","It smells like rain, it'll rain soon.","g","μυρίζει βροχή (mirízi vroçí) = it smells of rain."],
["Οι θερμοκρασίες πέφτουν σιγά σιγά.","The temperatures are dropping little by little.","g","σιγά σιγά (siɣá siɣá) = little by little, gradually."],
["Τον Σεπτέμβριο η θάλασσα είναι ακόμα ζεστή.","In September the sea is still warm.","g,t",null],
["Το φθινόπωρο μαζεύουμε κάστανα στο βουνό.","In autumn we gather chestnuts on the mountain.","g,f,t","τα κάστανα (ta kástana) = the chestnuts."],
["Άρχισε να κρυώνει τα βράδια.","It's started getting cold in the evenings.","g","άρχισε να (árçise na) = it started to — followed by the verb."],
["Ήρθε το φθινόπωρο με τις πρώτες βροχές.","Autumn has come with the first rains.","g",null],
["Τα φύλλα κοκκίνισαν στα δέντρα.","The leaves turned red on the trees.","g","κοκκίνισαν (kokínisan) = they turned red, from κόκκινος."],
// — beach culture —
["Πάμε παραλία, έχει ζέστη σήμερα.","Let's go to the beach, it's hot today.","g,t",null],
["Κλείσαμε δύο ξαπλώστρες κάτω από την ομπρέλα.","We booked two sunbeds under the umbrella.","g,t","η ξαπλώστρα (i ksaplóstra) = the sunbed, from ξαπλώνω 'lie down'."],
["Πόσο κοστίζει η ξαπλώστρα για μία μέρα;","How much is a sunbed for one day?","g,t",null],
["Βάλε αντηλιακό πριν πέσεις στη θάλασσα.","Put on sunscreen before you jump in the sea.","g,t","πριν πέσεις (prin pésis) = before you dive in — one-off form after πριν."],
["Ξέχασα την πετσέτα θαλάσσης στο ξενοδοχείο.","I forgot the beach towel at the hotel.","g,t",null],
["Η παραλία γεμίζει κόσμο τον Αύγουστο.","The beach fills with people in August.","g,t",null],
["Το νερό είναι παγωμένο αλλά υπέροχο.","The water is freezing but wonderful.","g,t",null],
["Απλώστε την πετσέτα εκεί, στη σκιά.","Spread the towel there, in the shade.","g,t",null],
["Πρόσεχε, η άμμος είναι καυτή το μεσημέρι.","Careful, the sand is scorching at noon.","g,t,f","η άμμος (i ámos) = the sand."],
["Νοικιάσαμε ομπρέλα και δύο ξαπλώστρες.","We rented an umbrella and two sunbeds.","g,t",null],
["Κολυμπήσαμε μέχρι τη σημαδούρα.","We swam out to the buoy.","g,t","η σημαδούρα (i simaðúra) = the buoy."],
["Μη μείνεις πολλή ώρα στον ήλιο.","Don't stay too long in the sun.","g,f","μη μείνεις (mi mínis) = don't stay — one-off μη + perfective."],
["Το απόγευμα φυσάει και δροσίζει στην παραλία.","In the afternoon it turns breezy and cool at the beach.","g,t",null],
["Πήραμε παγωτό στην παραλία το μεσημέρι.","We got ice cream at the beach at noon.","g,t,f",null],
// — weather-dependent plans —
["Αν έχει καλό καιρό, θα πάμε εκδρομή.","If the weather's good, we'll go on a trip.","g,t,f","αν έχει... θα (an éçi... tha) = if it's..., we'll — the everyday 'if' plan."],
["Αν βρέξει, μένουμε σπίτι και βλέπουμε ταινία.","If it rains, we'll stay home and watch a movie.","g,f","αν βρέξει (an vréksi) = if it rains — perfective after αν for a one-off."],
["Ακυρώσαμε την εκδρομή λόγω κακοκαιρίας.","We canceled the trip because of bad weather.","g,t","λόγω (lóɣo) = because of — takes the genitive: λόγω κακοκαιρίας."],
["Ο γάμος θα γίνει έξω, αν το επιτρέψει ο καιρός.","The wedding will be outdoors, weather permitting.","g,f","αν το επιτρέψει ο καιρός (an to epitrépsi o kerós) = weather permitting."],
["Λόγω του καύσωνα, δουλεύουμε από το σπίτι.","Because of the heatwave, we're working from home.","g,w",null],
];

const N16 = [
// — name days —
["Πότε γιορτάζεις εσύ;","When's your name day?","g,f","γιορτάζω (ɣiortázo) = I celebrate my name day."],
["Σήμερα γιορτάζει ο Γιώργος, χρόνια πολλά!","Today is George's name day, many happy returns!","g,f","χρόνια πολλά (xrónia polá) = many happy returns — the all-purpose wish."],
["Στην Ελλάδα η γιορτή μετράει πιο πολύ από τα γενέθλια.","In Greece the name day counts more than the birthday.","g,f","η γιορτή (i ɣiortí) = the name day; for adults it often beats the birthday."],
["Στις είκοσι μία Μαΐου γιορτάζουν Κωνσταντίνος και Ελένη.","On May 21 Constantine and Helen have their name day.","g,f",null],
["Πέρασε από το σπίτι, σήμερα γιορτάζω.","Drop by the house, it's my name day.","g,f","On a name day the door stays open — people drop in without an invitation."],
["Τα ονομαστήρια τα γιορτάζουμε με γλυκά.","We celebrate name days with sweets.","g,f","τα ονομαστήρια (ta onomastíria) = the name-day celebration."],
["Της Παναγίας γιορτάζουν όλες οι Μαρίες.","On the Virgin Mary's day all the Marias celebrate.","g,f","Της Παναγίας (tis Panaɣías) = Aug 15, when every Μαρία and Παναγιώτης celebrates."],
["Να χαίρεσαι το όνομά σου!","Enjoy your name day!","g,f","Να χαίρεσαι το όνομά σου (na çérese to ónomá su) = the classic name-day wish."],
["Ο παππούς μου γιορτάζει του Αγίου Δημητρίου.","My grandpa's name day is St. Demetrius's day.","g,f","του Αγίου (tu Aɣíu) = on Saint...'s day — the genitive marks the feast."],
["Δεν στέλνω δώρα, μόνο ευχές για τη γιορτή.","I don't send gifts, just wishes for the name day.","g,f",null],
["Σου πήρα ένα γλυκό για τη γιορτή σου.","I got you a sweet for your name day.","g,f",null],
["Χρόνια πολλά για τη γιορτή σου!","Many happy returns for your name day!","g,f",null],
["Όποιος δεν έχει γιορτή, γιορτάζει των Αγίων Πάντων.","Whoever has no name day celebrates on All Saints' Day.","g,f","Των Αγίων Πάντων (ton Aɣíon Pándon) = All Saints — the catch-all name day."],
["Το βράδυ ήρθαν όλοι για τη γιορτή της μαμάς.","In the evening everyone came for mom's name day.","g,f",null],
["Καλή γιορτή και να χαίρεσαι!","Happy name day, and enjoy it!","g,f",null],
["Στη δουλειά φέρνει γλυκά όποιος γιορτάζει.","At work, whoever has a name day brings sweets.","g,w,f","At the office the person celebrating treats everyone — never the other way around."],
["Ξέχασα να πάρω τηλέφωνο τον Νίκο για τη γιορτή του.","I forgot to call Nikos for his name day.","g,f",null],
["Ποιο είναι το όνομά σου, να δω πότε γιορτάζεις;","What's your name, so I can see when your name day is?","g,f",null],
// — χρόνια πολλά versatility / wishes —
["Το «χρόνια πολλά» ταιριάζει σχεδόν σε κάθε γιορτή.","'Chronia polla' fits almost any celebration.","g","ταιριάζει σε (teriázi se) = it suits/fits — χρόνια πολλά works for everything."],
["Χρόνια πολλά, να είστε πάντα καλά!","Many happy returns, may you always be well!","g,f",null],
["Στα γενέθλια λέμε και «χρόνια πολλά».","At birthdays we also say 'chronia polla'.","g,f",null],
["Καλές γιορτές σε όλη την οικογένεια!","Happy holidays to the whole family!","g,f","Καλές γιορτές (kalés ɣiortés) = happy holidays — for the festive season."],
["Και του χρόνου, με υγεία!","And next year too, in good health!","g,f","Και του χρόνου (ke tu xrónu) = and next year — said at every celebration."],
["Καλή χρονιά, με αγάπη και υγεία!","Happy new year, with love and health!","g,f","Καλή χρονιά (kalí xroniá) = happy new year."],
["Σε γιορτή λέμε χρόνια πολλά, όχι συγχαρητήρια.","At a name day we say 'chronia polla', not 'congratulations'.","g",null],
["Της έστειλα χρόνια πολλά με ένα μήνυμα.","I sent her 'chronia polla' by text.","g,f",null],
["Όλοι λένε χρόνια πολλά σε όποιον γιορτάζει.","Everyone says 'chronia polla' to whoever is celebrating.","g,f",null],
["Χρόνια πολλά και καλή Ανάσταση!","Many happy returns and a blessed Easter!","g,f","Καλή Ανάσταση (kalí Anástasi) = the wish before Easter night."],
// — Easter —
["Το Πάσχα είναι η πιο μεγάλη γιορτή στην Ελλάδα.","Easter is the biggest holiday in Greece.","g,f","Το Πάσχα (to Pásxa) = Easter — bigger than Christmas in Greece."],
["Τη Μεγάλη Εβδομάδα νηστεύουμε πριν το Πάσχα.","During Holy Week we fast before Easter.","g,f","Η Μεγάλη Εβδομάδα (i Meɣáli Evðomáða) = Holy Week."],
["Τη Μεγάλη Πέμπτη βάφουμε κόκκινα αυγά.","On Holy Thursday we dye red eggs.","g,f","βάφουμε αυγά (váfume avɣá) = we dye eggs — traditionally on Holy Thursday."],
["Τα κόκκινα αυγά συμβολίζουν το αίμα του Χριστού.","The red eggs symbolize the blood of Christ.","g","συμβολίζουν (simvolízun) = they symbolize."],
["Η γιαγιά ζυμώνει τσουρέκια κάθε Πάσχα.","Grandma kneads tsoureki every Easter.","g,f","το τσουρέκι (to tsuréki) = the sweet braided Easter bread."],
["Το τσουρέκι μυρίζει μαστίχα και μαχλέπι.","Tsoureki smells of mastic and mahlepi.","g,f",null],
["Τη Μεγάλη Παρασκευή βγαίνει ο Επιτάφιος.","On Good Friday the Epitaphios procession goes out.","g,f","Ο Επιτάφιος (o Epitáfios) = the flower-covered bier carried through the streets."],
["Στολίζουμε τον Επιτάφιο με λουλούδια.","We decorate the Epitaphios with flowers.","g,f",null],
["Τη Μεγάλη Παρασκευή δεν μαγειρεύουμε κρέας.","On Good Friday we don't cook meat.","g,f","Good Friday is a day of mourning and strict fasting."],
["Το Μεγάλο Σάββατο πάμε στην Ανάσταση τα μεσάνυχτα.","On Holy Saturday we go to the Resurrection service at midnight.","g,f","Η Ανάσταση (i Anástasi) = the midnight Resurrection service."],
["Στην Ανάσταση λέμε «Χριστός Ανέστη».","At the Resurrection we say 'Christ is Risen'.","g,f","Χριστός Ανέστη (Xristós Anésti) = Christ is Risen — the Easter greeting."],
["Και απαντάμε «Αληθώς Ανέστη».","And we reply 'Truly He is Risen'.","g,f","Αληθώς Ανέστη (Alithós Anésti) = the fixed reply to Χριστός Ανέστη."],
["Ανάβουμε τις λαμπάδες μας τα μεσάνυχτα.","We light our candles at midnight.","g,f","η λαμπάδα (i lampáða) = the tall Easter candle."],
["Τα παιδιά κρατάνε αναμμένα κεριά στην εκκλησία.","The children hold lit candles in the church.","g,f",null],
["Μετά την Ανάσταση ρίχνουν πυροτεχνήματα.","After the Resurrection they set off fireworks.","g,f","τα πυροτεχνήματα (ta pirotexnímata) = the fireworks."],
["Γυρίζουμε σπίτι και τρώμε μαγειρίτσα.","We go home and eat magiritsa.","g,f","η μαγειρίτσα (i majirítsa) = the soup that breaks the Easter fast."],
["Η μαγειρίτσα λύνει τη νηστεία της Σαρακοστής.","Magiritsa breaks the fast of Lent.","g,f","λύνει τη νηστεία (líni ti nistía) = it breaks the fast."],
["Τσουγκρίζουμε τα κόκκινα αυγά μετά τη μαγειρίτσα.","We crack the red eggs after the magiritsa.","g,f","τσουγκρίζω (tsungrízo) = to knock/crack eggs against each other."],
["Όποιου το αυγό δεν σπάσει, έχει τύχη όλο τον χρόνο.","Whoever's egg doesn't crack has luck all year.","g,f","In the τσούγκρισμα, the last uncracked egg means good luck for its owner."],
["«Χριστός Ανέστη» λέμε και όταν τσουγκρίζουμε.","We say 'Christos Anesti' as we crack the eggs too.","g,f",null],
["Την Κυριακή του Πάσχα ψήνουμε αρνί στη σούβλα.","On Easter Sunday we roast lamb on the spit.","g,f","το αρνί στη σούβλα (to arní sti súvla) = lamb on the spit — the Easter feast."],
["Ο θείος σουβλίζει το αρνί από το πρωί.","My uncle spit-roasts the lamb from the morning.","g,f","σουβλίζω (suvlízo) = to roast on the spit."],
["Όλη η οικογένεια τρώει μαζί το Πάσχα.","The whole family eats together at Easter.","g,f",null],
["Χορεύουμε και τραγουδάμε μέχρι το βράδυ.","We dance and sing until evening.","g,f",null],
["Πριν το Πάσχα ευχόμαστε «Καλή Ανάσταση».","Before Easter we wish 'Kali Anastasi'.","g,f","ευχόμαστε (efxómaste) = we wish — the -όμαστε ending is 'we'."],
["Μετά το Πάσχα λέμε «Χρόνια πολλά» και «Καλό Πάσχα».","After Easter we say 'chronia polla' and 'kalo Pascha'.","g,f",null],
["Τα παιδιά έβαψαν τα αυγά με πολλά χρώματα.","The kids dyed the eggs in many colors.","g,f","έβαψαν (évapsan) = they dyed — the finished aorist of βάφω."],
["Φέτος το Πάσχα έπεσε τον Απρίλιο.","This year Easter fell in April.","g,f","έπεσε το Πάσχα (épese to Pásxa) = Easter fell on — the date 'falls'."],
["Το Πάσχα των Καθολικών είναι συχνά διαφορετική μέρα.","Catholic Easter is often on a different day.","g","Orthodox and Catholic Easter often fall weeks apart."],
["Στα χωριά το Πάσχα κρατάει μέρες.","In the villages Easter lasts for days.","g,f,t",null],
// — Christmas —
["Τα Χριστούγεννα στολίζουμε το δέντρο μαζί.","At Christmas we decorate the tree together.","g,f","το δέντρο (to ðéndro) = the tree; στολίζω = to decorate."],
["Παλιά στόλιζαν καραβάκι αντί για δέντρο.","In the old days they decorated a little boat instead of a tree.","g,f","στόλιζαν (stólizan) = they used to decorate — the older Greek custom of the boat."],
["Την παραμονή τα παιδιά λένε τα κάλαντα.","On Christmas Eve the children sing the carols.","g,f","τα κάλαντα (ta kálanda) = the carols, sung door to door."],
["Τα κάλαντα τα λέμε από πόρτα σε πόρτα.","We sing the carols from door to door.","g,f",null],
["Δίνουμε λίγα χρήματα στα παιδιά με τα κάλαντα.","We give the carol-singing kids a little money.","g,f",null],
["Η μαμά φτιάχνει μελομακάρονα και κουραμπιέδες.","Mom makes melomakarona and kourabiedes.","g,f","The two Christmas sweets: μελομακάρονα (honey) and κουραμπιέδες (sugar)."],
["Τα μελομακάρονα έχουν μέλι και καρύδι.","Melomakarona have honey and walnut.","g,f",null],
["Οι κουραμπιέδες γεμίζουν τα πάντα ζάχαρη άχνη.","Kourabiedes cover everything in powdered sugar.","g,f",null],
["Άλλοι αγαπάνε τα μελομακάρονα, άλλοι τους κουραμπιέδες.","Some love melomakarona, others kourabiedes.","g,f","Every Greek household argues over which of the two is better."],
["Τα Χριστούγεννα τρώμε γαλοπούλα γεμιστή.","At Christmas we eat stuffed turkey.","g,f","η γαλοπούλα (i ɣalopúla) = the turkey."],
["Ανοίγουμε τα δώρα κάτω από το δέντρο.","We open the presents under the tree.","g,f",null],
["Στολίσαμε το σπίτι με φωτάκια και μπάλες.","We decorated the house with lights and baubles.","g,f","τα φωτάκια (ta fotákia) = the little Christmas lights."],
["Τα Χριστούγεννα είναι όλη η οικογένεια μαζί.","At Christmas the whole family is together.","g,f",null],
["Ο δήμος στολίζει την πλατεία με φώτα.","The town decorates the square with lights.","g,t",null],
["Στην πλατεία άναψαν το χριστουγεννιάτικο δέντρο.","In the square they lit the Christmas tree.","g,t","άναψαν (ánapsan) = they lit — the aorist of ανάβω."],
["Τα παιδιά περιμένουν τον Άι-Βασίλη με δώρα.","The kids wait for Santa with presents.","g,f",null],
["Στην Ελλάδα ο Άι-Βασίλης έρχεται την Πρωτοχρονιά.","In Greece Santa comes on New Year's Day.","g,f","Ο Άι-Βασίλης (o Ai-Vasílis) brings gifts on Jan 1, not Christmas."],
["Ευχόμαστε «Καλά Χριστούγεννα» σε όλους.","We wish everyone 'Merry Christmas'.","g,f","Καλά Χριστούγεννα (Kalá Xristúɣena) = Merry Christmas."],
["Τα Χριστούγεννα φέτος τα περάσαμε στο χωριό.","This year we spent Christmas in the village.","g,f,t","περνάω τις γιορτές (pernáo tis ɣiortés) = to spend the holidays somewhere."],
["Ο μπαμπάς έγινε Άι-Βασίλης για τα παιδιά.","Dad became Santa for the kids.","g,f",null],
["Τραγουδήσαμε κάλαντα σε όλη τη γειτονιά.","We sang carols all over the neighborhood.","g,f","τραγουδήσαμε (traɣuðísame) = we sang — the finished aorist."],
["Η φάτνη στην πλατεία είναι πανέμορφη φέτος.","The nativity scene in the square is gorgeous this year.","g,t","η φάτνη (i fátni) = the nativity scene/manger."],
["Κάθε κρύο βράδυ ανάβουμε το τζάκι μας.","Every cold night we light our fireplace.","g,f",null],
// — New Year / Πρωτοχρονιά —
["Την Πρωτοχρονιά κόβουμε τη βασιλόπιτα.","On New Year's we cut the vasilopita.","g,f","η βασιλόπιτα (i vasilópita) = St. Basil's New Year cake."],
["Μέσα στη βασιλόπιτα κρύβουμε ένα φλουρί.","Inside the vasilopita we hide a coin.","g,f","το φλουρί (to flurí) = the lucky coin baked into the cake."],
["Όποιος βρει το φλουρί έχει τύχη όλη τη χρονιά.","Whoever finds the coin has luck all year.","g,f","The finder of the φλουρί is blessed with luck for the whole year."],
["Ο μπαμπάς κόβει το πρώτο κομμάτι για το σπίτι.","Dad cuts the first slice for the house.","g,f","The first slices go to Christ, the house, and the absent, then by age."],
["Μοιράζουμε τη βασιλόπιτα με τη σειρά.","We share out the vasilopita in order.","g,f","μοιράζω (mirázo) = to share out; με τη σειρά = in turn."],
["Φέτος το φλουρί το βρήκε η γιαγιά.","This year grandma got the coin.","g,f","το βρήκε (to vríke) = she found it — the doubled 'it' is normal in speech."],
["Τα μεσάνυχτα ευχόμαστε «Καλή Χρονιά».","At midnight we wish 'Happy New Year'.","g,f",null],
["Στην Πρωτοχρονιά παίζουν χαρτιά για την τύχη.","On New Year's they play cards for luck.","g,f","Card games on New Year's Eve are a Greek luck ritual."],
["Το ποδαρικό φέρνει γούρι στο σπίτι.","The first-footing brings luck to the house.","g,f","το ποδαρικό (to poðarikó) = the year's lucky first visitor across the threshold."],
["Ποιος θα κάνει ποδαρικό φέτος;","Who'll do the first-footing this year?","g,f",null],
["Κρεμάμε ένα γούρι στην πόρτα για καλή χρονιά.","We hang a lucky charm on the door for a good year.","g,f","το γούρι (to ɣúri) = a lucky charm; κρεμάμε = we hang."],
["Δίνουμε ευχές και φιλιά τα μεσάνυχτα.","We exchange wishes and kisses at midnight.","g,f",null],
["Τα παιδιά λένε τα κάλαντα της Πρωτοχρονιάς.","The kids sing the New Year's carols.","g,f",null],
["Καλή χρονιά με υγεία και χαρά!","Happy new year with health and joy!","g,f",null],
["Το πρωτοχρονιάτικο τραπέζι κρατάει μέχρι αργά.","The New Year's dinner runs until late.","g,f",null],
["Πήραμε τηλέφωνο τους συγγενείς για ευχές.","We called the relatives to send wishes.","g,f",null],
["Σου εύχομαι ό,τι καλύτερο για τη νέα χρονιά.","I wish you all the best for the new year.","g,f","εύχομαι (efxome) = I wish — takes σου for 'to you'."],
// — Epiphany / Φώτα —
["Στις έξι Ιανουαρίου γιορτάζουμε τα Φώτα.","On January 6 we celebrate Epiphany.","g","τα Φώτα (ta Fóta) = Epiphany, the feast of the Blessing of the Waters."],
["Ο παπάς ρίχνει τον σταυρό στη θάλασσα.","The priest throws the cross into the sea.","g","At Epiphany the priest casts a cross into the water to bless it."],
["Οι νέοι βουτάνε να πιάσουν τον σταυρό.","The young men dive to catch the cross.","g","βουτάνε (vutáne) = they dive; whoever grabs the cross is blessed."],
["Όποιος πιάσει τον σταυρό έχει καλή χρονιά.","Whoever catches the cross has a good year.","g","πιάσει (piási) = catches — the perfective after όποιος."],
["Με τα Φώτα τελειώνουν οι γιορτές.","With Epiphany the holiday season ends.","g,f",null],
["Ο παπάς φέρνει αγιασμό στα σπίτια.","The priest brings holy water to the houses.","g","ο αγιασμός (o aɣiazmós) = the blessed holy water."],
// — Carnival / Απόκριες / Τσικνοπέμπτη —
["Οι Απόκριες κρατάνε τρεις εβδομάδες.","Carnival lasts three weeks.","g","Οι Απόκριες (i Apókries) = the three-week carnival before Lent."],
["Τα παιδιά φοράνε στολές τις Απόκριες.","The kids wear costumes during carnival.","g,f","οι στολές (i stolés) = the costumes."],
["Το καρναβάλι της Πάτρας είναι το πιο γνωστό.","The Patras carnival is the most famous.","g,t","Πάτρα hosts Greece's biggest and best-known carnival."],
["Την Τσικνοπέμπτη ψήνουμε κρέας σε όλη τη γειτονιά.","On Tsiknopempti we grill meat all over the neighborhood.","g,f","Η Τσικνοπέμπτη (i Tsiknopémpti) = 'Smoky Thursday', a day of grilled meat."],
["Όλη η πόλη μυρίζει τσίκνα την Τσικνοπέμπτη.","The whole city smells of grilled meat on Tsiknopempti.","g","η τσίκνα (i tsíkna) = the smell of meat on the grill."],
["Οι ταβέρνες γεμίζουν κόσμο την Τσικνοπέμπτη.","The tavernas fill with people on Tsiknopempti.","g,w",null],
["Καλή Τσικνοπέμπτη, καλό ψήσιμο!","Happy Tsiknopempti, happy grilling!","g","το ψήσιμο (to psísimo) = the grilling/roasting."],
["Πήγαμε σε αποκριάτικο πάρτι το Σάββατο.","We went to a carnival party on Saturday.","g","αποκριάτικο (apokriátiko) = carnival- (adjective from Απόκριες)."],
["Ρίξε σερπαντίνες και κομφετί στην παρέλαση.","Throw streamers and confetti at the parade.","g","η παρέλαση (i parélasi) = the parade."],
["Οι μεγάλοι διασκεδάζουν όσο και τα παιδιά.","The grown-ups have as much fun as the kids.","g,f","διασκεδάζω (ðiaskeðázo) = to have fun, to enjoy oneself."],
// — Clean Monday / Lent —
["Η Καθαρά Δευτέρα ανοίγει τη Σαρακοστή.","Clean Monday opens Lent.","g","Η Καθαρά Δευτέρα (i Kathará Ðeftéra) starts the 40 days of Σαρακοστή."],
["Την Καθαρά Δευτέρα πετάμε χαρταετό.","On Clean Monday we fly a kite.","g,f","ο χαρταετός (o xartaetós) = the kite — flown on Clean Monday."],
["Στο τραπέζι έχει λαγάνα και νηστίσιμα.","On the table there's lagana and fasting food.","g,f","η λαγάνα (i laɣána) = the flat unleavened bread of Clean Monday."],
["Τρώμε θαλασσινά και ελιές τη Σαρακοστή.","We eat seafood and olives during Lent.","g,f","Lenten fasting allows shellfish and olives but no meat or dairy."],
["Η γιαγιά νηστεύει όλη τη Σαρακοστή.","Grandma fasts all of Lent.","g,f","νηστεύω (nistévo) = to fast."],
["Πετούσαμε χαρταετό όλο το απόγευμα.","We were flying a kite all afternoon.","g,f,t","πετούσαμε (petúsame) = we were flying — imperfect for the long afternoon."],
["Η νηστεία κρατάει σαράντα μέρες.","The fast lasts forty days.","g","η νηστεία (i nistía) = the fast."],
// — closing wishes —
["Σε κάθε γιορτή, το τραπέζι είναι γεμάτο.","At every celebration, the table is full.","g,f",null],
["Οι γιορτές είναι για την οικογένεια και τους φίλους.","The holidays are for family and friends.","g,f",null],
["Καλό μήνα και καλές γιορτές!","Good month and happy holidays!","g,f","Καλό μήνα (kaló mína) = 'good month' — said on the first of each month."],
["Του χρόνου με υγεία, όλοι μαζί!","Next year in good health, all together!","g,f",null],
];

// keyword-based tag inference on target+english
const KW = {
  travel: ['παραλία','παραλί','νησί','πλοί','ξενοδοχ','εκδρομ','ταξίδ','ταξιδ','βουνό','βουνά','χωριό','χωριά','θάλασσ','άμμο','ξαπλώστρ','ομπρέλ','σημαδούρα','λιμάν','μελτέμι','πάτρα','beach','island','ferry','hotel','trip','mountain','village','sea','sand','sunbed','vacation','abroad','tourist','harbor','excursion','countryside'],
  work: ['γραφεί','δουλει','δουλεύ','δουλέψ','σχολεί','συνάδελ','αφεντικό','σύσκεψ','συνέδρι','ταβέρν','office','work','school','colleague','boss','meeting','commute','conference','from home','on duty','forecast','weekend'],
  family: ['μαμά','μπαμπά','γιαγιά','παππού','παππ','παιδι','παιδί','οικογέν','αδερφ','αδελφ','θεί','συγγεν','εγγόν','μωρό','μητέρα','πατέρα','κόρη','γιος','mom','dad','grandma','grandpa','grandchild','kid','child','family','brother','sister','uncle','aunt','relative','baby','santa','άι-βασίλη'],
};
// extra work-context ids (weather that bears on the working day) — deterministic top-up
const WORK_EXTRA = new Set([1551,1552,1560,1563,1567,1573,1577,1596,1598,1601,1602,1611,1650,1660,1668,1671,1691,1785,1786,1799]);
const HAND = {t:'travel',w:'work',f:'family'};
function inferTags(hand) {
  const set = new Set(['general']);
  for (const code of hand.split(',')) if (HAND[code]) set.add(HAND[code]);
  return [...set];   // honest hand tags; fill()/trim() balance the aggregate below
}
let _vocab = 0;
// tip policy: keep rule/usage/cultural tips, drop bare vocab glosses -> ~40%
const RULE = /aorist|imperfect|imperfective|future|perfective|present|command|imperative|one-off|habit| μη | μην |μη \+|να \+|θα |accent|genitive|than |clitic|subjunctive|wish|reply|we say|literally|brings|counts more|door stays|first slice|uncracked|whole year|whole family|argues|per month|per night|instead|because of|not the|never |the finder|no meat|mourning|catch|opens Lent|starts the|door to door|older Greek|two Christmas|three-week|Smoky|blessed|casts|blood of|permitting|whoever|weeks apart/i;
function keepTip(tip) {
  if (!tip) return false;
  if (!tip.includes('=')) return true;          // observational / cultural note
  if (RULE.test(tip)) return true;               // rule-bearing gloss
  return (_vocab++ % 2) === 0;                    // keep every other bare vocab gloss
}

function build(list, startId, node) {
  return list.map((c, i) => {
    const n = startId + i;
    const card = { id:`el-${n}`, target:c[0], english:c[1], audio:`el-el-${n}.mp3`, tags: inferTags(c[2]), grammarNode:node, priority:n };
    if (c[3] && keepTip(c[3])) card.grammar = c[3];
    return card;
  });
}

const cards = [...build(N15, 1551, 'node-15'), ...build(N16, 1676, 'node-16')];

// ── tag rebalance to ~25-30% each (honest, eligibility-gated) ──
// honest signal gates: a card is eligible for a tag only if it carries a real
// context signal for that tag (the sibling-C bar: plausible at work / on a trip).
// weather smalltalk is work-plausible (watercooler talk), like tech-at-work in slice C —
// but NOT directives to a person ("put on", "take", "go") or pure beach/vacation lines.
const SIG = {
  work: /office|air condition|conditioner|the fan|forecast|schools|ferries|flood|on the bus|bus stop|on the way|caught us|from home|heatwave|all week|this afternoon|since this morning|weekend|meeting|colleague|at work|tavernas|good month|temperature|degrees|it's very hot|the heat|unsettled|humid|a storm|the storm|it'll rain|it rained|midday|it's cold|the cold|the morning fog|it snowed|it's snowing|north wind|biting|winter is harsh|κλιματιστικ|ανεμιστήρ|σχολεί|πλοία|πλημμύρ|λεωφορ|στάση|δελτίο|καύσων|εβδομάδα|ταβέρν|καλό μήνα/i,
  travel: /beach|sea |the sea|island|mountain|village|trip|excursion|hotel|sunbed|sunscreen|towel|sand|buoy|meltemi|countryside|vacation|swim|carnival|patras|boat|sunset|climate|in greece|ferries|the coast|season|summer|winter here|autumn|spring/i,
  family: /kid|child|grandma|grandpa|\bmom\b|\bdad\b|family|our fireplace|we're all|jacket|relative|santa|carol|name day|we celebrate|we all|together|home/i,
};
// directives to a person / pure leisure are NOT work watercooler-talk
const NOT_WORK = /put on|take a|take an|take your|grab|let's go|go into|go out|swim|for a walk|for the mountain|drop by/i;
// beach/vacation leisure & pure scenic admiration are not workplace smalltalk
const BEACH = /beach|sunbed|sunscreen|the towel|buoy|we rented|vacation|the water is|ice cream|coffee outside/i;
const ADMIRE = /magical|gorgeous|lovely|wonderful|deep blue|sunshine|nicest|beautiful|smells wonderful|its own beauty/i;
const INSTITUTIONAL = /priest|the cross|epiphany|catholic|\bpatras\b|the town|the square|municipal|parade|the city smells/i;
function eligible(card, tag) {
  const hay = (card.target + ' ' + card.english).toLowerCase();
  if (tag === 'family' && card.grammarNode === 'node-16') return !INSTITUTIONAL.test(hay);
  if (tag === 'work') {
    if (NOT_WORK.test(hay) || BEACH.test(hay) || ADMIRE.test(hay)) return false;
    // node-15 weather smalltalk is workplace-plausible domain-wide (slice-C norm);
    // node-16 only genuine workplace lines qualify
    return card.grammarNode === 'node-15' ? true : SIG.work.test(hay);
  }
  return SIG[tag].test(hay);
}
function fill(tag, target) {
  let have = cards.filter(c => c.tags.includes(tag)).length;
  for (const c of cards) {
    if (have >= target) break;
    if (!c.tags.includes(tag) && eligible(c, tag)) { c.tags.push(tag); have++; }
  }
}
function trim(tag, target) {
  let have = cards.filter(c => c.tags.includes(tag)).length;
  // remove from the least-central first: node-15 incidental, then node-16 institutional
  const order = [...cards].sort((a,b) => {
    const rank = c => (c.grammarNode==='node-15'?0:1) + (eligible(c,tag)?1:0);
    return rank(a) - rank(b);
  });
  for (const c of order) {
    if (have <= target) break;
    const canDrop = c.tags.length > 2 || c.grammarNode === 'node-15';
    if (c.tags.includes(tag) && canDrop) { c.tags = c.tags.filter(t => t !== tag); have--; }
  }
}
fill('work', 63); fill('travel', 68); trim('family', 90);

const tc = {}; let tips=0;
for (const c of cards) { for (const t of c.tags) tc[t]=(tc[t]||0)+1; if(c.grammar)tips++; }
console.log('N15:', N15.length, 'N16:', N16.length, 'total:', cards.length);
console.log('tips:', tips, `(${(tips*100/cards.length).toFixed(0)}%)`, 'tags:', JSON.stringify(Object.fromEntries(Object.entries(tc).map(([k,v])=>[k,v+' '+(v*100/250).toFixed(0)+'%']))));
fs.writeFileSync(__dirname + '/wave3-el-cards-B.json', JSON.stringify(cards, null, 1));
