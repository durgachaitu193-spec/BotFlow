CREATE TABLE "template_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"transaction_hash" text,
	"amount" text,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_purchases_user_id_idx" ON "template_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "template_purchases_template_id_idx" ON "template_purchases" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_purchases_user_template_idx" ON "template_purchases" USING btree ("user_id","template_id");