import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quotes table
export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id')
    .references(() => clients.id, { onDelete: 'cascade' })
    .notNull(),
  service: text('service').notNull(),
  budget: text('budget'),
  description: text('description'),
  totalEst: integer('total_est'),
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'approved' | 'rejected'
  materials: text('materials'), // JSON stringified material items
  createdAt: timestamp('created_at').defaultNow(),
});

// Client Files table (for project history files)
export const clientFiles = pgTable('client_files', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id')
    .references(() => clients.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: text('file_size').notNull(),
  fileType: text('file_type'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes),
  files: many(clientFiles),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
}));

export const clientFilesRelations = relations(clientFiles, ({ one }) => ({
  client: one(clients, {
    fields: [clientFiles.clientId],
    references: [clients.id],
  }),
}));
