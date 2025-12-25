DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'username') THEN
        ALTER TABLE "user" DROP COLUMN "username";
    END IF;
END $$;

