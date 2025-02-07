-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'ADMIN', 'INTERVIEWER', 'COMPANY');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('OFFERED', 'REJECTED', 'APPLIED', 'INTERVIEWSCHEDULED');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('TECHNICAL', 'BEHAVIORAL');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('INTERVIEWER', 'HIRING_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('PENDING', 'COMPLETED', 'ARCHIVED', 'ACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "interviewCategory" AS ENUM ('Technical', 'Behavioural');

-- CreateEnum
CREATE TYPE "interviewStatus" AS ENUM ('toBeConducted', 'ongoing', 'completed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('OPEN_ENDED', 'CODING');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "dob" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "gender" TEXT,
    "contactNo" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "provider" TEXT,
    "providerAccountId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "profileID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "skillHighlights" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'APPLIED',
    "resumeURL" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isSurveyCompleted" BOOLEAN NOT NULL DEFAULT false,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "discordUrl" TEXT,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("profileID")
);

-- CreateTable
CREATE TABLE "CandidateAnalysis" (
    "id" TEXT NOT NULL,
    "candidateID" TEXT NOT NULL,
    "summary" TEXT,
    "skills" TEXT[],
    "experience" TEXT[],
    "education" TEXT[],
    "contactInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateServey" (
    "serveyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT[],
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "CandidateServey_pkey" PRIMARY KEY ("serveyId")
);

-- CreateTable
CREATE TABLE "Admin" (
    "adminID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "permitions" TEXT NOT NULL,
    "logs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("adminID")
);

-- CreateTable
CREATE TABLE "Interviewer" (
    "interviewerID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "companyID" TEXT NOT NULL,
    "interviewFormat" "InterviewFormat" NOT NULL DEFAULT 'TECHNICAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interviewer_pkey" PRIMARY KEY ("interviewerID")
);

-- CreateTable
CREATE TABLE "Company" (
    "companyID" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyDescription" TEXT,
    "websiteURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isSurveyCompleted" BOOLEAN NOT NULL DEFAULT false,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "discordUrl" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("companyID")
);

-- CreateTable
CREATE TABLE "CompanyTeam" (
    "companyTeamId" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "teamRole" "TeamRole" NOT NULL,

    CONSTRAINT "CompanyTeam_pkey" PRIMARY KEY ("companyTeamId")
);

-- CreateTable
CREATE TABLE "CompanyServey" (
    "serveyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT[],
    "companyId" TEXT NOT NULL,

    CONSTRAINT "CompanyServey_pkey" PRIMARY KEY ("serveyId")
);

-- CreateTable
CREATE TABLE "Interview" (
    "interviewID" TEXT NOT NULL,
    "interviewCategory" "interviewCategory" NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT,
    "requiredSkills" TEXT,
    "companyID" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("interviewID")
);

-- CreateTable
CREATE TABLE "InterviewQuestions" (
    "interviewQuestionID" TEXT NOT NULL,
    "interviewID" TEXT NOT NULL,
    "questionCategory" TEXT,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "estimatedTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "aiContext" TEXT,
    "diffcultyLevel" TEXT,
    "type" "QuestionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageFrequency" INTEGER,

    CONSTRAINT "InterviewQuestions_pkey" PRIMARY KEY ("interviewQuestionID")
);

-- CreateTable
CREATE TABLE "InterviewerOnInterviews" (
    "interviewerId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,

    CONSTRAINT "InterviewerOnInterviews_pkey" PRIMARY KEY ("interviewerId","interviewId")
);

-- CreateTable
CREATE TABLE "CandidateOnInterviews" (
    "candidateId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,

    CONSTRAINT "CandidateOnInterviews_pkey" PRIMARY KEY ("candidateId","interviewId")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "sessionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assesmentId" TEXT,
    "feedbackId" TEXT,
    "interviewCategory" "interviewCategory" NOT NULL,
    "interviewId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "interviewStatus" "interviewStatus" NOT NULL,
    "score" DOUBLE PRECISION DEFAULT 0,
    "timeConsumed" INTEGER DEFAULT 0,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "feedbackId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("feedbackId")
);

-- CreateTable
CREATE TABLE "Scheduling" (
    "scheduleID" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "candidateId" TEXT,
    "sessionID" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reminderSentToInterviewer" BOOLEAN,
    "reminderSentToCandidate" BOOLEAN,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "notificationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheduling_pkey" PRIMARY KEY ("scheduleID")
);

-- CreateTable
CREATE TABLE "Question" (
    "questionID" TEXT NOT NULL,
    "sessionID" TEXT NOT NULL,
    "questionCategory" TEXT,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "aiContext" TEXT,
    "diffcultyLevel" TEXT,
    "type" "QuestionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageFrequency" INTEGER,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("questionID")
);

-- CreateTable
CREATE TABLE "score" (
    "scoreID" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "score_pkey" PRIMARY KEY ("scoreID")
);

-- CreateTable
CREATE TABLE "Answer" (
    "responseID" TEXT NOT NULL,
    "sessionID" TEXT NOT NULL,
    "questionID" TEXT NOT NULL,
    "candidateID" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "responseTime" TIMESTAMP(3) NOT NULL,
    "languageDetected" TEXT NOT NULL,
    "sentimentAnalysis" TEXT,
    "keywordExtracted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "comparisonID" TEXT,
    "assessmentID" TEXT,
    "reviewID" TEXT,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("responseID")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "CategoryAssignment" (
    "assignmentId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryAssignment_pkey" PRIMARY KEY ("assignmentId")
);

-- CreateTable
CREATE TABLE "SubCategoryAssignment" (
    "id" TEXT NOT NULL,
    "parentAssignmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategoryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryScore" (
    "categoryScoreId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER,
    "assignmentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryScore_pkey" PRIMARY KEY ("categoryScoreId")
);

-- CreateTable
CREATE TABLE "SubCategoryScore" (
    "id" TEXT NOT NULL,
    "categoryScoreId" TEXT NOT NULL,
    "subAssignmentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategoryScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateInvitation" (
    "invitationID" TEXT NOT NULL,
    "candidateID" TEXT NOT NULL,
    "interviewID" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateInvitation_pkey" PRIMARY KEY ("invitationID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_userID_key" ON "Candidate"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAnalysis_candidateID_key" ON "CandidateAnalysis"("candidateID");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userID_key" ON "Admin"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "Interviewer_userID_key" ON "Interviewer"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTeam_userID_key" ON "CompanyTeam"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_interviewId_candidateId_key" ON "InterviewSession"("interviewId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Scheduling_sessionID_key" ON "Scheduling"("sessionID");

-- CreateIndex
CREATE UNIQUE INDEX "Scheduling_interviewId_candidateId_key" ON "Scheduling"("interviewId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "score_responseId_key" ON "score"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionID_key" ON "Answer"("questionID");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAssignment_interviewId_categoryId_key" ON "CategoryAssignment"("interviewId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryScore_sessionId_assignmentId_key" ON "CategoryScore"("sessionId", "assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategoryScore_categoryScoreId_subAssignmentId_key" ON "SubCategoryScore"("categoryScoreId", "subAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInvitation_scheduleId_key" ON "CandidateInvitation"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInvitation_candidateID_interviewID_key" ON "CandidateInvitation"("candidateID", "interviewID");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("companyID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAnalysis" ADD CONSTRAINT "CandidateAnalysis_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateServey" ADD CONSTRAINT "CandidateServey_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interviewer" ADD CONSTRAINT "Interviewer_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interviewer" ADD CONSTRAINT "Interviewer_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "Company"("companyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTeam" ADD CONSTRAINT "CompanyTeam_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyServey" ADD CONSTRAINT "CompanyServey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("companyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_companyID_fkey" FOREIGN KEY ("companyID") REFERENCES "Company"("companyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestions" ADD CONSTRAINT "InterviewQuestions_interviewID_fkey" FOREIGN KEY ("interviewID") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewerOnInterviews" ADD CONSTRAINT "InterviewerOnInterviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "Interviewer"("interviewerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewerOnInterviews" ADD CONSTRAINT "InterviewerOnInterviews_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateOnInterviews" ADD CONSTRAINT "CandidateOnInterviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateOnInterviews" ADD CONSTRAINT "CandidateOnInterviews_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduling" ADD CONSTRAINT "Scheduling_sessionID_fkey" FOREIGN KEY ("sessionID") REFERENCES "InterviewSession"("sessionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduling" ADD CONSTRAINT "Scheduling_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduling" ADD CONSTRAINT "Scheduling_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("profileID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionID_fkey" FOREIGN KEY ("sessionID") REFERENCES "InterviewSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Answer"("responseID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionID_fkey" FOREIGN KEY ("questionID") REFERENCES "Question"("questionID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionID_fkey" FOREIGN KEY ("sessionID") REFERENCES "InterviewSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("companyID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAssignment" ADD CONSTRAINT "CategoryAssignment_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAssignment" ADD CONSTRAINT "CategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategoryAssignment" ADD CONSTRAINT "SubCategoryAssignment_parentAssignmentId_fkey" FOREIGN KEY ("parentAssignmentId") REFERENCES "CategoryAssignment"("assignmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryScore" ADD CONSTRAINT "CategoryScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryScore" ADD CONSTRAINT "CategoryScore_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CategoryAssignment"("assignmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategoryScore" ADD CONSTRAINT "SubCategoryScore_categoryScoreId_fkey" FOREIGN KEY ("categoryScoreId") REFERENCES "CategoryScore"("categoryScoreId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategoryScore" ADD CONSTRAINT "SubCategoryScore_subAssignmentId_fkey" FOREIGN KEY ("subAssignmentId") REFERENCES "SubCategoryAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInvitation" ADD CONSTRAINT "CandidateInvitation_candidateID_fkey" FOREIGN KEY ("candidateID") REFERENCES "Candidate"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInvitation" ADD CONSTRAINT "CandidateInvitation_interviewID_fkey" FOREIGN KEY ("interviewID") REFERENCES "Interview"("interviewID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInvitation" ADD CONSTRAINT "CandidateInvitation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Scheduling"("scheduleID") ON DELETE RESTRICT ON UPDATE CASCADE;
