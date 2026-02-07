-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'audience',
    "nickname" TEXT,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "singers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage_name" TEXT NOT NULL,
    "team_id" TEXT,
    "qr_code_pattern" TEXT,
    "social_links" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "fan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "singers_id_fkey" FOREIGN KEY ("id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "youtube_url" TEXT,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "songs_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performances" (
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
    "chat_cost_per_hour" INTEGER NOT NULL DEFAULT 0,
    "expected_audience" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performances_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_songs" (
    "performance_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("performance_id", "song_id"),
    CONSTRAINT "performance_songs_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
