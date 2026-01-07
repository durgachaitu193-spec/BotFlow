ALTER TABLE "user" ADD COLUMN "user_did" text;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD COLUMN "deployment_version_id" text;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD COLUMN "status" text DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_deployment_version_id_workflow_deployment_version_id_fk" FOREIGN KEY ("deployment_version_id") REFERENCES "public"."workflow_deployment_version"("id") ON DELETE no action ON UPDATE no action;