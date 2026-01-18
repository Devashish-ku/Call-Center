import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table - admin and employees
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'admin' or 'employee'
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

// Call logs table
export const callLogs = sqliteTable('call_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  callDate: text('call_date').notNull(),
  callTime: text('call_time').notNull(),
  status: text('status').notNull(), // 'connected', 'not_answered', 'not_connected'
  duration: integer('duration'), // duration in seconds
  customerPhone: text('customer_phone'),
  notes: text('notes'),
  providerCallId: text('provider_call_id'),
  fromNumber: text('from_number'),
  toNumber: text('to_number'),
  createdAt: text('created_at').notNull(),
});

// Data sharing table
export const dataSharing = sqliteTable('data_sharing', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: integer('admin_id').notNull().references(() => users.id),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  sharedDataType: text('shared_data_type').notNull(), // 'call_logs', 'reports', 'announcement', 'file'
  sharedData: text('shared_data', { mode: 'json' }), // JSON string containing the shared data
  message: text('message'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Files table for file sharing
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // file size in bytes
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  filePath: text('file_path').notNull(), // path to file on server
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

// Download logs table for tracking file and data downloads
export const downloadLogs = sqliteTable('download_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  downloadType: text('download_type').notNull(), // 'file', 'data_export', 'call_logs'
  resourceId: integer('resource_id'), // ID of the file or data sharing record
  resourceName: text('resource_name').notNull(), // name of downloaded resource
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  downloadedAt: text('downloaded_at').notNull(),
});

// Phone endpoints mapping for automatic employee resolution
export const phoneEndpoints = sqliteTable('phone_endpoints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull(), // 'twilio', 'plivo', 'asterisk'
  endpoint: text('endpoint').notNull(), // DID, SIP URI, extension
  employeeId: integer('employee_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  assignedEmployeeId: integer('assigned_employee_id').references(() => users.id),
  callStatus: text('call_status'),
  callTime: text('call_time'),
  callDurationSec: integer('call_duration_sec'),
  sourceFileId: integer('source_file_id').references(() => files.id),
  createdAt: text('created_at').notNull(),
});