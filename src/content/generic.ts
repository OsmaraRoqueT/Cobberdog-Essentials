import type { ContentPack } from './types';

/** Breed- and country-neutral puppy content. */
export const generic: ContentPack = {
  shopping: [
    {
      category: { en: 'Home & sleep', nb: 'Hjem og søvn' },
      items: [
        {
          name: { en: 'Crate (sized for adult, with divider)', nb: 'Bur (voksen størrelse, med skillevegg)' },
          priority: 'essential',
          tip: {
            en: 'Buy for adult size and use the divider so the puppy only has room to sleep and turn around. That helps toilet training.',
            nb: 'Kjøp for voksen størrelse og bruk skilleveggen, slik at valpen bare har plass til å ligge og snu seg. Det hjelper med renslighetstreningen.',
          },
        },
        {
          name: { en: 'Washable crate bed / vetbed', nb: 'Vaskbar seng / vetbed' },
          priority: 'essential',
          tip: { en: 'Have two so one can be in the wash.', nb: 'Ha to, så én kan være til vask.' },
        },
        {
          name: { en: 'Crate cover or light blanket', nb: 'Trekk eller lett pledd over buret' },
          priority: 'recommended',
          tip: { en: 'A cosy den helps settling. Leave the front partly open for airflow.', nb: 'En lun hule hjelper valpen å roe seg. La fronten være delvis åpen for luft.' },
        },
        {
          name: { en: 'Playpen / puppy pen', nb: 'Valpegrind / lekegrind' },
          priority: 'recommended',
          tip: { en: 'A safe zone for when you cannot supervise.', nb: 'En trygg sone når du ikke kan følge med.' },
        },
        {
          name: { en: 'Baby gates', nb: 'Trappegrind' },
          priority: 'recommended',
          tip: { en: 'Block stairs and rooms you are not ready to puppy-proof.', nb: 'Steng trapper og rom som ikke er valpesikret.' },
        },
        {
          name: { en: 'Comfort toy with litter scent', nb: 'Kosebamse med lukt fra kullet' },
          priority: 'nice',
          tip: {
            en: 'Ask the breeder to rub a soft toy or blanket with mum & littermates before pickup.',
            nb: 'Be oppdretteren gni en bamse eller et teppe mot mor og søsken før henting.',
          },
        },
      ],
    },
    {
      category: { en: 'Feeding', nb: 'Fôring' },
      items: [
        {
          name: { en: 'Same puppy food the breeder uses', nb: 'Samme valpefôr som oppdretteren bruker' },
          priority: 'essential',
          tip: {
            en: 'Keep the breeder’s food for at least the first 2 weeks; switch gradually over 7–10 days if you change.',
            nb: 'Behold oppdretterens fôr minst de første 2 ukene. Bytt gradvis over 7–10 dager hvis du skal bytte.',
          },
        },
        { name: { en: 'Stainless steel food & water bowls', nb: 'Mat- og vannskåler i rustfritt stål' }, priority: 'essential' },
        {
          name: { en: 'Slow-feeder or lick mat', nb: 'Slow feeder eller slikkematte' },
          priority: 'recommended',
          tip: { en: 'Slows fast eaters and doubles as calming enrichment.', nb: 'Bremser grådige spisere og fungerer som beroligende aktivisering.' },
        },
        {
          name: { en: 'Training treats (tiny, soft)', nb: 'Godbiter (små og myke)' },
          priority: 'essential',
          tip: { en: 'Pea-sized and soft, so you can do lots of repetitions.', nb: 'Ertestore og myke, så du kan gjøre mange repetisjoner.' },
        },
        { name: { en: 'Airtight food container', nb: 'Lufttett fôrboks' }, priority: 'nice' },
      ],
    },
    {
      category: { en: 'Walking & ID', nb: 'Tur og ID' },
      items: [
        {
          name: { en: 'Collar with ID tag', nb: 'Halsbånd med ID-merke' },
          priority: 'essential',
          tip: { en: 'Put your phone number on the tag.', nb: 'Sett telefonnummeret ditt på merket.' },
        },
        {
          name: { en: 'Y-shaped puppy harness', nb: 'Y-formet valpesele' },
          priority: 'essential',
          tip: {
            en: 'Y-front harnesses do not restrict shoulder movement. Re-check fit every week or two as the puppy grows.',
            nb: 'Y-seler hindrer ikke skulderbevegelsen. Sjekk passformen hver eller annenhver uke mens valpen vokser.',
          },
        },
        { name: { en: 'Lightweight 1.5–2m lead', nb: 'Lett bånd, 1,5–2 m' }, priority: 'essential' },
        {
          name: { en: 'Long line (5–10m)', nb: 'Langline (5–10 m)' },
          priority: 'recommended',
          tip: { en: 'For safe recall practice in open spaces.', nb: 'For trygg innkallingstrening på åpne områder.' },
        },
        { name: { en: 'Treat pouch', nb: 'Godbitpose' }, priority: 'recommended' },
        { name: { en: 'Poo bags + dispenser', nb: 'Bæsjeposer + holder' }, priority: 'essential' },
      ],
    },
    {
      category: { en: 'Grooming', nb: 'Pelsstell' },
      items: [
        { name: { en: 'Brush suited to the coat type', nb: 'Børste tilpasset pelstypen' }, priority: 'essential' },
        { name: { en: 'Gentle puppy shampoo', nb: 'Mild valpesjampo' }, priority: 'recommended' },
        {
          name: { en: 'Nail clippers or grinder', nb: 'Klotang eller klofil' },
          priority: 'recommended',
          tip: { en: 'Handle paws daily from day one, before the puppy needs a trim.', nb: 'Håndter potene daglig fra første dag, før valpen trenger klipp.' },
        },
        {
          name: { en: 'Puppy toothbrush & dog toothpaste', nb: 'Valpetannbørste og hundetannkrem' },
          priority: 'nice',
          tip: { en: 'Never use human toothpaste.', nb: 'Bruk aldri tannkrem for mennesker.' },
        },
      ],
    },
    {
      category: { en: 'Toilet training', nb: 'Renslighet' },
      items: [
        {
          name: { en: 'Enzymatic cleaner', nb: 'Enzymrens' },
          priority: 'essential',
          tip: {
            en: 'Breaks down odour so the puppy is not drawn back to the same spot. Avoid ammonia-based cleaners.',
            nb: 'Bryter ned lukt så valpen ikke trekkes tilbake til samme sted. Unngå ammoniakkbaserte midler.',
          },
        },
        { name: { en: 'Paper towels / old towels', nb: 'Tørkepapir / gamle håndklær' }, priority: 'essential' },
        { name: { en: 'Puppy pads (optional)', nb: 'Valpeunderlag (valgfritt)' }, priority: 'nice' },
      ],
    },
    {
      category: { en: 'Toys & enrichment', nb: 'Leker og aktivisering' },
      items: [
        {
          name: { en: 'Rubber chew toy (stuffable)', nb: 'Gummileke som kan fylles (f.eks. Kong)' },
          priority: 'essential',
          tip: { en: 'Stuff and freeze it for teething relief and settling.', nb: 'Fyll og frys den: lindrer tannfelling og hjelper valpen å roe seg.' },
        },
        {
          name: { en: 'Teething chews (age-appropriate)', nb: 'Tyggeben for valper' },
          priority: 'recommended',
          tip: { en: 'Avoid cooked bones and very hard chews that can crack teeth.', nb: 'Unngå kokte bein og svært harde tyggeben som kan knekke tenner.' },
        },
        { name: { en: 'Snuffle mat', nb: 'Snusematte' }, priority: 'recommended' },
        { name: { en: 'Tug toy', nb: 'Dragleke' }, priority: 'nice' },
        { name: { en: 'Soft plush toy', nb: 'Myk kosebamse' }, priority: 'nice' },
      ],
    },
    {
      category: { en: 'Travel', nb: 'Reise' },
      items: [
        {
          name: { en: 'Car crate or crash-tested harness', nb: 'Bilbur eller kollisjonstestet bilsele' },
          priority: 'essential',
          tip: { en: 'Needed for the drive home from the breeder.', nb: 'Trengs til kjøreturen hjem fra oppdretteren.' },
        },
        {
          name: { en: 'Old towels & spare bags for the trip home', nb: 'Gamle håndklær og ekstra poser til hjemturen' },
          priority: 'recommended',
          tip: { en: 'Car sickness is common on the first trip.', nb: 'Bilsyke er vanlig på første tur.' },
        },
      ],
    },
    {
      category: { en: 'Health & admin', nb: 'Helse og papirer' },
      items: [
        {
          name: { en: 'Book first vet check (within 72h of pickup)', nb: 'Bestill første veterinærsjekk (innen 72 t etter henting)' },
          priority: 'essential',
          tip: {
            en: 'Many breeder health guarantees require a vet check within a few days.',
            nb: 'Mange oppdretteres helsegarantier krever veterinærsjekk innen få dager.',
          },
        },
        {
          name: { en: 'Pet insurance (start before pickup)', nb: 'Dyreforsikring (fra hentedagen)' },
          priority: 'essential',
          tip: {
            en: 'Policies often have waiting periods for illness. Compare excess, annual limit and hereditary-condition cover.',
            nb: 'Forsikringer har ofte karenstid for sykdom. Sammenlign egenandel, årlig maksbeløp og dekning av arvelige lidelser.',
          },
        },
        { name: { en: 'Vaccination record from breeder', nb: 'Vaksinasjonskort fra oppdretter' }, priority: 'essential' },
        {
          name: { en: 'Flea, tick & worming plan (from vet)', nb: 'Plan for flått, lopper og ormekur (fra veterinær)' },
          priority: 'essential',
        },
      ],
    },
  ],

  notes: [
    {
      title: { en: 'Questions to ask the breeder before pickup', nb: 'Spørsmål til oppdretteren før henting' },
      category: 'breeder',
      pinned: true,
      body: {
        en: `• Which health tests were done on the parents? Ask for certificates.
• Vaccination & worming done so far, and the due dates for the next ones.
• Microchip number and how to transfer the registration.
• Current food brand, amount and feeding times.
• Daily routine: sleep, toilet habits, what the puppy has already been exposed to.
• Health guarantee terms, including whether it requires a vet check within a set number of days.
• Can you take home a blanket or toy that smells of mum and the littermates?`,
        nb: `• Hvilke helsetester er tatt på foreldrene? Be om attester.
• Vaksiner og ormekur så langt, og når neste skal tas.
• ID-chipnummer og hvordan eierskiftet registreres.
• Nåværende fôr: merke, mengde og fôringstider.
• Døgnrytme: søvn, dovaner, hva valpen allerede har opplevd.
• Vilkår for helsegaranti, blant annet om den krever veterinærsjekk innen et visst antall dager.
• Kan dere få med et teppe eller en leke som lukter mor og søsken?`,
      },
    },
    {
      title: { en: 'Choosing a vet: what to compare', nb: 'Velge veterinær: hva du bør sammenligne' },
      category: 'vet',
      body: {
        en: `Use “+ Option” for each clinic you look at, then mark one as Chosen.
• Distance and opening hours. Where is the nearest 24/7 emergency clinic?
• Puppy packages (vaccinations + checks bundled) and their price
• Fear-free / low-stress handling approach
• Payment options and direct insurance settlement
• What reviews say about communication, not just friendliness`,
        nb: `Bruk «+ Alternativ» for hver klinikk du ser på, og merk én som Valgt.
• Avstand og åpningstider. Hvor er nærmeste døgnåpne dyreklinikk?
• Valpepakker (vaksiner og kontroller samlet) og pris
• Rolig og skånsom håndtering (fear free)
• Betalingsmuligheter og direkte oppgjør med forsikringen
• Hva anmeldelser sier om kommunikasjon, ikke bare vennlighet`,
      },
    },
    {
      title: { en: 'Choosing a puppy training course: what to compare', nb: 'Velge valpekurs: hva du bør sammenligne' },
      category: 'course',
      body: {
        en: `Use “+ Option” for each course, then mark one as Chosen.
• Methods: look for reward-based / positive reinforcement. Avoid prong, choke or shock tools.
• Trainer qualifications and certification
• Class size, and whether puppy play is supervised and matched by size and confidence
• Start age and vaccination requirements
• Curriculum: socialisation, handling, recall, loose-lead walking, settle/calm
• Price, number of sessions, make-up classes`,
        nb: `Bruk «+ Alternativ» for hvert kurs, og merk ett som Valgt.
• Metoder: se etter belønningsbasert trening. Unngå strupehalsbånd, pigghalsbånd og strøm.
• Instruktørens utdanning og sertifisering
• Gruppestørrelse, og om valpelek styres og tilpasses størrelse og trygghet
• Alder ved oppstart og krav til vaksiner
• Innhold: miljøtrening, håndtering, innkalling, gå pent i bånd, ro
• Pris, antall ganger, mulighet for å ta igjen timer`,
      },
    },
    {
      title: { en: 'Feeding basics', nb: 'Fôring: det grunnleggende' },
      category: 'food',
      body: {
        en: `• Puppies usually eat 3–4 small meals a day until around 4–6 months, then 2.
• Keep the breeder’s food at first. Switch gradually (25% → 50% → 75% → 100% over 7–10 days).
• Count training treats in the daily allowance.
• Fresh water always available. Lift it 1–2 hours before bedtime during toilet training.
• Toxic foods: chocolate, grapes/raisins, onion, garlic, xylitol (sugar-free gum), macadamias, cooked bones.`,
        nb: `• Valper spiser vanligvis 3–4 små måltider om dagen til 4–6 måneders alder, deretter 2.
• Behold oppdretterens fôr i starten. Bytt gradvis (25 % → 50 % → 75 % → 100 % over 7–10 dager).
• Regn med godbiter i dagsrasjonen.
• Friskt vann alltid tilgjengelig. Fjern det 1–2 timer før leggetid mens dere trener renslighet.
• Giftig: sjokolade, druer/rosiner, løk, hvitløk, xylitol (sukkerfri tyggegummi), macadamianøtter, kokte bein.`,
      },
    },
    {
      title: { en: 'Pet insurance: comparison checklist', nb: 'Dyreforsikring: sjekkliste for sammenligning' },
      category: 'insurance',
      body: {
        en: `• Waiting periods (accident vs illness), so start cover before or on pickup day
• Annual limit and sub-limits
• Excess and reimbursement %
• Hereditary & congenital conditions covered? (hips, elbows, eyes)
• Dental and behavioural cover
• How the premium rises with age`,
        nb: `• Karenstid (ulykke og sykdom), så start forsikringen senest på hentedagen
• Årlig maksbeløp og eventuelle delgrenser
• Egenandel og prosentvis egenandel
• Dekkes arvelige og medfødte lidelser? (hofter, albuer, øyne)
• Dekning av tannbehandling og atferd
• Hvordan premien øker med alderen`,
      },
    },
    {
      title: { en: 'First 48 hours at home', nb: 'De første 48 timene hjemme' },
      category: 'tips',
      pinned: true,
      body: {
        en: `• Keep it calm and quiet. Visitors can wait a few days.
• Take the puppy outside to the same toilet spot on waking, after eating, after play and every 1–2 hours. Reward immediately.
• Crate near your bed for the first nights. Respond to night toilet needs calmly and boringly.
• Start name recognition and handling (paws, ears, mouth) with treats.
• Short alone-time moments from day one (you in the next room) to prevent separation anxiety.`,
        nb: `• Hold det rolig. Besøk kan vente noen dager.
• Ta valpen ut til samme do-plass når den våkner, etter mat, etter lek og hver 1–2 time. Belønn med en gang.
• Ha buret ved sengen de første nettene. Møt dobehov om natten rolig og kjedelig.
• Start med navnetrening og håndtering (poter, ører, munn) med godbiter.
• Korte øyeblikk alene fra første dag (du i rommet ved siden av) forebygger separasjonsangst.`,
      },
    },
  ],

  skills: [
    {
      group: { en: 'Foundations', nb: 'Grunnmur' },
      items: [
        {
          name: { en: 'Name recognition', nb: 'Navnet sitt' },
          howTo: {
            en: 'Say the name once and mark + treat when the puppy looks at you. Never use the name for something unpleasant.',
            nb: 'Si navnet én gang, marker og belønn når valpen ser på deg. Bruk aldri navnet før noe ubehagelig.',
          },
        },
        {
          name: { en: 'Marker word ("yes!")', nb: 'Markørord («ja!»)' },
          howTo: {
            en: 'Say "yes" then give a treat, repeated 10–20 times. The word now predicts reward.',
            nb: 'Si «ja» og gi en godbit, 10–20 ganger. Ordet betyr nå at belønning kommer.',
          },
        },
        {
          name: { en: 'Toilet training', nb: 'Renslighet' },
          howTo: {
            en: 'Take the puppy out on waking, after meals and play, and every 1–2h. Reward the moment it finishes outside.',
            nb: 'Ta valpen ut når den våkner, etter mat og lek, og hver 1–2 time. Belønn i det den er ferdig ute.',
          },
        },
        {
          name: { en: 'Crate comfort', nb: 'Trives i buret' },
          howTo: {
            en: 'Feed meals in the crate, give stuffed chews there, and build up door-closed time slowly.',
            nb: 'Gi måltider og fylte tyggeleker i buret, og øk tiden med lukket dør gradvis.',
          },
        },
        {
          name: { en: 'Handling & grooming tolerance', nb: 'Håndtering og pelsstell' },
          howTo: {
            en: 'Touch ears, paws, mouth and tail briefly, then treat. Add the brush and nail clippers gradually.',
            nb: 'Rør kort ved ører, poter, munn og hale, og belønn. Introduser børste og klotang gradvis.',
          },
        },
        {
          name: { en: 'Alone-time training', nb: 'Være alene' },
          howTo: {
            en: 'Start with seconds out of sight and build up slowly. Leave and return calmly.',
            nb: 'Start med sekunder utenfor synsfeltet og bygg sakte opp. Gå og kom rolig.',
          },
        },
      ],
    },
    {
      group: { en: 'Basic cues', nb: 'Grunnleggende kommandoer' },
      items: [
        {
          name: { en: 'Sit', nb: 'Sitt' },
          howTo: {
            en: 'Lure a treat up and back over the nose; mark when the bottom touches the floor. Fade the lure after a few sessions.',
            nb: 'Lokk med en godbit opp og bakover over nesen. Marker når baken treffer gulvet. Fas ut lokkingen etter noen økter.',
          },
        },
        {
          name: { en: 'Down', nb: 'Dekk' },
          howTo: {
            en: 'Lure from the nose straight to the floor between the paws. Mark when the elbows touch the floor.',
            nb: 'Lokk fra nesen rett ned til gulvet mellom potene. Marker når albuene treffer gulvet.',
          },
        },
        {
          name: { en: 'Come (recall)', nb: 'Innkalling' },
          howTo: {
            en: 'Use a happy voice, run away and reward big. Never call the puppy for something unpleasant. Practise on a long line.',
            nb: 'Bruk glad stemme, løp fra valpen og belønn stort. Kall aldri inn til noe ubehagelig. Øv i langline.',
          },
        },
        {
          name: { en: 'Leave it', nb: 'La være' },
          howTo: {
            en: 'Hide a treat in your closed fist and mark the moment the puppy backs off. Reward from the other hand.',
            nb: 'Hold en godbit i lukket hånd og marker idet valpen trekker seg unna. Belønn fra den andre hånden.',
          },
        },
        {
          name: { en: 'Drop it / trade', nb: 'Slipp / bytte' },
          howTo: {
            en: 'Swap a toy for a treat, then give the toy back. That teaches that giving up a toy pays.',
            nb: 'Bytt leken mot en godbit, og gi leken tilbake. Valpen lærer at det lønner seg å gi slipp.',
          },
        },
        {
          name: { en: 'Wait / stay', nb: 'Vent / bli' },
          howTo: {
            en: 'Build duration first, then distance, then distraction, one at a time.',
            nb: 'Bygg varighet først, så avstand, så forstyrrelser, én ting om gangen.',
          },
        },
      ],
    },
    {
      group: { en: 'Life skills', nb: 'Hverdagsferdigheter' },
      items: [
        {
          name: { en: 'Loose-lead walking', nb: 'Gå pent i bånd' },
          howTo: {
            en: 'Reward the puppy for being by your side. Stop when the lead goes tight and start again when it is slack.',
            nb: 'Belønn valpen for å gå ved siden av deg. Stopp når båndet strammes, og gå videre når det er slakt.',
          },
        },
        {
          name: { en: 'Settle on a mat', nb: 'Ro på matte' },
          howTo: {
            en: 'Reward calm lying down on a mat. Builds an "off switch" for cafés and visitors.',
            nb: 'Belønn rolig liggende på en matte. Gir en «av-knapp» på kafé og når det kommer besøk.',
          },
        },
        {
          name: { en: 'Polite greetings (four on the floor)', nb: 'Rolige hilsener (fire poter i gulvet)' },
          howTo: {
            en: 'Greet the puppy only when all four paws are on the floor. Ask visitors to do the same.',
            nb: 'Hils bare på valpen når alle fire potene er i gulvet. Be gjester gjøre det samme.',
          },
        },
        {
          name: { en: 'Car travel', nb: 'Biltur' },
          howTo: {
            en: 'Short, positive trips that end somewhere fun, not just at the vet.',
            nb: 'Korte, positive turer som ender et hyggelig sted, ikke bare hos veterinæren.',
          },
        },
      ],
    },
  ],

  social: [
    {
      group: { en: 'People', nb: 'Mennesker' },
      items: [
        { en: 'Men with beards/hats', nb: 'Menn med skjegg/lue' },
        { en: 'Children (supervised)', nb: 'Barn (under tilsyn)' },
        { en: 'Elderly people / walking aids', nb: 'Eldre / rullator og krykker' },
        { en: 'People in uniforms / hi-vis', nb: 'Folk i uniform / refleksvest' },
        { en: 'People wearing sunglasses or helmets', nb: 'Folk med solbriller eller hjelm' },
      ],
    },
    {
      group: { en: 'Animals', nb: 'Dyr' },
      items: [
        { en: 'Calm vaccinated adult dog', nb: 'Rolig, vaksinert voksen hund' },
        { en: 'Cats', nb: 'Katter' },
        { en: 'Other puppies (in class)', nb: 'Andre valper (på kurs)' },
        { en: 'Birds / farm animals', nb: 'Fugler / gårdsdyr' },
      ],
    },
    {
      group: { en: 'Sounds', nb: 'Lyder' },
      items: [
        { en: 'Vacuum cleaner', nb: 'Støvsuger' },
        { en: 'Doorbell & knocking', nb: 'Dørklokke og banking' },
        { en: 'Traffic & trucks', nb: 'Trafikk og lastebiler' },
        { en: 'Thunder / fireworks (recordings, low volume)', nb: 'Torden / fyrverkeri (opptak, lavt volum)' },
        { en: 'Hair dryer / clippers', nb: 'Hårføner / klippemaskin' },
      ],
    },
    {
      group: { en: 'Surfaces', nb: 'Underlag' },
      items: [
        { en: 'Grass', nb: 'Gress' },
        { en: 'Gravel', nb: 'Grus' },
        { en: 'Tiles / slippery floors', nb: 'Fliser / glatte gulv' },
        { en: 'Metal grates', nb: 'Metallrister' },
        { en: 'Stairs', nb: 'Trapper' },
        { en: 'Wobbly surfaces', nb: 'Ustødig underlag' },
      ],
    },
    {
      group: { en: 'Places', nb: 'Steder' },
      items: [
        { en: 'Car rides', nb: 'Bilturer' },
        { en: 'Café (carried / on mat)', nb: 'Kafé (båret / på matte)' },
        { en: 'Vet happy visit (treats only)', nb: 'Hyggebesøk hos veterinær (bare godbiter)' },
        { en: 'Groomer happy visit', nb: 'Hyggebesøk hos groomer' },
        { en: 'Busy street (from a distance)', nb: 'Travel gate (på avstand)' },
      ],
    },
    {
      group: { en: 'Handling', nb: 'Håndtering' },
      items: [
        { en: 'Ears checked', nb: 'Ørene sjekket' },
        { en: 'Paws & nails touched', nb: 'Poter og klør tatt på' },
        { en: 'Mouth/teeth looked at', nb: 'Munn/tenner sett på' },
        { en: 'Brushed & combed', nb: 'Børstet og gredd' },
        { en: 'Towel dried', nb: 'Tørket med håndkle' },
        { en: 'Wearing harness', nb: 'Har på sele' },
      ],
    },
  ],
};
