CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text DEFAULT 'چت جدید',
	"summary" text,
	"model_used" text DEFAULT 'auto',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"api_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" text,
	"username" text,
	"first_name" text,
	"last_name" text,
	"language_code" text,
	"photo_url" text,
	"phone_number" text,
	"is_premium" boolean DEFAULT false,
	"auth_source" text DEFAULT 'manual',
	"system_prompt" text DEFAULT 'تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه بده.',
	"default_model" text DEFAULT 'auto',
	"openrouter_model" text DEFAULT 'openrouter/free',
	"temperature" text DEFAULT '0.7',
	"memory_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;