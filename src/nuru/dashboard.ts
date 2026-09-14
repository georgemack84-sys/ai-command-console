import { z } from "zod";

export const discoveryCategories = ["Near certain", "Adjacent", "Serendipity", "Wildcard"] as const;
export type DiscoveryCategory = (typeof discoveryCategories)[number];

export type NuruDiscovery = {
  id: string;
  kind: DiscoveryCategory;
  title: string;
  meta: string;
  score: number;
  image: "apollo" | "chip" | "japan" | "ocean";
};

export const discoveries: NuruDiscovery[] = [
  { id: "apollo-guidance-computer", kind: "Near certain", title: "Apollo Guidance Computer", meta: "Documentary · Engineering", score: 92, image: "apollo" },
  { id: "mapping-the-ocean-floor", kind: "Near certain", title: "Mapping the Ocean Floor", meta: "Article · Science history", score: 89, image: "ocean" },
  { id: "air-traffic-control", kind: "Near certain", title: "The Quiet Precision of Air Traffic Control", meta: "Documentary · Aviation", score: 87, image: "apollo" },
  { id: "semiconductor-wars", kind: "Adjacent", title: "The Semiconductor Wars", meta: "Article · Technology", score: 81, image: "chip" },
  { id: "invention-of-time-zones", kind: "Adjacent", title: "The Invention of Time Zones", meta: "Essay · History", score: 74, image: "japan" },
  { id: "japanese-craftsmanship", kind: "Serendipity", title: "The Art of Japanese Craftsmanship", meta: "Video · Culture", score: 67, image: "japan" },
  { id: "octopus-intelligence", kind: "Wildcard", title: "The Secret Intelligence of Octopuses", meta: "Article · Nature", score: 58, image: "ocean" },
];

export type NuruDiscoveryDetail = {
  id: string;
  kind: string;
  title: string;
  meta: string;
  score: number;
  image: string;
  eyebrow: string;
  summary: string;
  reason: string;
  connection: string;
  paths: string[];
};

const discoveryDetails: Record<string, NuruDiscoveryDetail> = {
  "billion-dollar-spy": { id: "billion-dollar-spy", kind: "Near certain", title: "The Billion Dollar Spy", meta: "Book · David E. Hoffman · 2015", score: 86, image: "featured", eyebrow: "A true story of engineering, espionage, and consequence", summary: "The extraordinary true story of Adolf Tolkachev, a Soviet radar engineer who became one of America’s most valuable Cold War sources. It is a story about the quiet work behind historical turning points—and the people who take enormous risks to change what seems inevitable.", reason: "You’ve repeatedly explored stories where technical systems change the balance of power. This combines engineering, competition, historical consequence, and an unusual central character.", connection: "This isn’t primarily an engineering story. The surprise is how a constraint in radar design became part of a much larger political decision.", paths: ["Cold War technology", "Hidden systems", "The human cost of intelligence"] },
  "apollo-guidance-computer": { id: "apollo-guidance-computer", kind: "Near certain", title: "Apollo Guidance Computer", meta: "Documentary · Engineering", score: 92, image: "apollo", eyebrow: "The computer that helped navigate to the Moon", summary: "A compact computer, built under extraordinary pressure, became one of the pivotal hidden systems behind the Apollo missions. Its story holds invention, restraint, and the practical courage of choosing what matters most.", reason: "You consistently return to technology at moments of maximum consequence. The Apollo Guidance Computer is an ingenious solution whose impact is easy to underestimate from a distance.", connection: "Its most enduring lesson is not raw computational power, but the discipline of deciding which information deserves a human’s attention.", paths: ["Space race", "Human-machine collaboration", "Engineering under pressure"] },
  "mapping-the-ocean-floor": { id: "mapping-the-ocean-floor", kind: "Near certain", title: "Mapping the Ocean Floor", meta: "Article · Science history", score: 89, image: "ocean", eyebrow: "The long project of making the invisible visible", summary: "The seafloor remained largely unknown long after maps made the continents familiar. Its eventual charting brought together sonar, careful measurement, and a willingness to revise old assumptions about the world beneath the waves.", reason: "You’re drawn to hidden systems and the patient work that makes them legible. This is a story about a vast, consequential system becoming understandable one signal at a time.", connection: "A map is never only a picture: it changes which questions people can ask and which risks they can see.", paths: ["Ocean worlds", "Measurement", "Invisible infrastructure"] },
  "air-traffic-control": { id: "air-traffic-control", kind: "Near certain", title: "The Quiet Precision of Air Traffic Control", meta: "Documentary · Aviation", score: 87, image: "apollo", eyebrow: "The people and systems that make a crowded sky workable", summary: "Air traffic control is a daily exercise in coordination under pressure. Its story reveals how procedure, judgment, and communication turn thousands of individual flights into a shared, moving system.", reason: "Your interest in aviation has been shifting toward the systems and decisions around the aircraft. This keeps the technical stakes while moving closer to the human coordination that makes flight possible.", connection: "The essential technology is not just radar. It is the agreement about how people use information together.", paths: ["Aviation systems", "Coordination", "Safety by design"] },
  "semiconductor-wars": { id: "semiconductor-wars", kind: "Adjacent", title: "The Semiconductor Wars", meta: "Article · Technology", score: 81, image: "chip", eyebrow: "How a tiny component became a geopolitical fault line", summary: "The modern semiconductor industry sits at the intersection of manufacturing, national ambition, and extremely precise systems. This is an accessible path into the strategic history behind a technology most of us never see.", reason: "You enjoy competition and technical turning points. This moves one step outward from the devices themselves, toward the systems and decisions around them.", connection: "The most interesting thread is how a supply chain can become a form of foreign policy.", paths: ["Industrial strategy", "Invisible infrastructure", "Technology competition"] },
  "invention-of-time-zones": { id: "invention-of-time-zones", kind: "Adjacent", title: "The Invention of Time Zones", meta: "Essay · History", score: 74, image: "japan", eyebrow: "How the world agreed on what time it was", summary: "Time zones look inevitable until you see the coordination problem they solved. Railways, telegraphs, commerce, and everyday life all depended on a shared convention that had to be invented, argued over, and maintained.", reason: "This connects your interest in infrastructure and turning points to a system so familiar it is almost invisible. It is a gentle step from machines toward the standards that let societies move together.", connection: "The remarkable part is that time zones are a social technology: a useful fiction that works because millions of people agree to inhabit it.", paths: ["Standards", "Railway history", "Shared systems"] },
  "japanese-craftsmanship": { id: "japanese-craftsmanship", kind: "Serendipity", title: "The Art of Japanese Craftsmanship", meta: "Video · Culture", score: 67, image: "japan", eyebrow: "Precision as a way of seeing", summary: "A contemplative look at Japanese makers whose practices turn patience, repetition, and close observation into extraordinary objects. It is less about product and more about attention.", reason: "Nuru is taking a gentle risk here: the same appreciation you show for elegant engineering may also be present in a different kind of craft.", connection: "Both engineering and craft rely on constraints—not as limits, but as a language for making better choices.", paths: ["Design philosophy", "Masters of process", "Culture and technology"] },
  "octopus-intelligence": { id: "octopus-intelligence", kind: "Wildcard", title: "The Secret Intelligence of Octopuses", meta: "Article · Nature", score: 58, image: "ocean", eyebrow: "A different way of being intelligent", summary: "Octopuses challenge easy ideas about what intelligence looks like. Their distributed nervous system, camouflage, and playful problem solving open a window on the weirdness of cognition.", reason: "This is intentionally outside your established map. It shares your interest in hidden systems, but asks you to encounter them in nature rather than technology.", connection: "The comparison is not that an octopus is a machine—it is that both can make us rethink where complexity actually lives.", paths: ["Animal minds", "Ocean worlds", "Unexpected systems"] },
};

export function getNuruDiscoveryDetail(id: string) {
  return discoveryDetails[id] ?? null;
}

export const tasteMap = [
  { label: "Technology turning points", score: 91 },
  { label: "Ingenious solutions", score: 84 },
  { label: "Hidden systems", score: 81 },
  { label: "True stories", score: 79 },
  { label: "Competition", score: 72 },
] as const;

export const tasteMapNodes = [
  { id: "technology-turning-points", label: "Technology turning points", score: 91, cluster: "Technology", x: 30, y: 28 },
  { id: "ingenious-solutions", label: "Ingenious solutions", score: 84, cluster: "Technology", x: 50, y: 19 },
  { id: "hidden-systems", label: "Hidden systems", score: 81, cluster: "Ideas", x: 64, y: 37 },
  { id: "true-stories", label: "True stories", score: 79, cluster: "History", x: 35, y: 61 },
  { id: "competition", label: "Competition", score: 72, cluster: "History", x: 58, y: 69 },
  { id: "human-ingenuity", label: "Human ingenuity", score: 76, cluster: "People", x: 78, y: 57 },
  { id: "unusual-perspectives", label: "Unusual perspectives", score: 65, cluster: "Culture", x: 20, y: 77 },
] as const;

export const tasteMapActionSchema = z.object({ type: z.enum(["confirm", "quiet"]), nodeId: z.string().min(1) });
export type TasteMapAction = z.infer<typeof tasteMapActionSchema>;

export const nuruActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("save-discovery"), discoveryId: z.string().min(1) }),
  z.object({ type: z.literal("dismiss-discovery"), discoveryId: z.string().min(1) }),
  z.object({ type: z.literal("notice-feedback"), value: z.enum(["explore", "not-really"]) }),
  z.object({ type: z.literal("set-affinity"), discoveryId: z.string().min(1), value: z.enum(["more", "less"]) }),
]);

export type NuruAction = z.infer<typeof nuruActionSchema>;

export type NuruPreferenceState = {
  savedDiscoveryIds: string[];
  dismissedDiscoveryIds: string[];
  noticeFeedback: "explore" | "not-really" | null;
  affinities: Record<string, "more" | "less">;
};

export type NuruRabbitHole = {
  id: string;
  title: string;
  subtitle: string;
  coverKey: string;
  steps: Array<{ id: string; position: number; title: string; description: string }>;
};

export const rabbitHoles: NuruRabbitHole[] = [{
  id: "race-for-supersonic-flight",
  title: "The Race for Supersonic Flight",
  subtitle: "From Concorde to the future of flight",
  coverKey: "supersonic",
  steps: [
    { id: "concorde", position: 1, title: "Concorde: a beautiful impossibility", description: "Start with the aircraft that made speed feel like a cultural project." },
    { id: "tu-144", position: 2, title: "The Soviet answer", description: "Meet the Tu-144 and the peculiar competition it created across the Iron Curtain." },
    { id: "cold-war-aerospace", position: 3, title: "Cold War aerospace", description: "Follow the politics, prestige, and technical rivalry behind the shape of the sky." },
    { id: "sonic-boom", position: 4, title: "The sonic boom problem", description: "See how one physical consequence became a social and regulatory constraint." },
    { id: "economics", position: 5, title: "Why the numbers mattered", description: "Explore the economics that made the dream difficult to sustain." },
    { id: "modern-revival", position: 6, title: "The modern revival", description: "Look at the new generation trying to learn from the first attempt." },
    { id: "what-speed-means", position: 7, title: "What speed is for", description: "End with the larger question: when is faster actually better?" },
  ],
}];

export function getNuruRabbitHole(id: string) {
  return rabbitHoles.find((rabbitHole) => rabbitHole.id === id) ?? null;
}

export const rabbitHoleActionSchema = z.object({ type: z.literal("toggle-step"), stepId: z.string().min(1) });
export type RabbitHoleAction = z.infer<typeof rabbitHoleActionSchema>;

export const emptyPreferences: NuruPreferenceState = {
  savedDiscoveryIds: [],
  dismissedDiscoveryIds: [],
  noticeFeedback: null,
  affinities: {},
};

export const nuruPreferencesSchema = z.object({
  savedDiscoveryIds: z.array(z.string()).max(50).default([]),
  dismissedDiscoveryIds: z.array(z.string()).max(50).default([]),
  noticeFeedback: z.enum(["explore", "not-really"]).nullable().default(null),
  affinities: z.record(z.string(), z.enum(["more", "less"])).default({}),
});

export const nuruGuestStateSchema = nuruPreferencesSchema.extend({
  rabbitHoleProgress: z.record(z.string(), z.array(z.string()).max(20)).default({}),
  tasteMapFeedback: z.record(z.string(), z.enum(["confirm", "quiet"])).default({}),
});

export type NuruGuestState = z.infer<typeof nuruGuestStateSchema>;

export function parseNuruPreferences(rawPreferences: string | undefined): NuruPreferenceState {
  if (!rawPreferences) return emptyPreferences;
  try {
    const parsed = nuruPreferencesSchema.safeParse(JSON.parse(rawPreferences));
    return parsed.success ? parsed.data : emptyPreferences;
  } catch {
    return emptyPreferences;
  }
}

export function parseNuruGuestState(rawPreferences: string | undefined): NuruGuestState {
  if (!rawPreferences) return { ...emptyPreferences, rabbitHoleProgress: {}, tasteMapFeedback: {} };
  try {
    const parsed = nuruGuestStateSchema.safeParse(JSON.parse(rawPreferences));
    return parsed.success ? parsed.data : { ...emptyPreferences, rabbitHoleProgress: {}, tasteMapFeedback: {} };
  } catch {
    return { ...emptyPreferences, rabbitHoleProgress: {}, tasteMapFeedback: {} };
  }
}

export function applyNuruAction(preferences: NuruPreferenceState, action: NuruAction): NuruPreferenceState {
  if (action.type === "notice-feedback") return { ...preferences, noticeFeedback: action.value };

  if (action.type === "set-affinity") return { ...preferences, affinities: { ...preferences.affinities, [action.discoveryId]: action.value } };

  const isSave = action.type === "save-discovery";
  const target = isSave ? "savedDiscoveryIds" : "dismissedDiscoveryIds";
  const opposite = isSave ? "dismissedDiscoveryIds" : "savedDiscoveryIds";
  const currentlyIncluded = preferences[target].includes(action.discoveryId);

  return {
    ...preferences,
    [target]: currentlyIncluded ? preferences[target].filter((id) => id !== action.discoveryId) : [...preferences[target], action.discoveryId],
    [opposite]: preferences[opposite].filter((id) => id !== action.discoveryId),
  };
}

export function buildNuruDashboard(preferences: NuruPreferenceState) {
  return {
    greeting: "Good morning. I found 7 things for you.",
    discoveries,
    tasteMap,
    preferences,
    featured: {
      id: "billion-dollar-spy",
      title: "The Billion Dollar Spy",
      matchScore: 86,
      reason: "You’ve repeatedly explored stories combining engineering, historical turning points, competition and unusual personalities. This has all four.",
    },
  };
}
