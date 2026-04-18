-- CreateEnum
CREATE TYPE "NGORequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local';

-- CreateTable
CREATE TABLE "NGORequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "proofDocumentUrl" TEXT,
    "status" "NGORequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NGORequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NGORequest_userId_idx" ON "NGORequest"("userId");

-- CreateIndex
CREATE INDEX "NGORequest_status_idx" ON "NGORequest"("status");

-- CreateIndex
CREATE INDEX "NGORequest_createdAt_idx" ON "NGORequest"("createdAt");

-- CreateIndex
CREATE INDEX "User_provider_idx" ON "User"("provider");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");

-- AddForeignKey
ALTER TABLE "NGORequest" ADD CONSTRAINT "NGORequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
