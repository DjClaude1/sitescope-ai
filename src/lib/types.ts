export type Severity = "critical" | "warning" | "info";

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  impact: string;
  recommendation: string;
  category: AuditCategoryKey;
}

export type AuditCategoryKey =
  | "seo"
  | "performance"
  | "accessibility"
  | "conversion"
  | "content";

export interface CategoryScore {
  category: AuditCategoryKey;
  score: number; // 0-100
  summary: string;
}

export interface AuditReport {
  id: string;
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  fetchedAt: string;
  overallScore: number;
  scores: CategoryScore[];
  issues: AuditIssue[];
  quickWins: string[];
  competitorNote?: string;
  aiSummary: string;
  signals: PageSignals;
}

export interface PageSignals {
  statusCode: number;
  htmlSize: number;
  loadTimeMs: number;
  wordCount: number;
  headings: { level: number; text: string }[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string | null;
  canonical: string | null;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  viewport: string | null;
  favicon: string | null;
  imagesTotal: number;
  imagesMissingAlt: number;
  linksInternal: number;
  linksExternal: number;
  linksNofollow: number;
  formsCount: number;
  scriptsCount: number;
  stylesheetsCount: number;
  inlineStylesCount: number;
  hasHttps: boolean;
  hasSchemaOrg: boolean;
  hasRobotsMeta: boolean;
  hasLangAttr: boolean;
  hasH1: boolean;
  hasGoogleAnalytics: boolean;
  hasMetaPixel: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  ctaButtons: string[];
  phoneNumbers: string[];
  emails: string[];
  socialLinks: string[];
}
