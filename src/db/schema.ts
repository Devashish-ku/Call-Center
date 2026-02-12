import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").notNull(), // e.g. 'admin' | 'employee'
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
});

export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  description: text("description"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const callLogs = sqliteTable("call_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id").references(() => contacts.id),
  userId: integer("user_id").references(() => users.id),
  type: text("type"), // 'inbound' | 'outbound'
  duration: integer("duration"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const dataSharing = sqliteTable("data_sharing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileId: integer("file_id").references(() => files.id),
  sharedWithEmail: text("shared_with_email").notNull(),
  sharedBy: integer("shared_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
});
