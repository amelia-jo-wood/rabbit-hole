export type InterestId =
  | "weird-stuff"
  | "true-crime"
  | "diy-build"
  | "lost-history"
  | "weird-food"
  | "tech-anomalies"
  | "deep-space"
  | "subcultures";

export interface Interest {
  id: InterestId;
  label: string;
  sublabel: string;
  icon: string;
}

export const INTERESTS: Interest[] = [
  { id: "weird-stuff", label: "Weird Stuff", sublabel: "UFOs, cryptids & cults", icon: "🛸" },
  { id: "true-crime", label: "True Crime", sublabel: "Heists & serial cases", icon: "🕵️" },
  { id: "diy-build", label: "DIY & Build", sublabel: "Decks, woodworking & solar", icon: "🔨" },
  { id: "lost-history", label: "Lost History", sublabel: "Forgotten empires & wars", icon: "📜" },
  { id: "weird-food", label: "Weird Food", sublabel: "Fermentation & food science", icon: "🍲" },
  { id: "tech-anomalies", label: "Tech Anomalies", sublabel: "Internet mysteries & AI", icon: "💻" },
  { id: "deep-space", label: "Deep Space", sublabel: "Black holes & quantum mechanics", icon: "🪐" },
  { id: "subcultures", label: "Subcultures", sublabel: "Skaters, hackers & rollers", icon: "🛹" },
];

export type DepthId = "casual" | "explorer" | "scholar";

export interface DepthOption {
  id: DepthId;
  label: string;
  timeLabel: string;
  badge: string;
  description: string;
  chapterCount: number;
}

export const DEPTHS: DepthOption[] = [
  {
    id: "casual",
    label: "Casual Snacker",
    timeLabel: "5 min read",
    badge: "QUICK",
    description:
      "Perfect for reading in the bathroom. Gives you a single quick concept with a high-level overview.",
    chapterCount: 1,
  },
  {
    id: "explorer",
    label: "The Explorer",
    timeLabel: "15 min read",
    badge: "POPULAR",
    description:
      "Detailed breakdown. Multiple chapters covering the core history, dynamic graphics, and the best sources.",
    chapterCount: 4,
  },
  {
    id: "scholar",
    label: "Deeply Obsessed",
    timeLabel: "45+ min deep dive",
    badge: "SCHOLAR",
    description:
      "No stone left unturned. Deep underground history, conspiracies, rare podcasts, and full reading lists.",
    chapterCount: 6,
  },
];

export function getDepth(id: DepthId): DepthOption {
  return DEPTHS.find((d) => d.id === id) ?? DEPTHS[1];
}

export interface Chapter {
  heading: string;
  meta: string;
  content: string;
}

export interface Topic {
  id: string;
  title: string;
  teaser: string;
  heroTag: string;
  synthesisThreads: string[];
  depth: DepthId;
  interestLabels: string[];
  createdAt: string;
}

export interface RabbitHole {
  topic: Topic;
  chapters: Chapter[];
}

export type SourceType = "video" | "article" | "podcast";

export interface SourceItem {
  type: SourceType;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface HistoryEntry {
  topic: Topic;
  chapters: Chapter[] | null;
  sources: SourceItem[] | null;
  readChapters: number[];
  savedSources: number[];
}
