/*
  Warnings:

  - You are about to alter the column `embedding` on the `NoteEmbedding` table. The data in that column could be lost. The data in that column will be cast from `JsonB` to `Unsupported("vector(1536)")`.

*/
-- AlterTable
ALTER TABLE "NoteEmbedding" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);
