-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singer_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "contact_info" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" DATETIME,
    "location" TEXT,
    "budget" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_requests_singer_id_fkey" FOREIGN KEY ("singer_id") REFERENCES "singers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
