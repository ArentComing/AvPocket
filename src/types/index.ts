export type AssetType = "PLUGIN" | "VIRION" | "MAP" | "MODEL" | "CONFIG";
export type PricingType = "FREE" | "PREMIUM";
export type AssetStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type ReleaseChannel = "STABLE" | "BETA" | "DEV";
export type UserRole = "USER" | "DEVELOPER" | "ADMIN";

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  walletBalance: number;
  githubUsername: string | null;
  createdAt: string;
}

export interface AssetSummary {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  type: AssetType;
  pricingType: PricingType;
  price: number;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
  totalDownloads: number;
  ratingAvg: number;
  ratingCount: number;
  latestVersion?: string;
  targetApi?: string | null;
  createdAt: string;
}
