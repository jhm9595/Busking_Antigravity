-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_performances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location_text" TEXT NOT NULL,
    "location_lat" REAL,
    "location_lng" REAL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "description" TEXT,
    "chat_enabled" BOOLEAN NOT NULL DEFAULT false,
    "streaming_enabled" BOOLEAN NOT NULL DEFAULT false,
    "chat_cost_per_hour" INTEGER NOT NULL DEFAULT 0,
    "expected_audience" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performances_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_performances" ("chat_cost_per_hour", "chat_enabled", "created_at", "description", "end_time", "expected_audience", "id", "location_lat", "location_lng", "location_text", "singer_id", "start_time", "status", "title") SELECT "chat_cost_per_hour", "chat_enabled", "created_at", "description", "end_time", "expected_audience", "id", "location_lat", "location_lng", "location_text", "singer_id", "start_time", "status", "title" FROM "performances";
DROP TABLE "performances";
ALTER TABLE "new_performances" RENAME TO "performances";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
