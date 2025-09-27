-- Full Text Search support for Project (title, description, aiSummary, keywords)
-- Add tsvector column and index; create trigger for automatic updates.

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

CREATE INDEX IF NOT EXISTS project_search_idx ON "Project" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION project_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,'') || ' ' || coalesce(NEW."aiSummary",'') || ' ' || coalesce(NEW.keywords,''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_search_vector_t ON "Project";
CREATE TRIGGER project_search_vector_t BEFORE INSERT OR UPDATE ON "Project"
  FOR EACH ROW EXECUTE FUNCTION project_search_vector_update();

-- Backfill existing rows
UPDATE "Project" SET title = title; -- triggers update
