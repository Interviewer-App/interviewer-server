-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "discordUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedInUrl" TEXT,
ADD COLUMN     "twitterUrl" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "discordUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedInUrl" TEXT,
ADD COLUMN     "twitterUrl" TEXT;
