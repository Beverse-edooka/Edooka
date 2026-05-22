export const COMPANY_NAME = "edooka";
export const COMPANY_ADDRESS = "Galaxy, Residency Rd, Bengaluru-25, India";
export const COMPANY_PHONE = "+91 9048048509";
export const SUPPORT_EMAIL = "support@edooka.in";

export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "https://www.instagram.com/edooka",
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "https://www.linkedin.com/company/edooka",
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "https://www.facebook.com/edooka",
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER ?? "https://x.com/edooka",
} as const;
