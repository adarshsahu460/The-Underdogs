/*
  Warnings:

  - You are about to drop the column `searchVector` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX IF EXISTS "project_search_idx";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN IF EXISTS "searchVector";
