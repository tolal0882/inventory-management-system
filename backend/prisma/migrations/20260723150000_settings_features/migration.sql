-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailDigest",
DROP COLUMN "emailNotifications",
ADD COLUMN     "auditLoggingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ipWhitelist" TEXT,
ADD COLUMN     "sessionTimeoutMinutes" INTEGER DEFAULT 30;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "lowStockThresholdPercent" INTEGER NOT NULL DEFAULT 20,
    "defaultCategory" TEXT NOT NULL DEFAULT 'Other',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
