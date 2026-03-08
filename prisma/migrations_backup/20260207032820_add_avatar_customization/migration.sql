-- AlterTable
ALTER TABLE "singers" ADD COLUMN "bio" TEXT;

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singer_id" TEXT NOT NULL,
    "fan_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_singer_id_fan_id_key" ON "follows"("singer_id", "fan_id");
