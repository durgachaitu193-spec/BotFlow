CREATE TABLE IF NOT EXISTS "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"agent_wallet" text NOT NULL,
	"agent_did" text,
	"owner_wallet" text NOT NULL,
	"user_did" text,
	"deployment_type" text NOT NULL,
	"chat_id" text,
	"metadata" json NOT NULL,
	"transaction_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launchpad_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"token_id" text NOT NULL,
	"address" text NOT NULL,
	"message" text NOT NULL,
	"img" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launchpad_holdings" (
	"wallet_address" text NOT NULL,
	"token_id" text NOT NULL,
	"balance" text DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launchpad_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"description" text NOT NULL,
	"logo" text NOT NULL,
	"twitter" text,
	"telegram" text,
	"website" text,
	"network" text NOT NULL,
	"created_by" text NOT NULL,
	"supply" text DEFAULT '0' NOT NULL,
	"reserve_balance" text DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"tx_hash" text,
	"mnemonic" text,
	"hydradx_id" text,
	"ipfs_hash" text,
	"token_address" text,
	"current_price" text DEFAULT '0' NOT NULL,
	"trade_disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launchpad_transactions" (
	"tx_hash" text PRIMARY KEY NOT NULL,
	"token_id" text NOT NULL,
	"symbol" text NOT NULL,
	"amount" text NOT NULL,
	"value" text NOT NULL,
	"current_price" text NOT NULL,
	"type" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"user_address_tx_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "deployment_payment_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "deployment_payment_paid_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent" ADD CONSTRAINT "agent_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent" ADD CONSTRAINT "agent_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launchpad_comments" ADD CONSTRAINT "launchpad_comments_token_id_launchpad_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."launchpad_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launchpad_holdings" ADD CONSTRAINT "launchpad_holdings_token_id_launchpad_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."launchpad_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "launchpad_transactions" ADD CONSTRAINT "launchpad_transactions_token_id_launchpad_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."launchpad_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_user_id_idx" ON "agent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_workflow_id_idx" ON "agent" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_agent_id_idx" ON "agent" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_owner_wallet_idx" ON "agent" USING btree ("owner_wallet");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_user_did_idx" ON "agent" USING btree ("user_did");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_agent_did_idx" ON "agent" USING btree ("agent_did");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_chat_id_idx" ON "agent" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_comments_token_id_idx" ON "launchpad_comments" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_comments_address_idx" ON "launchpad_comments" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_comments_created_at_idx" ON "launchpad_comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "launchpad_holdings_pk" ON "launchpad_holdings" USING btree ("wallet_address","token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_holdings_wallet_address_idx" ON "launchpad_holdings" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_holdings_token_id_idx" ON "launchpad_holdings" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_tokens_created_by_idx" ON "launchpad_tokens" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_tokens_network_idx" ON "launchpad_tokens" USING btree ("network");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_tokens_active_idx" ON "launchpad_tokens" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_transactions_token_id_idx" ON "launchpad_transactions" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_transactions_from_idx" ON "launchpad_transactions" USING btree ("from");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_transactions_to_idx" ON "launchpad_transactions" USING btree ("to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_transactions_type_idx" ON "launchpad_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launchpad_transactions_created_at_idx" ON "launchpad_transactions" USING btree ("created_at");