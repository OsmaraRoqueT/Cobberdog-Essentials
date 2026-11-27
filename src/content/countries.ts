import type { L } from '../i18n';
import type { HealthSuggestion } from './suggest-types';
import type { ContentPack } from './types';

/**
 * Country packs: currency, local admin items, a rules note and seasonal reminders.
 * Rules change — each note tells the owner where to verify. Keep claims general and sourced to the authority.
 */
export interface Country {
  code: string; // ISO 3166-1 alpha-2, or 'XX' for "other"
  currency: string;
  pack?: ContentPack;
  health?: HealthSuggestion[];
}

const admin = (items: ContentPack['shopping']): ContentPack['shopping'] => items;
const adminCat: L = { en: 'Health & admin', nb: 'Helse og papirer' };

const tickSeason = (date: string): HealthSuggestion => ({
  key: 'tick-season',
  kind: 'parasite',
  title: { en: 'Tick season starts: check tick protection with your vet', nb: 'Flåttsesongen starter: avklar flåttbeskyttelse med veterinæren' },
  when: { yearly: date },
  repeat: '1y',
});

const NO: Country = {
  code: 'NO',
  currency: 'NOK',
  pack: {
    options: [
      { provider: "Agria Dyreforsikring", category: 'insurance', link: 'https://www.agria.no' },
      { provider: "Gjensidige", category: 'insurance', link: 'https://www.gjensidige.no' },
      { provider: "If", category: 'insurance', link: 'https://www.if.no' },
      { provider: "Tryg", category: 'insurance', link: 'https://www.tryg.no' },
      { provider: "Fremtind (SpareBank 1 / DNB)", category: 'insurance', link: 'https://www.fremtind.no' },
      { provider: "Frende", category: 'insurance', link: 'https://www.frende.no' },
      { provider: "Storebrand", category: 'insurance', link: 'https://www.storebrand.no' },
    ],
    insuranceNote: { title: { en: "Norway: independent comparisons", nb: "Norge: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Norsk Familieøkonomi rates dog insurance every year (shown on sites such as forsikringsduden.no and dyreguiden.no). Forbrukerrådet’s finansportalen.no compares insurance prices. In Norway, check whether your chosen vet offers direct settlement (direkte oppgjør) with the insurer, so you pay only the excess at the clinic.", nb: "Norsk Familieøkonomi vurderer hundeforsikringer hvert år (vises bl.a. på forsikringsduden.no og dyreguiden.no). Forbrukerrådets finansportalen.no sammenligner forsikringspriser. Sjekk om veterinæren du velger har direkte oppgjør med forsikringsselskapet, så du bare betaler egenandelen på klinikken." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Transfer ownership in Dyreidentitet', nb: 'Registrer eierskifte i Dyreidentitet' },
            priority: 'essential',
            tip: {
              en: 'Microchip (ID-marking) details are registered in Dyreidentitet (dyreidentitet.no). Make sure the puppy is registered to you after pickup.',
              nb: 'ID-merkingen registreres i Dyreidentitet (dyreidentitet.no). Sørg for at valpen står registrert på deg etter henting.',
            },
          },
          {
            name: { en: 'Insurance: vet cover + life cover', nb: 'Forsikring: veterinærutgifter + liv' },
            priority: 'essential',
            tip: {
              en: 'Norwegian dog insurance is often split into vet-expense cover and life cover. Compare both, and check cover for hereditary conditions.',
              nb: 'Hundeforsikring i Norge er ofte delt i veterinærutgifter og livsforsikring. Sammenlign begge, og sjekk dekning av arvelige lidelser.',
            },
          },
        ],
      },
    ]),
    notes: [
      {
        title: { en: 'Norway: rules & practical info', nb: 'Norge: regler og praktisk info' },
        category: 'admin',
        pinned: true,
        body: {
          en: `• Leash period (båndtvang): nationally from 1 April to 20 August under the Dog Act (hundeloven). Your municipality may have extra or longer rules, so check its website.
• ID-marking: the microchip is registered in Dyreidentitet (dyreidentitet.no). Keep owner details up to date.
• Vaccines: the core puppy vaccine covers distemper (valpesyke), parvovirus and infectious hepatitis (HCC). It's given as a puppy series, boosted at about 1 year, then usually every 3 years. Kennel cough is often given yearly. Your vet decides the exact schedule.
• Ticks: tick season runs roughly from spring to late autumn, especially along the coast in southern Norway. Ask your vet about protection.
• Travel abroad: rabies vaccination and a pet passport are needed, plus rules on tapeworm treatment when bringing the dog back into Norway. Check mattilsynet.no well before travelling.`,
          nb: `• Båndtvang: nasjonalt fra 1. april til 20. august etter hundeloven. Kommunen kan ha egne eller lengre regler, så sjekk kommunens nettside.
• ID-merking: chipen registreres i Dyreidentitet (dyreidentitet.no). Hold eieropplysningene oppdatert.
• Vaksiner: kjernevaksinen beskytter mot valpesyke, parvovirus og smittsom leverbetennelse (HCC). Den gis som valpeserie, med oppfriskning ved ca. 1 år og deretter vanligvis hvert 3. år. Kennelhoste gis ofte årlig. Veterinæren avgjør nøyaktig plan.
• Flått: sesongen varer omtrent fra vår til sen høst, særlig langs kysten i Sør-Norge. Spør veterinæren om beskyttelse.
• Reise til utlandet: rabiesvaksine og dyrepass kreves, og det er regler for bendelormbehandling når hunden tas med tilbake til Norge. Sjekk mattilsynet.no i god tid før reisen.`,
        },
      },
    ],
  },
  health: [
    tickSeason('03-01'),
    {
      key: 'leash-start',
      kind: 'other',
      title: { en: 'Leash period (båndtvang) starts today', nb: 'Båndtvangen starter i dag' },
      when: { yearly: '04-01' },
      repeat: '1y',
      notes: { en: 'National rule until 20 August. Check local rules too.', nb: 'Nasjonal regel til og med 20. august. Sjekk også lokale regler.' },
    },
    {
      key: 'leash-end',
      kind: 'other',
      title: { en: 'Leash period (båndtvang) ends: check local rules', nb: 'Båndtvangen slutter: sjekk lokale regler' },
      when: { yearly: '08-21' },
      repeat: '1y',
    },
  ],
};

const SE: Country = {
  code: 'SE',
  currency: 'SEK',
  pack: {
    options: [
      { provider: "Agria", category: 'insurance', link: 'https://www.agria.se' },
      { provider: "Folksam", category: 'insurance', link: 'https://www.folksam.se' },
      { provider: "If", category: 'insurance', link: 'https://www.if.se' },
      { provider: "Trygg-Hansa", category: 'insurance', link: 'https://www.trygghansa.se' },
      { provider: "Länsförsäkringar", category: 'insurance', link: 'https://www.lansforsakringar.se' },
      { provider: "Sveland", category: 'insurance', link: 'https://www.sveland.se' },
      { provider: "Svedea", category: 'insurance', link: 'https://www.svedea.se' },
    ],
    insuranceNote: { title: { en: "Sweden: independent comparisons", nb: "Sverige: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Konsumenternas Försäkringsbyrå (konsumenternas.se) compares dog insurance terms independently. Agria is part of the Länsförsäkringar group.", nb: "Konsumenternas Försäkringsbyrå (konsumenternas.se) sammenligner vilkår uavhengig. Agria er en del av Länsförsäkringar-gruppen." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Register in the Swedish dog register (Jordbruksverket)', nb: 'Registrer i det svenske hunderegisteret (Jordbruksverket)' },
            priority: 'essential',
            tip: {
              en: 'Dogs in Sweden must be ID-marked and registered to their owner in Jordbruksverket’s dog register.',
              nb: 'Hunder i Sverige skal ID-merkes og registreres på eier i Jordbruksverkets hunderegister.',
            },
          },
        ],
      },
    ]),
    notes: [
      {
        title: { en: 'Sweden: rules & practical info', nb: 'Sverige: regler og praktisk info' },
        category: 'admin',
        body: {
          en: `• Register the dog with Jordbruksverket and keep owner details updated.
• From 1 March to 20 August dogs must be kept under control so they cannot run loose where there is wildlife. Check local rules too.
• Tick season usually runs from spring to autumn.
• Check jordbruksverket.se for current rules.`,
        },
      },
    ],
  },
  health: [tickSeason('03-01')],
};

const DK: Country = {
  code: 'DK',
  currency: 'DKK',
  pack: {
    options: [
      { provider: "Agria", category: 'insurance', link: 'https://www.agria.dk' },
      { provider: "Tryg", category: 'insurance', link: 'https://www.tryg.dk' },
      { provider: "Codan", category: 'insurance', link: 'https://www.codan.dk' },
      { provider: "Alm. Brand", category: 'insurance', link: 'https://www.almbrand.dk' },
      { provider: "Topdanmark", category: 'insurance', link: 'https://www.topdanmark.dk' },
      { provider: "Gjensidige", category: 'insurance', link: 'https://www.gjensidige.dk' },
    ],
    insuranceNote: { title: { en: "Denmark: independent comparisons", nb: "Danmark: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Tænk (taenk.dk) tests Danish dog insurance; prices differed by up to 2.5× in its latest test. Liability insurance for dogs is mandatory in Denmark; health insurance is optional.", nb: "Tænk (taenk.dk) tester danske hundeforsikringer; prisene varierte opptil 2,5 ganger i siste test. Ansvarsforsikring for hund er påbudt i Danmark; sykeforsikring er frivillig." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Register in Dansk Hunderegister', nb: 'Registrer i Dansk Hunderegister' },
            priority: 'essential',
            tip: { en: 'Dogs in Denmark must be microchipped and registered.', nb: 'Hunder i Danmark skal chippes og registreres.' },
          },
          {
            name: { en: 'Dog liability insurance (mandatory)', nb: 'Ansvarsforsikring for hund (påbudt)' },
            priority: 'essential',
            tip: { en: 'Danish law requires dog owners to have liability insurance.', nb: 'Dansk lov krever at hundeeiere har ansvarsforsikring.' },
          },
        ],
      },
    ]),
  },
  health: [tickSeason('03-01')],
};

const FI: Country = {
  code: 'FI',
  currency: 'EUR',
  pack: {
    options: [
      { provider: "If", category: 'insurance', link: 'https://www.if.fi' },
      { provider: "LähiTapiola", category: 'insurance', link: 'https://www.lahitapiola.fi' },
      { provider: "Pohjola Vakuutus (OP)", category: 'insurance', link: 'https://www.op.fi' },
      { provider: "Fennia", category: 'insurance', link: 'https://www.fennia.fi' },
      { provider: "Turva", category: 'insurance', link: 'https://www.turva.fi' },
      { provider: "Agria", category: 'insurance' },
    ],
    insuranceNote: { title: { en: "Finland: comparing insurers", nb: "Finland: sammenligne forsikringer" }, category: 'insurance', body: { en: "Request quotes with the same deductible and compensation limits from each insurer: published price comparisons in Finland are often out of date.", nb: "Be om tilbud med samme egenandel og erstatningsgrense fra hvert selskap: publiserte prissammenligninger i Finland er ofte utdaterte." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Register in the Finnish dog register (Ruokavirasto)', nb: 'Registrer i det finske hunderegisteret (Ruokavirasto)' },
            priority: 'essential',
            tip: {
              en: 'Dogs in Finland must be microchipped and registered in the Finnish Food Authority’s dog register.',
              nb: 'Hunder i Finland skal chippes og registreres i Mattilsynets (Ruokavirasto) hunderegister.',
            },
          },
        ],
      },
    ]),
  },
  health: [
    tickSeason('03-01'),
    {
      key: 'leash-start',
      kind: 'other',
      title: { en: 'Leash period starts (1 March to 19 August)', nb: 'Båndtvang starter (1. mars–19. august)' },
      when: { yearly: '03-01' },
      repeat: '1y',
    },
  ],
};

const GB: Country = {
  code: 'GB',
  currency: 'GBP',
  pack: {
    options: [
      { provider: "Petplan", category: 'insurance', link: 'https://www.petplan.co.uk' },
      { provider: "Agria", category: 'insurance', link: 'https://www.agriapet.co.uk' },
      { provider: "ManyPets", category: 'insurance', link: 'https://manypets.com' },
      { provider: "Animal Friends", category: 'insurance', link: 'https://www.animalfriends.co.uk' },
      { provider: "Direct Line", category: 'insurance', link: 'https://www.directline.com' },
    ],
    insuranceNote: { title: { en: "UK: independent comparisons", nb: "Storbritannia: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Which? (which.co.uk) compares dog insurance policies feature by feature. Check whether cover is lifetime (resets yearly) or per-condition, and when co-payments start for older dogs.", nb: "Which? (which.co.uk) sammenligner hundeforsikringer punkt for punkt. Sjekk om dekningen er livsvarig (nullstilles årlig) eller per lidelse, og når egenandel i prosent starter for eldre hunder." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Update microchip database with your details', nb: 'Oppdater chipdatabasen med dine opplysninger' },
            priority: 'essential',
            tip: {
              en: 'Microchipping is compulsory and the breeder must chip before sale. Transfer the record to you on a compliant database.',
              nb: 'Chipping er påbudt, og oppdretter skal chippe før salg. Overfør registreringen til deg i en godkjent database.',
            },
          },
          {
            name: { en: 'ID tag with your name and address', nb: 'ID-merke med navn og adresse' },
            priority: 'essential',
            tip: { en: 'Required in public places under the Control of Dogs Order.', nb: 'Påbudt på offentlig sted (Control of Dogs Order).' },
          },
        ],
      },
    ]),
  },
};

const US: Country = {
  code: 'US',
  currency: 'USD',
  pack: {
    options: [
      { provider: "Trupanion", category: 'insurance', link: 'https://www.trupanion.com' },
      { provider: "Healthy Paws", category: 'insurance', link: 'https://www.healthypawspetinsurance.com' },
      { provider: "Embrace", category: 'insurance', link: 'https://www.embracepetinsurance.com' },
      { provider: "Nationwide", category: 'insurance', link: 'https://www.petinsurance.com' },
      { provider: "ASPCA Pet Health Insurance", category: 'insurance', link: 'https://www.aspcapetinsurance.com' },
      { provider: "Lemonade", category: 'insurance', link: 'https://www.lemonade.com' },
    ],
    insuranceNote: { title: { en: "US: independent comparisons", nb: "USA: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Consumer Reports and NerdWallet compare US pet insurers. Most reimburse you after you pay the vet; ask which offer direct vet payment.", nb: "Consumer Reports og NerdWallet sammenligner amerikanske dyreforsikringer. De fleste refunderer etter at du har betalt; spør hvem som betaler veterinæren direkte." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Local dog licence', nb: 'Lokal hundelisens' },
            priority: 'essential',
            tip: { en: 'Most cities/counties require a licence and proof of rabies vaccination.', nb: 'De fleste byer/fylker krever lisens og bevis på rabiesvaksine.' },
          },
          { name: { en: 'Register microchip with your details', nb: 'Registrer chip med dine opplysninger' }, priority: 'essential' },
        ],
      },
    ]),
  },
  health: [
    {
      key: 'rabies',
      kind: 'vaccine',
      title: { en: 'Rabies vaccination (check your state’s required age)', nb: 'Rabiesvaksine (sjekk delstatens alderskrav)' },
      when: { weeksAfterBirth: 16 },
    },
  ],
};

const AU: Country = {
  code: 'AU',
  currency: 'AUD',
  pack: {
    options: [
      { provider: "Bow Wow Meow", category: 'insurance', link: 'https://www.bowwowmeow.com.au' },
      { provider: "RSPCA Pet Insurance", category: 'insurance', link: 'https://www.rspcapetinsurance.org.au' },
      { provider: "Knose", category: 'insurance', link: 'https://www.knose.com.au' },
      { provider: "Petsy", category: 'insurance', link: 'https://www.petsy.com.au' },
    ],
    insuranceNote: { title: { en: "Australia: independent comparisons", nb: "Australia: uavhengige sammenligninger" }, category: 'insurance', body: { en: "Choice, Canstar and Finder compare Australian pet insurance. Several brands share the same underwriter, so compare limits, excess, waiting periods and breed exclusions in each Product Disclosure Statement.", nb: "Choice, Canstar og Finder sammenligner dyreforsikring i Australia. Flere merker har samme forsikringsgiver, så sammenlign grenser, egenandel, karenstid og raseunntak i vilkårene." } },
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Council registration', nb: 'Registrering i kommunen (council)' },
            priority: 'essential',
            tip: { en: 'Rules vary by state and council. Check your council’s website.', nb: 'Reglene varierer mellom stater og kommuner.' },
          },
          { name: { en: 'Transfer microchip registration', nb: 'Overfør chipregistrering' }, priority: 'essential' },
        ],
      },
    ]),
  },
};

const OTHER: Country = {
  code: 'XX',
  currency: 'EUR',
  pack: {
    shopping: admin([
      {
        category: adminCat,
        items: [
          {
            name: { en: 'Microchip & local registration', nb: 'ID-chip og lokal registrering' },
            priority: 'essential',
            tip: {
              en: 'Check your country’s rules on microchipping, registration and ID tags.',
              nb: 'Sjekk reglene for chipping, registrering og ID-merke der du bor.',
            },
          },
        ],
      },
    ]),
  },
};

export const COUNTRIES: Country[] = [NO, SE, DK, FI, GB, US, AU, OTHER];
export const countryByCode = (code?: string) => COUNTRIES.find((c) => c.code === code) ?? OTHER;

export function countryName(code: string, lang: string): string {
  if (code === 'XX') return lang === 'nb' ? 'Annet land' : 'Other country';
  try {
    return new Intl.DisplayNames([lang === 'nb' ? 'nb' : 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const CURRENCIES = ['NOK', 'SEK', 'DKK', 'EUR', 'GBP', 'USD', 'AUD', 'CAD', 'NZD', 'CHF'];
