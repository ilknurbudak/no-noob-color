export type ArticleSection =
  | { type: "prose"; body: string }
  | { type: "demo"; component: "lab" | "contrast" | "hue" | "gamut" }
  | { type: "quote"; body: string; cite?: string };

export interface ArticleSource {
  title: string;
  url: string;
  blurb?: string;
}

export type ArticleKind = "deep" | "tip";

export interface Article {
  slug: string;
  eyebrow: string;
  title: string;
  lead: string;
  readingTime: string;
  sections: ArticleSection[];
  sources: ArticleSource[];
  kind?: ArticleKind;     // 'deep' (default, full article) or 'tip' (short)
}
