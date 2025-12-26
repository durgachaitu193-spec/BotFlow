CREATE TABLE IF NOT EXISTS "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"agent_wallet" text NOT NULL,
	"owner_wallet" text NOT NULL,
	"user_did" text,
	"deployment_type" text NOT NULL,
	"metadata" json NOT NULL,
	"transaction_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_user_id_workflow_id_fk') THEN
        ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_workflow_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_workflow_id_workflow_id_fk') THEN
        ALTER TABLE "agent" ADD CONSTRAINT "agent_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_agent_id_unique') THEN
        ALTER TABLE "agent" ADD CONSTRAINT "agent_agent_id_unique" UNIQUE("agent_id");
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_user_id_idx" ON "agent" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_workflow_id_idx" ON "agent" ("workflow_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_agent_id_idx" ON "agent" ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_owner_wallet_idx" ON "agent" ("owner_wallet");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_user_did_idx" ON "agent" ("user_did");

