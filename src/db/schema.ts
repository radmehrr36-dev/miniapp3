import { pgTable, text, serial, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  languageCode: text('language_code'),
  photoUrl: text('photo_url'),
  phoneNumber: text('phone_number'),
  isPremium: boolean('is_premium').default(false),
  authSource: text('auth_source').default('manual'), // 'telegram' | 'manual'
  systemPrompt: text('system_prompt').default("تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه بده."),
  defaultModel: text('default_model').default("auto"),
  openrouterModel: text('openrouter_model').default("openrouter/free"),
  temperature: text('temperature').default("0.7"),
  memoryEnabled: boolean('memory_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').default("چت جدید"),
  summary: text('summary'),
  modelUsed: text('model_used').default("auto"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  apiUsed: text('api_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  chatSessions: many(chatSessions),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id],
  }),
}));
