import type { L } from '../i18n';
import type { HealthSuggestion } from './suggest-types';
import type { ContentPack } from './types';

export interface Breed {
  id: string;
  name: L;
  /** Brand name shown in the header for this breed; falls back to the generic app name. */
  appName?: L;
  sizes?: L[];
  pack?: ContentPack;
  health?: HealthSuggestion[];
}

const cobberdog: Breed = {
  id: 'cobberdog',
  name: { en: 'Australian Cobberdog', nb: 'Australsk cobberdog' },
  appName: { en: 'Cobberdog Essentials', nb: 'Cobberdog-appen' },
  sizes: [
    { en: 'Miniature', nb: 'Miniatyr' },
    { en: 'Medium', nb: 'Medium' },
    { en: 'Standard', nb: 'Standard' },
  ],
  pack: {
    notes: [
      {
        title: { en: 'About the Australian Cobberdog', nb: 'Om australsk cobberdog' },
        category: 'breed',
        pinned: true,
        body: {
          en: `• Developed in Australia from Labradoodle lines, bred specifically as assistance and therapy dogs.
• Temperament: gentle, intelligent, intuitive and very people-focused. They thrive on being with their family.
• Coat: low-shedding fleece or wool. Low shedding does not mean low maintenance, because the coat mats without regular brushing.
• Sizes: usually miniature, medium and standard. Ask your breeder for the expected adult weight range.
• Energy: moderate. They need daily walks plus brain work (training, sniffing games) more than marathon exercise.
• Watch-out: because they bond closely, practise alone-time early to prevent separation anxiety.`,
          nb: `• Utviklet i Australia fra labradoodle-linjer, avlet spesielt som assistanse- og terapihunder.
• Gemytt: mild, intelligent, intuitiv og svært menneskeorientert. Trives best sammen med familien.
• Pels: lite røyting, fleece- eller ullpels. Lite røyting betyr ikke lite stell, for pelsen tover seg uten jevnlig børsting.
• Størrelser: vanligvis miniatyr, medium og standard. Spør oppdretteren om forventet voksenvekt.
• Energi: moderat. De trenger daglige turer og hjernetrim (trening, snuseleker) mer enn lange løpeturer.
• Obs: fordi de knytter seg tett, bør alenetrening starte tidlig for å forebygge separasjonsangst.`,
        },
      },
      {
        title: { en: 'Cobberdog coat care routine', nb: 'Pelsstell for cobberdog' },
        category: 'grooming',
        body: {
          en: `• Brush 2–3× a week as a puppy, and daily once the adult coat comes in (often from 8–12 months, when matting is worst).
• Line-brush down to the skin, then check with a comb.
• Hotspots for mats: behind the ears, armpits, collar/harness line, between back legs.
• Professional groom every 6–8 weeks as an adult.
• Hairy, floppy ears trap moisture: check them weekly. Pluck or trim ear hair only on vet or groomer advice.
• Make grooming a happy routine with treats from day one.`,
          nb: `• Børst 2–3 ganger i uken som valp, og daglig når voksenpelsen kommer (ofte fra 8–12 måneder, da tover den seg mest).
• Børst lag for lag helt inn til huden, og kontroller med kam.
• Typiske tovesteder: bak ørene, i armhulene, under halsbånd/sele og mellom bakbeina.
• Profesjonell klipp hver 6.–8. uke som voksen.
• Hårete, hengende ører holder på fuktighet: sjekk dem hver uke. Napp eller klipp hår i ørene bare etter råd fra veterinær eller groomer.
• Gjør pelsstell til en hyggelig rutine med godbiter fra første dag.`,
        },
      },
    ],
    shopping: [
      {
        category: { en: 'Grooming', nb: 'Pelsstell' },
        items: [
          {
            name: { en: 'Slicker brush', nb: 'Karde (slicker)' },
            priority: 'essential',
            tip: {
              en: 'Cobberdog fleece/wool coats mat easily, especially behind ears, armpits and the collar line.',
              nb: 'Cobberdogpels tover seg lett, spesielt bak ørene, i armhulene og under halsbåndet.',
            },
          },
          {
            name: { en: 'Metal comb (wide/fine)', nb: 'Metallkam (grov/fin)' },
            priority: 'essential',
            tip: { en: 'Comb after brushing to find hidden knots down to the skin.', nb: 'Gre etter børsting for å finne skjulte floker inntil huden.' },
          },
          { name: { en: 'Ear cleaner (vet-recommended)', nb: 'Ørerens (anbefalt av veterinær)' }, priority: 'recommended' },
          {
            name: { en: 'Book first puppy groom (intro visit)', nb: 'Bestill første valpeklipp (introduksjon)' },
            priority: 'recommended',
            tip: {
              en: 'Many groomers offer a short “puppy intro” at around 12–16 weeks once vaccinations allow.',
              nb: 'Mange groomere tilbyr en kort «valpeintro» rundt 12–16 uker når vaksinene tillater det.',
            },
          },
        ],
      },
    ],
  },
  health: [
    {
      key: 'groom-intro',
      kind: 'grooming',
      title: { en: 'First puppy groom (intro visit)', nb: 'Første valpeklipp (introduksjon)' },
      when: { weeksAfterBirth: 15 },
    },
  ],
};

const other: Breed = { id: 'other', name: { en: 'Other / mixed breed', nb: 'Annen rase / blanding' } };

export const BREEDS: Breed[] = [cobberdog, other];
export const breedById = (id?: string) => BREEDS.find((b) => b.id === id) ?? other;
