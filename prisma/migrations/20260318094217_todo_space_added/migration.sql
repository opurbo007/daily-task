-- CreateEnum
CREATE TYPE "SpaceCardType" AS ENUM ('BOOKMARK', 'NOTE', 'CODE', 'OTHER');

-- CreateTable
CREATE TABLE "space_cards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SpaceCardType" NOT NULL DEFAULT 'NOTE',
    "content" TEXT,
    "url" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "space_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "space_cards_userId_type_idx" ON "space_cards"("userId", "type");

-- AddForeignKey
ALTER TABLE "space_cards" ADD CONSTRAINT "space_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
