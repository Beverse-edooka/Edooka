import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * File: schema
 * Purpose: Declares all PostgreSQL tables for Edooka using Drizzle ORM.
 */
export const bundleType = pgEnum("bundle_type", ["single", "bundle3", "bundle5"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);
export const referralTrigger = pgEnum("referral_trigger", ["payment", "certificate_download"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    profession: text("profession"),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("idx_users_email").on(t.email),
    phoneIdx: index("idx_users_phone").on(t.phone),
  }),
);

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(15),
  numQuestions: integer("num_questions").notNull().default(15),
  passThreshold: integer("pass_threshold").notNull().default(50),
  iconName: text("icon_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: char("correct_option", { length: 1 }).notNull(),
  rationale: text("rationale"),
  orderIndex: integer("order_index"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id),
  questionIds: uuid("question_ids").array().notNull(),
  userAnswers: jsonb("user_answers"),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  passed: boolean("passed"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  nextRetryAllowedAt: timestamp("next_retry_allowed_at", { withTimezone: true }),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  bundleType: bundleType("bundle_type").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  cashfreeOrderId: text("cashfree_order_id").notNull().unique(),
  cashfreePaymentId: text("cashfree_payment_id").unique(),
  paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
  programsUnlocked: uuid("programs_unlocked").array(),
  attemptId: uuid("attempt_id").references(() => attempts.id),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => attempts.id),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  // Random hard-to-guess token encoded in the QR code. Optional for
  // backward compatibility with existing rows. The verify API accepts
  // either `certificateNumber` or `qrToken`.
  qrToken: text("qr_token").unique(),
  revoked: boolean("revoked").notNull().default(false),
  pdfUrl: text("pdf_url").notNull(),
  verificationUrl: text("verification_url").notNull(),
  /** Base64-encoded PNG stored at issue time. Served by /api/og/certificate/[certNumber]. */
  pngData: text("png_data"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveryQueue = pgTable("delivery_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  certificateId: uuid("certificate_id").references(() => certificates.id),
  emailSent: boolean("email_sent").notNull().default(false),
  whatsappSent: boolean("whatsapp_sent").notNull().default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  whatsappSentAt: timestamp("whatsapp_sent_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Server-side referral wallet keyed by referral code.
 * Coins are never trusted from localStorage.
 */
export const referralWallets = pgTable("referral_wallets", {
  referralCode: text("referral_code").primaryKey(),
  coins: integer("coins").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One award per (referralCode + referredEmail). This prevents duplicate coin farming
 * for the same referred learner across payment/download retries.
 */
export const referralEvents = pgTable(
  "referral_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referralCode: text("referral_code")
      .notNull()
      .references(() => referralWallets.referralCode, { onDelete: "cascade" }),
    referredEmail: text("referred_email").notNull(),
    trigger: referralTrigger("trigger").notNull(),
    purchaseId: text("purchase_id"),
    certificateNumber: text("certificate_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqReferrerReferred: index("idx_referral_events_refcode_email").on(t.referralCode, t.referredEmail),
    refCodeIdx: index("idx_referral_events_refcode").on(t.referralCode),
  })
);

/**
 * Coin spend ledger for referral wallet redemptions.
 * One spend record per attempt to prevent double-spend via refresh/retry.
 */
export const referralSpends = pgTable("referral_spends", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCode: text("referral_code")
    .notNull()
    .references(() => referralWallets.referralCode, { onDelete: "cascade" }),
  attemptId: text("attempt_id").notNull().unique(),
  coinsSpent: integer("coins_spent").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
