/*
  Warnings:

  - You are about to alter the column `searchVector` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("tsvector")` to `Text`.

*/
-- DropIndex
DROP INDEX "project_search_idx";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "searchVector" SET DATA TYPE TEXT;
