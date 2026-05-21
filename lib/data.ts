export type Campground = {
  id: string;
  name: string;
  park: string;
  region: string;
  sites: number;
  elevation: string;
  coords: { x: number; y: number };
  tags: string[];
  desc: string;
  cancellations: number;
};

export type Alert = {
  id: string;
  campground: string;
  park: string;
  dates: string;
  nights: number;
  flexibility: string;
  sites: string;
  status: "monitoring" | "found" | "paused";
  hits: number;
  lastCheck: string;
  frequency: string;
  created: string;
};

export type HistoryEntry = {
  when: string;
  text: string;
  alert: string;
  action: "Notified" | "Skipped (partial)" | "Continuing";
};

export type CalDay = {
  d: number;
  out?: boolean;
  avail?: boolean;
  range?: "start" | "end" | "mid" | null;
};

export type Site = {
  num: number;
  status: "available" | "watched" | "taken";
  type: "Tent" | "RV";
};

export const campgrounds: Campground[] = [
  {
    id: "upper-pines",
    name: "Upper Pines",
    park: "Yosemite National Park",
    region: "Central Sierra",
    sites: 238,
    elevation: "4,000 ft",
    coords: { x: 38, y: 36 },
    tags: ["Tent", "RV", "Pet OK"],
    desc: "Along the Merced River at the east end of Yosemite Valley. Walk to Mirror Lake, Half Dome trailhead, and the village.",
    cancellations: 12,
  },
  {
    id: "kirby-cove",
    name: "Kirby Cove",
    park: "Golden Gate NRA",
    region: "Bay Area",
    sites: 4,
    elevation: "20 ft",
    coords: { x: 14, y: 48 },
    tags: ["Tent only", "Beach"],
    desc: "Four secluded sites tucked beneath the Marin Headlands with a private beach and Golden Gate Bridge views.",
    cancellations: 41,
  },
  {
    id: "kirk-creek",
    name: "Kirk Creek",
    park: "Los Padres NF",
    region: "Big Sur",
    sites: 33,
    elevation: "100 ft",
    coords: { x: 24, y: 64 },
    tags: ["Ocean view", "Tent", "RV"],
    desc: "Cliffside sites with unbroken Pacific views along Highway 1, south of Limekiln State Park.",
    cancellations: 28,
  },
  {
    id: "manresa",
    name: "Manresa Uplands",
    park: "Manresa State Beach",
    region: "Central Coast",
    sites: 64,
    elevation: "40 ft",
    coords: { x: 22, y: 55 },
    tags: ["Walk-in", "Beach"],
    desc: "Walk-in tent sites on a bluff above Manresa Beach near La Selva.",
    cancellations: 9,
  },
  {
    id: "north-pines",
    name: "North Pines",
    park: "Yosemite National Park",
    region: "Central Sierra",
    sites: 81,
    elevation: "4,000 ft",
    coords: { x: 39, y: 35 },
    tags: ["Tent", "RV", "Horses"],
    desc: "Quieter Valley campground at the confluence of Tenaya Creek and the Merced.",
    cancellations: 18,
  },
  {
    id: "wrights-beach",
    name: "Wright's Beach",
    park: "Sonoma Coast SP",
    region: "North Coast",
    sites: 27,
    elevation: "20 ft",
    coords: { x: 11, y: 30 },
    tags: ["Beachfront", "Tent", "RV"],
    desc: "Sandy sites directly on Wright's Beach, with bluff hikes to Shell Beach.",
    cancellations: 22,
  },
  {
    id: "lodgepole",
    name: "Lodgepole",
    park: "Sequoia National Park",
    region: "Southern Sierra",
    sites: 203,
    elevation: "6,700 ft",
    coords: { x: 46, y: 56 },
    tags: ["Tent", "RV", "River"],
    desc: "Near the Marble Fork of the Kaweah River with easy access to the Tokopah Falls trail.",
    cancellations: 7,
  },
  {
    id: "jumbo-rocks",
    name: "Jumbo Rocks",
    park: "Joshua Tree NP",
    region: "Mojave",
    sites: 124,
    elevation: "4,400 ft",
    coords: { x: 70, y: 78 },
    tags: ["Tent", "RV", "Stargazing"],
    desc: "Sites tucked among monzogranite boulders in the heart of Joshua Tree.",
    cancellations: 31,
  },
];

export const alerts: Alert[] = [
  {
    id: "a1",
    campground: "Upper Pines",
    park: "Yosemite NP",
    dates: "Jul 18 – Jul 20, 2026",
    nights: 2,
    flexibility: "± 3 days",
    sites: "14, 15, 22, 38",
    status: "monitoring",
    hits: 0,
    lastCheck: "32s ago",
    frequency: "Every 60s",
    created: "May 12",
  },
  {
    id: "a2",
    campground: "Kirby Cove",
    park: "Golden Gate NRA",
    dates: "Aug 8 – Aug 10, 2026",
    nights: 2,
    flexibility: "Exact dates",
    sites: "Any tent site",
    status: "found",
    hits: 3,
    lastCheck: "12s ago",
    frequency: "Every 30s",
    created: "Apr 28",
  },
  {
    id: "a3",
    campground: "Kirk Creek",
    park: "Los Padres NF",
    dates: "Sep 4 – Sep 7, 2026",
    nights: 3,
    flexibility: "± 1 week",
    sites: "Ocean-facing only",
    status: "monitoring",
    hits: 1,
    lastCheck: "2m ago",
    frequency: "Every 5m",
    created: "May 02",
  },
  {
    id: "a4",
    campground: "Jumbo Rocks",
    park: "Joshua Tree NP",
    dates: "Oct 16 – Oct 18, 2026",
    nights: 2,
    flexibility: "Weekends in Oct",
    sites: "Any",
    status: "paused",
    hits: 0,
    lastCheck: "Paused",
    frequency: "Every 5m",
    created: "Mar 19",
  },
];

export const history: HistoryEntry[] = [
  { when: "Today, 8:14 AM", text: "Kirby Cove site 3 → Aug 8–10", alert: "a2", action: "Notified" },
  { when: "Yesterday, 11:02 PM", text: "Kirk Creek site 18 → Sep 4–6", alert: "a3", action: "Notified" },
  { when: "Yesterday, 4:47 PM", text: "Kirby Cove site 1 → Aug 8–10", alert: "a2", action: "Notified" },
  { when: "May 18, 9:30 AM", text: "Kirby Cove site 2 → Aug 9–10 (partial)", alert: "a2", action: "Skipped (partial)" },
  { when: "May 14, 6:12 AM", text: "Upper Pines — no openings", alert: "a1", action: "Continuing" },
];

export const calendar = {
  month: "July 2026",
  days: (() => {
    const out: CalDay[] = [];
    [28, 29, 30].forEach((d) => out.push({ d, out: true }));
    for (let d = 1; d <= 31; d++) {
      out.push({
        d,
        avail: [5, 6, 11, 17, 18, 22, 28].includes(d),
        range:
          d >= 18 && d <= 20
            ? d === 18
              ? "start"
              : d === 20
              ? "end"
              : "mid"
            : null,
      });
    }
    let i = 1;
    while (out.length < 42) out.push({ d: i++, out: true });
    return out;
  })(),
};

export const sites: Site[] = Array.from({ length: 40 }, (_, i) => {
  const num = i + 1;
  const status = [3, 7, 9, 12, 18, 21, 25, 30, 36].includes(num)
    ? "available"
    : [5, 14, 15, 22, 38].includes(num)
    ? "watched"
    : "taken";
  return { num, status, type: num % 6 === 0 ? "RV" : "Tent" };
});
