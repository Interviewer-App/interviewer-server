/*
  Warnings:

  - You are about to drop the column `userID` on the `Company` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('INTERVIEWER', 'HIRING_MANAGER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_userID_fkey";

-- DropIndex
DROP INDEX "Company_userID_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "userID";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "CompanyTeam" (
    "companyTeamId" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "teamRole" "TeamRole" NOT NULL,

    CONSTRAINT "CompanyTeam_pkey" PRIMARY KEY ("companyTeamId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTeam_userID_key" ON "CompanyTeam"("userID");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("companyID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTeam" ADD CONSTRAINT "CompanyTeam_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
