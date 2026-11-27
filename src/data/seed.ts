import type { Collections, Note, Priority, ShoppingItem, Skill, SocialItem } from '../types';

/**
 * Starter content. IDs are fixed ("seed-…") and timestamps are old on purpose:
 * when two household devices both seed, they merge instead of duplicating,
 * and any edit you make always wins over the original seed.
 * Health/care guidance here is general — confirm specifics with your vet and breeder.
 */
const SEED_TIME = '2026-01-01T00:00:00.000Z';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type S = [name: string, priority: Priority, tip?: string];
const shoppingByCategory: Record<string, S[]> = {
  'Home & sleep': [
    ['Crate (sized for adult, with divider)', 'essential', 'Buy for adult size and use the divider so the puppy only has room to sleep and turn around. That helps toilet training.'],
    ['Washable crate bed / vetbed', 'essential', 'Vetbed-style fleece is chew-resistant-ish and machine washable. Have two so one can be in the wash.'],
    ['Crate cover or light blanket', 'recommended', 'A cosy den helps settling. Leave the front partly open for airflow.'],
    ['Playpen / puppy pen', 'recommended', 'A safe zone for when you cannot supervise. Pair with the crate.'],
    ['Baby gates', 'recommended', 'Block stairs and rooms you are not ready to puppy-proof.'],
    ['Comfort toy with litter scent', 'nice', 'Ask the breeder to rub a soft toy or blanket with mum & littermates before pickup.'],
  ],
  Feeding: [
    ['Same puppy food the breeder uses', 'essential', 'Keep the breeder\'s food for at least the first 2 weeks; switch gradually over 7–10 days if you change.'],
    ['Stainless steel food & water bowls', 'essential', 'Easy to clean, no chewing on plastic.'],
    ['Slow-feeder or lick mat', 'recommended', 'Slows fast eaters and doubles as calming enrichment.'],
    ['Training treats (tiny, soft)', 'essential', 'Pea-sized and soft, so you can do lots of repetitions without overfeeding.'],
    ['Airtight food container', 'nice'],
  ],
  'Walking & ID': [
    ['Collar with ID tag', 'essential', 'Check local law on what the tag must show, which is often your name and phone number.'],
    ['Y-shaped puppy harness', 'essential', 'Y-front harnesses do not restrict shoulder movement. Re-check fit every week or two as the puppy grows.'],
    ['Lightweight 1.5–2m lead', 'essential'],
    ['Long line (5–10m)', 'recommended', 'For safe recall practice in open spaces.'],
    ['Treat pouch', 'recommended', 'Training is much easier when rewards are always on you.'],
    ['Poo bags + dispenser', 'essential'],
  ],
  Grooming: [
    ['Slicker brush', 'essential', 'Cobberdog fleece/wool coats mat easily, especially behind ears, armpits and collar line.'],
    ['Metal comb (wide/fine)', 'essential', 'Comb through after brushing to find hidden knots down to the skin.'],
    ['Gentle puppy shampoo', 'recommended'],
    ['Ear cleaner (vet-recommended)', 'recommended', 'Hairy, floppy ears trap moisture. Check them weekly and after swims.'],
    ['Nail clippers or grinder', 'recommended', 'Start handling paws daily from day one, before the puppy needs a trim.'],
    ['Puppy toothbrush & dog toothpaste', 'nice', 'Never use human toothpaste.'],
    ['Book first puppy groom (intro visit)', 'recommended', 'Many groomers offer a short "puppy intro" at around 12–16 weeks once vaccinations allow.'],
  ],
  'Toilet training': [
    ['Enzymatic cleaner', 'essential', 'Breaks down odour so the puppy is not drawn back to the same spot. Avoid ammonia-based cleaners.'],
    ['Paper towels / old towels', 'essential'],
    ['Puppy pads (optional)', 'nice', 'Useful for apartments or overnight. Many trainers prefer going straight to outdoors.'],
  ],
  'Toys & enrichment': [
    ['Rubber chew toy (e.g. puppy Kong-style)', 'essential', 'Stuff and freeze it for teething relief and settling.'],
    ['Teething chews (age-appropriate)', 'recommended', 'Avoid cooked bones and very hard chews that can crack teeth.'],
    ['Snuffle mat', 'recommended', 'Sniffing is calming mental work, which helps with the Cobberdog\'s sensitive, people-focused nature.'],
    ['Tug toy', 'nice'],
    ['Soft plush toy', 'nice'],
  ],
  Travel: [
    ['Car crate or crash-tested harness', 'essential', 'Needed for the drive home from the breeder. Check local car-restraint rules.'],
    ['Old towels & spare bags for the trip home', 'recommended', 'Car sickness is common on the first trip.'],
  ],
  'Health & admin': [
    ['Book first vet check (within 72h of pickup)', 'essential', 'Many breeder health guarantees require a vet check within a few days.'],
    ['Pet insurance (start before pickup)', 'essential', 'Policies often have waiting periods for illness, so compare excess, annual limit and hereditary-condition cover.'],
    ['Transfer microchip registration', 'essential', 'Get the chip number and transfer paperwork from the breeder.'],
    ['Council / local registration', 'recommended', 'Rules vary by area. Check your council or local authority.'],
    ['Flea, tick & worming plan (from vet)', 'essential', 'Your vet will set a schedule by weight and region.'],
    ['Vaccination record from breeder', 'essential', 'Bring it to the first vet visit.'],
  ],
};

export const seedShopping: ShoppingItem[] = Object.entries(shoppingByCategory).flatMap(([category, items]) =>
  items.map(([name, priority, tip]) => ({
    id: `seed-shop-${slug(name)}`,
    updatedAt: SEED_TIME,
    name,
    category,
    priority,
    status: 'todo' as const,
    tip,
  })),
);

const note = (title: string, category: Note['category'], body: string, extra: Partial<Note> = {}): Note => ({
  id: `seed-note-${slug(title)}`,
  updatedAt: SEED_TIME,
  title,
  category,
  kind: 'note',
  body,
  ...extra,
});

export const seedNotes: Note[] = [
  note(
    'About the Australian Cobberdog',
    'Breed essentials',
    `• Developed in Australia from Labradoodle lines, bred specifically as assistance and therapy dogs.
• Temperament: gentle, intelligent, intuitive and very people-focused. They thrive on being with their family.
• Coat: low-shedding fleece or wool. Low shedding does not mean low maintenance, because the coat mats without regular brushing.
• Sizes: usually miniature, medium and standard. Ask your breeder for the expected adult weight range.
• Energy: moderate. They need daily walks plus brain work (training, sniffing games) more than marathon exercise.
• Watch-out: because they bond closely, practise alone-time early to prevent separation anxiety.`,
    { pinned: true },
  ),
  note(
    'Questions to ask the breeder before pickup',
    'Breeder & pickup',
    `• Which health tests were done on the parents (hips, elbows, eyes/PRA)? Ask for certificates.
• Vaccination & worming done so far, and the due dates for the next ones.
• Microchip number and how to transfer the registration.
• Current food brand, amount and feeding times.
• Daily routine: sleep, toilet habits, what the puppy has already been exposed to.
• Health guarantee terms, including whether it requires a vet check within a set number of days.
• Can you take home a blanket or toy that smells of mum and the littermates?`,
    { pinned: true },
  ),
  note(
    'Choosing a vet: what to compare',
    'Vet',
    `Use "Add option" for each clinic you look at, then mark one as Chosen.
• Distance and opening hours. Where is the nearest 24/7 emergency hospital?
• Puppy packages (vaccinations + checks bundled) and their price
• Experience with doodle-type coats, ears and skin
• Fear-free / low-stress handling approach
• Payment plans and direct insurance billing
• What reviews say about communication, not just friendliness`,
  ),
  note(
    'Choosing a puppy training course: what to compare',
    'Training course',
    `Use "Add option" for each course, then mark one as Chosen.
• Methods: look for reward-based / positive reinforcement. Avoid prong, choke or shock tools.
• Trainer qualifications and certification (e.g. CCPDT, APDT, Delta or a local equivalent)
• Class size, and whether puppy play is supervised and matched by size and confidence
• Start age and vaccination requirements
• Curriculum: socialisation, handling, recall, loose-lead walking, settle/calm
• Price, number of sessions, make-up classes`,
  ),
  note(
    'Feeding basics',
    'Food & nutrition',
    `• Puppies usually eat 3–4 small meals a day until around 4–6 months, then 2.
• Keep the breeder's food at first. Switch gradually (25% → 50% → 75% → 100% over 7–10 days).
• Count training treats in the daily allowance.
• Fresh water always available. Lift it 1–2 hours before bedtime during toilet training.
• Toxic foods: chocolate, grapes/raisins, onion, garlic, xylitol (sugar-free gum), macadamias, cooked bones.`,
  ),
  note(
    'Coat care routine',
    'Grooming',
    `• Brush 2–3× a week as a puppy (daily once the adult coat comes in, often from around 8–12 months, when matting is worst).
• Line-brush down to the skin, then check with a comb.
• Hotspots for mats: behind the ears, armpits, collar/harness line, between back legs.
• Professional groom every 6–8 weeks as an adult.
• Check ears weekly. Pluck or trim ear hair only on vet or groomer advice.
• Make grooming a happy routine with treats from day one.`,
  ),
  note(
    'Pet insurance: comparison checklist',
    'Insurance & admin',
    `• Waiting periods (accident vs illness), so start cover before or on pickup day
• Annual limit and sub-limits
• Excess and reimbursement %
• Hereditary & congenital conditions covered? (hips, elbows, eyes)
• Dental and behavioural cover
• Premium increase with age`,
  ),
  note(
    'First 48 hours at home',
    'Tips',
    `• Keep it calm and quiet. Visitors can wait a few days.
• Take the puppy outside to the same toilet spot on waking, after eating, after play and every 1–2 hours. Reward immediately.
• Crate near your bed for the first nights. Respond to night toilet needs calmly and boringly.
• Start name recognition and handling (paws, ears, mouth) with treats.
• Short alone-time moments from day one (you in the next room) to prevent separation anxiety.`,
    { pinned: true },
  ),
];

type K = [name: string, howTo: string];
const skillsByGroup: Record<string, K[]> = {
  Foundations: [
    ['Name recognition', 'Say the name once and mark + treat when the puppy looks at you. Never use the name for something unpleasant.'],
    ['Marker word ("yes!")', 'Say "yes" then give a treat, repeated 10–20 times. The word now predicts reward.'],
    ['Toilet training', 'Take the puppy out on waking, after meals and play, and every 1–2h. Reward the moment it finishes outside.'],
    ['Crate comfort', 'Feed meals in the crate, give stuffed chews there, and build up door-closed time slowly.'],
    ['Handling & grooming tolerance', 'Touch ears, paws, mouth and tail briefly, then treat. Add the brush and nail clippers gradually.'],
    ['Alone-time training', 'Start with seconds out of sight and build up slowly. Leave and return calmly. Key for Cobberdogs.'],
  ],
  'Basic cues': [
    ['Sit', 'Lure a treat up and back over the nose; mark when the bottom touches the floor. Fade the lure after a few sessions.'],
    ['Down', 'Lure from the nose straight to the floor between the paws. Mark when the elbows touch the floor.'],
    ['Come (recall)', 'Use a happy voice, run away and reward big. Never call the puppy for something unpleasant. Practise on a long line.'],
    ['Leave it', 'Hide a treat in your closed fist and mark the moment the puppy backs off. Reward from the other hand.'],
    ['Drop it / trade', 'Swap a toy for a treat, then give the toy back. That teaches that giving up a toy pays.'],
    ['Wait / stay', 'Build duration first, then distance, then distraction, one at a time.'],
  ],
  'Life skills': [
    ['Loose-lead walking', 'Reward the puppy for being by your side. Stop when the lead goes tight and start again when it is slack.'],
    ['Settle on a mat', 'Reward calm lying down on a mat. Builds an "off switch" for cafés and visitors.'],
    ['Polite greetings (four on the floor)', 'Greet the puppy only when all four paws are on the floor. Ask visitors to do the same.'],
    ['Car travel', 'Short, positive trips that end somewhere fun, not just at the vet.'],
  ],
};

export const seedSkills: Skill[] = Object.entries(skillsByGroup).flatMap(([group, items]) =>
  items.map(([name, howTo]) => ({
    id: `seed-skill-${slug(name)}`,
    updatedAt: SEED_TIME,
    name,
    group,
    status: 'not-started' as const,
    howTo,
  })),
);

const socialByGroup: Record<string, string[]> = {
  People: ['Men with beards/hats', 'Children (supervised)', 'Elderly people / walking aids', 'People in uniforms / hi-vis', 'People wearing sunglasses or helmets'],
  Animals: ['Calm vaccinated adult dog', 'Cats', 'Other puppies (in class)', 'Birds / farm animals'],
  Sounds: ['Vacuum cleaner', 'Doorbell & knocking', 'Traffic & trucks', 'Thunder / fireworks (recordings, low volume)', 'Hair dryer / clippers'],
  Surfaces: ['Grass', 'Gravel', 'Tiles / slippery floors', 'Metal grates', 'Stairs', 'Wobbly surfaces'],
  Places: ['Car rides', 'Café (carried / on mat)', 'Vet happy visit (treats only)', 'Groomer happy visit', 'Busy street (from a distance)'],
  Handling: ['Ears checked', 'Paws & nails touched', 'Mouth/teeth looked at', 'Brushed & combed', 'Towel dried', 'Wearing harness'],
};

export const seedSocial: SocialItem[] = Object.entries(socialByGroup).flatMap(([group, names]) =>
  names.map((name) => ({ id: `seed-social-${slug(name)}`, updatedAt: SEED_TIME, name, group, count: 0 })),
);

export function seedCollections(): Collections {
  return {
    profile: [],
    shopping: seedShopping,
    notes: seedNotes,
    skills: seedSkills,
    sessions: [],
    social: seedSocial,
  };
}
