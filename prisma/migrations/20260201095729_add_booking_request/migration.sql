-- CreateTable
CREATE TABLE "song_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "song_requests_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
