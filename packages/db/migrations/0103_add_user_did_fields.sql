DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'username') THEN
        ALTER TABLE "user" ADD COLUMN "username" text;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'user_did') THEN
        ALTER TABLE "user" ADD COLUMN "user_did" text;
    END IF;
END $$;

