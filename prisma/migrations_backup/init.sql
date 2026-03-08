-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'audience',
    "nickname" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "singers" (
    "id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "team_id" TEXT,
    "qr_code_pattern" TEXT,
    "social_links" TEXT,
    "bio" TEXT,
    "hair_color" TEXT,
    "top_color" TEXT,
    "bottom_color" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "fan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "singers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "singer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "youtube_url" TEXT,
    "tags" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_repertoire" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performances" (
    "id" TEXT NOT NULL,
    "singer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location_text" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "description" TEXT,
    "chat_enabled" BOOLEAN NOT NULL DEFAULT false,
    "streaming_enabled" BOOLEAN NOT NULL DEFAULT false,
    "chat_cost_per_hour" INTEGER NOT NULL DEFAULT 0,
    "expected_audience" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_capacity" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_songs" (
    "performance_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "performance_songs_pkey" PRIMARY KEY ("performance_id","song_id")
);

-- CreateTable
CREATE TABLE "song_requests" (
    "id" TEXT NOT NULL,
    "performance_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requester_name" TEXT NOT NULL DEFAULT 'Anonymous',

    CONSTRAINT "song_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "singer_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "contact_info" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" TIMESTAMP(3),
    "location" TEXT,
    "budget" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "singer_id" TEXT NOT NULL,
    "fan_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_singer_id_fan_id_key" ON "follows"("singer_id", "fan_id");

-- AddForeignKey
ALTER TABLE "singers" ADD CONSTRAINT "singers_id_fkey" FOREIGN KEY ("id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performances" ADD CONSTRAINT "performances_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_songs" ADD CONSTRAINT "performance_songs_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_songs" ADD CONSTRAINT "performance_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_requests" ADD CONSTRAINT "song_requests_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

