/**
 * HOLLYWOOD V2 — world banks: studios, streamers, festivals, titles, hooks.
 * All fictional companies, real-feeling. Everything here is display text.
 */

export const MAJORS = [
  "Grand Republic Pictures",
  "Mammoth Brothers Studios",
  "Quasar Pictures",
  "Pacific Crown Studios",
  "NorthStar Motion Pictures",
];

export const MID_MAJORS = [
  "Starline Films",
  "Ironbound Pictures",
  "Silverline Films",
  "Hummingbird Films",
  "Badgerton",
];

export const INDIES = [
  "Beacon & Vale",
  "Tinderbox Pictures",
  "Lantern Pictures",
  "Stateroom Pictures",
  "Hollowground Films",
  "Railspur Pictures",
  "Kestrel & Co.",
  "Nightjar Films",
];

export const STREAMERS = ["Northstream", "Vidya", "Kernel+", "Hearthline"];

export const NETWORKS = ["the network", "KPX", "Continental Broadcasting", "Hearthline Prime"];

export const LABELS = ["a major label", "an indie label", "the artist's own imprint"];

export const FESTIVALS = ["Park City", "The Croisette", "Venice Lido", "Toronto", "Telluride", "Silver Lake"];

export const CIRCUIT_NAMES = [
  "the Festival circuit",
  "the National Critics Circle",
  "the Independent Film Awards",
  "the Directors Guild",
  "the International Film Prize",
  "the Academy Awards",
];

export const ACADEMY_CATS = ["Picture", "Director", "Screenplay", "Cinematography", "Editing", "Score"];

export const TECH_CATS = [
  "Visual Effects",
  "Sound",
  "Production Design",
  "Costume Design",
  "Makeup & Hairstyling",
];

export const OUTLETS = [
  "The Reviewer",
  "Silver Screen Daily",
  "The Trade Paper",
  "Cinema Monthly",
  "The Culture Desk",
  "The Projectionist",
];

/* ------------------------------------------------------------------ */
/* Titles                                                              */
/* ------------------------------------------------------------------ */

export const GENRE_TITLES: Record<string, string[]> = {
  Drama: [
    "The Weight of Water", "Where the Light Goes", "A Season of Quiet", "The Last Good Year",
    "What We Carried", "The Long Way Back", "Houses Made of Rain", "The Space Between Sundays",
    "Everything We Never Said", "The Quiet Divide", "Half a Life", "The Stillness After",
    "Letters from Nowhere", "The Orchard", "All the Small Hours", "The Distance Home",
  ],
  Comedy: [
    "Plus One", "The Worst Best Man", "Casual Friday", "Two Adults", "The Breakup App",
    "Dinner for No One", "Secondhand Joy", "The Plus Side", "Mr. & Mrs. (Mostly)",
    "The Reunion", "Group Chat", "Everything's Fine", "The Sublet", "Late Checkout",
    "Mildly Famous", "The Neighbor",
  ],
  Horror: [
    "The Hollow Floor", "What Sleeps Below", "The Seventh Door", "Marrow Creek",
    "The Whispering Wall", "After the Last Candle", "The Skin House", "Vermin",
    "The Quiet Neighbors", "Teeth", "The Long Night Shift", "Basement Season",
    "The Feast of Ash", "Don't Answer the Knocking", "The Attic Children", "Blackroot",
  ],
  Thriller: [
    "The Counterpart", "Cold Ledger", "The Disappearing Act", "Forty Hours",
    "The Informant's Wife", "No Exit Clause", "The Watchman", "Burn Notice",
    "The Safehouse", "What the Camera Saw", "The Midwife", "Terminal Velocity",
    "The Debt", "Glass House", "The Perfect Alibi", "Extraction Point",
  ],
  Action: [
    "Red Horizon", "The Breach", "Velocity Nine", "Steel Meridian", "Last Convoy",
    "The Extraction", "Hard Landing", "Zero Hour Protocol", "The Gauntlet",
    "Dead Freight", "The Wrecking Crew", "Full Burn", "Iron Season", "The Raid",
  ],
  "Sci-Fi": [
    "The Terraforming", "Signal Lost", "The Europa Garden", "Half-Life of Stars",
    "The Memory Merchant", "Orbital", "The Second Genesis", "The Cold Between",
    "Daughter of the Machine", "The Long Upload", "Chronos Debt", "The Ark Manifest",
    "Eventide Station", "The Sleeping Ship",
  ],
  Crime: [
    "The Ledger", "Crown Heights", "The Fence", "Small Hours in Reno", "The Inside Man",
    "Paper Trails", "The Last Getaway", "Low Winter", "The Collectors", "Marked Money",
    "The Harbor Line", "Family Business",
  ],
  Romance: [
    "The Layover", "Summer in Someone Else's Kitchen", "The Wedding I Crashed",
    "Almost Yours", "The Second First Date", "Pen Pals", "The Lighthouse Keeper's Daughter",
    "Terms of Endearment Pending", "The Interval", "Two Weeks in October",
  ],
  Animation: [
    "The Fox and the Lighthouse", "Paper Moons", "The Umbrella Thief", "Little Comet",
    "The Clockwork Garden", "Beneath the Floorboards", "The Boy Who Collected Storms",
    "Marzipan", "The Tides of June", "A Bear in Winter", "The Star Cartographer",
  ],
  Documentary: [
    "The Last Projectionist", "Ghosts of the Iron League", "The Salmon Wars",
    "Voices from the Kiln", "The Disappearing Coast", "Street Symphony",
    "The Miners' Choir", "Twelve Winters", "The Memory Ward", "Concrete Harvest",
    "The Ballroom", "A Village Under Water",
  ],
  Musical: [
    "The Marquee", "Sing Me Back", "The Last Chorus", "Footlights", "The Swing Shift",
    "An Overture in Blue", "The Tap Room", "Encore", "The Understudy",
  ],
};

export const T_ADJ = [
  "Silent", "Crimson", "Hollow", "Electric", "Burning", "Golden", "Broken", "Endless",
  "Midnight", "Glass", "Iron", "Velvet", "Frozen", "Wild", "Distant", "Scarlet", "Neon",
];
export const T_NOUN = [
  "Horizon", "River", "Signal", "Orchard", "Empire", "Lantern", "Frontier", "Garden",
  "Machine", "Harbor", "Crown", "Winter", "Mirror", "Voyage", "Legacy", "Paradox",
];

export const MUSIC_VIDEO_SUBJECTS = [
  "a rising pop artist", "a legacy rock band", "a viral bedroom producer",
  "a rapper with something to prove", "a country crossover act",
];

export const COMMERCIAL_SUBJECTS = [
  "a soda brand", "an electric truck", "a streaming service", "a phone launch",
  "an airline", "a fast-food chain",
];

export const TV_SUBJECTS = [
  "a prestige crime series", "a network sitcom", "a streaming sci-fi show",
  "a hospital drama", "a limited series adaptation",
];

export const DOCUMENTARY_SUBJECTS = [
  "a retired projectionist keeping a dying theater alive",
  "a fishing town losing its harbor",
  "the last season of a minor-league hockey team",
  "a community choir of former miners",
  "a street musician with an unplaceable past",
  "a family farm under eminent domain",
  "a dance school in a flooded district",
  "the workers dismantling a decommissioned power plant",
];

/* ------------------------------------------------------------------ */
/* Offer hooks — why this, why now                                     */
/* ------------------------------------------------------------------ */

export const HOOKS = {
  coldOpen: [
    "Nobody is returning calls. This is what's actually available.",
    "The phone hasn't rung in months. You take what's there.",
  ],
  newcomer: [
    "You're a name on a list, not a name. But everyone starts somewhere.",
    "No heat yet. Just work.",
  ],
  lastHit: [
    "After {title}, everyone suddenly remembers your number.",
    "{title} bought you a seat at bigger tables.",
  ],
  lastFlop: [
    "{title} hurt. These are the doors that are still open.",
    "The town has a short memory for hits and a long one for flops.",
  ],
  courted: [
    "For the first time, they're pitching you.",
    "Three studios called this week. You get to choose.",
  ],
  festivalGlow: [
    "The festival run did its job. Everyone wants to know what's next.",
    "You're the name in the trade papers this morning.",
  ],
  awardsAfterglow: [
    "The nomination changed the temperature of every meeting.",
    "Post-Oscar season. The offers got heavier.",
  ],
  steady: [
    "The trades are quiet. The work isn't.",
    "Another slate, another choice.",
  ],
  idle: [
    "Time off made the town nervous. Prove you're still hungry.",
    "You've been gone long enough that they noticed.",
  ],
  passion: [
    "This one is yours. Nobody can stop it — nobody will save it either.",
    "You've earned the right to lose money on your own terms.",
  ],
  comeback: [
    "The town loves a resurrection story. One shot. Don't miss.",
    "They remember the fall. Make them remember why you mattered.",
  ],
};
