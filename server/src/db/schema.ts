import { pgTable, text, jsonb, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  schema: jsonb("schema").notNull().default("[]"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  surveyId: uuid("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  surveyVersion: integer("survey_version").notNull().default(1),
  answers: jsonb("answers").notNull(),
  respondentId: text("respondent_id"),
  isPartial: boolean("is_partial").notNull().default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default("{}"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

