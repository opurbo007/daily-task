/*
  Warnings:

  - You are about to drop the column `notifications` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "notifications",
ADD COLUMN     "notificationSettings" JSONB NOT NULL DEFAULT '{"browser": true, "telegram": true, "dailyReminder": true, "overdueAlert": true}';
