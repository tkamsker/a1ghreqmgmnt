-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE', 'GITHUB', 'OIDC', 'SAML');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPER_ADMIN', 'PROJECT_ADMIN', 'CONTRIBUTOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SolutionStatus" AS ENUM ('DRAFT', 'DESIGNING', 'IMPLEMENTING', 'DONE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('BACKEND', 'FRONTEND', 'DEVOPS', 'QA', 'DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('SATISFIES', 'IMPLEMENTS', 'REFINES');

-- CreateEnum
CREATE TYPE "IterationStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('MANUAL', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "TestRunStatus" AS ENUM ('PASSED', 'FAILED', 'BLOCKED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AttachedToType" AS ENUM ('REQUIREMENT', 'SOLUTION', 'TASK', 'TEST', 'PROJECT');

-- CreateEnum
CREATE TYPE "ImportExportType" AS ENUM ('REQIF_IMPORT', 'REQIF_EXPORT', 'MD_IMPORT', 'MD_EXPORT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "longName" TEXT NOT NULL,
    "email" TEXT,
    "loginType" "LoginType" NOT NULL,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "projectTypeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_groups" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subjectId" TEXT,
    "parentRequirementId" TEXT,
    "currentVersionId" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_versions" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "rationale" TEXT,
    "tags" TEXT[],
    "deltaNotes" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solutions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentSolutionId" TEXT,
    "currentVersionId" TEXT,
    "status" "SolutionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_versions" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "architectureNotes" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solution_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_solution_links" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL DEFAULT 'SATISFIES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_solution_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_versions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "estimate" DOUBLE PRECISION,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iterations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iterationIndex" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "IterationStatus" NOT NULL DEFAULT 'PLANNED',
    "goals" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iterations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iteration_items" (
    "id" TEXT NOT NULL,
    "iterationId" TEXT NOT NULL,
    "taskId" TEXT,
    "requirementId" TEXT,
    "statusOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iteration_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TestType" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "iterationId" TEXT,
    "status" "TestRunStatus" NOT NULL,
    "notes" TEXT,
    "executedBy" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_test_links" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_test_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_test_links" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solution_test_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "attachedToType" "AttachedToType" NOT NULL,
    "attachedToId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ImportExportType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "sourceS3Key" TEXT,
    "resultS3Key" TEXT,
    "log" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "import_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_types_name_key" ON "project_types"("name");

-- CreateIndex
CREATE INDEX "projects_isActive_idx" ON "projects"("isActive");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "project_groups_projectId_idx" ON "project_groups"("projectId");

-- CreateIndex
CREATE INDEX "project_groups_orderIndex_idx" ON "project_groups"("orderIndex");

-- CreateIndex
CREATE INDEX "subjects_projectId_idx" ON "subjects"("projectId");

-- CreateIndex
CREATE INDEX "subjects_groupId_idx" ON "subjects"("groupId");

-- CreateIndex
CREATE INDEX "subjects_orderIndex_idx" ON "subjects"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_currentVersionId_key" ON "requirements"("currentVersionId");

-- CreateIndex
CREATE INDEX "requirements_projectId_idx" ON "requirements"("projectId");

-- CreateIndex
CREATE INDEX "requirements_subjectId_idx" ON "requirements"("subjectId");

-- CreateIndex
CREATE INDEX "requirements_status_idx" ON "requirements"("status");

-- CreateIndex
CREATE INDEX "requirements_createdAt_idx" ON "requirements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_projectId_uid_key" ON "requirements"("projectId", "uid");

-- CreateIndex
CREATE INDEX "requirement_versions_requirementId_idx" ON "requirement_versions"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_versions_createdAt_idx" ON "requirement_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_versions_requirementId_versionNumber_key" ON "requirement_versions"("requirementId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "solutions_currentVersionId_key" ON "solutions"("currentVersionId");

-- CreateIndex
CREATE INDEX "solutions_projectId_idx" ON "solutions"("projectId");

-- CreateIndex
CREATE INDEX "solutions_status_idx" ON "solutions"("status");

-- CreateIndex
CREATE INDEX "solutions_createdAt_idx" ON "solutions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "solutions_projectId_code_key" ON "solutions"("projectId", "code");

-- CreateIndex
CREATE INDEX "solution_versions_solutionId_idx" ON "solution_versions"("solutionId");

-- CreateIndex
CREATE INDEX "solution_versions_createdAt_idx" ON "solution_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "solution_versions_solutionId_versionNumber_key" ON "solution_versions"("solutionId", "versionNumber");

-- CreateIndex
CREATE INDEX "requirement_solution_links_requirementId_idx" ON "requirement_solution_links"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_solution_links_solutionId_idx" ON "requirement_solution_links"("solutionId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_solution_links_requirementId_solutionId_key" ON "requirement_solution_links"("requirementId", "solutionId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_currentVersionId_key" ON "tasks"("currentVersionId");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_solutionId_idx" ON "tasks"("solutionId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "task_versions_taskId_idx" ON "task_versions"("taskId");

-- CreateIndex
CREATE INDEX "task_versions_createdAt_idx" ON "task_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_versions_taskId_versionNumber_key" ON "task_versions"("taskId", "versionNumber");

-- CreateIndex
CREATE INDEX "iterations_projectId_idx" ON "iterations"("projectId");

-- CreateIndex
CREATE INDEX "iterations_status_idx" ON "iterations"("status");

-- CreateIndex
CREATE INDEX "iterations_startDate_idx" ON "iterations"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "iterations_projectId_iterationIndex_key" ON "iterations"("projectId", "iterationIndex");

-- CreateIndex
CREATE INDEX "iteration_items_iterationId_idx" ON "iteration_items"("iterationId");

-- CreateIndex
CREATE INDEX "iteration_items_taskId_idx" ON "iteration_items"("taskId");

-- CreateIndex
CREATE INDEX "iteration_items_requirementId_idx" ON "iteration_items"("requirementId");

-- CreateIndex
CREATE INDEX "test_cases_projectId_idx" ON "test_cases"("projectId");

-- CreateIndex
CREATE INDEX "test_cases_type_idx" ON "test_cases"("type");

-- CreateIndex
CREATE INDEX "test_cases_createdAt_idx" ON "test_cases"("createdAt");

-- CreateIndex
CREATE INDEX "test_runs_testId_idx" ON "test_runs"("testId");

-- CreateIndex
CREATE INDEX "test_runs_iterationId_idx" ON "test_runs"("iterationId");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_runs_executedAt_idx" ON "test_runs"("executedAt");

-- CreateIndex
CREATE INDEX "requirement_test_links_requirementId_idx" ON "requirement_test_links"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_test_links_testId_idx" ON "requirement_test_links"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_test_links_requirementId_testId_key" ON "requirement_test_links"("requirementId", "testId");

-- CreateIndex
CREATE INDEX "solution_test_links_solutionId_idx" ON "solution_test_links"("solutionId");

-- CreateIndex
CREATE INDEX "solution_test_links_testId_idx" ON "solution_test_links"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "solution_test_links_solutionId_testId_key" ON "solution_test_links"("solutionId", "testId");

-- CreateIndex
CREATE INDEX "attachments_projectId_idx" ON "attachments"("projectId");

-- CreateIndex
CREATE INDEX "attachments_attachedToType_attachedToId_idx" ON "attachments"("attachedToType", "attachedToId");

-- CreateIndex
CREATE INDEX "attachments_uploadedAt_idx" ON "attachments"("uploadedAt");

-- CreateIndex
CREATE INDEX "import_export_jobs_projectId_idx" ON "import_export_jobs"("projectId");

-- CreateIndex
CREATE INDEX "import_export_jobs_type_idx" ON "import_export_jobs"("type");

-- CreateIndex
CREATE INDEX "import_export_jobs_status_idx" ON "import_export_jobs"("status");

-- CreateIndex
CREATE INDEX "import_export_jobs_createdAt_idx" ON "import_export_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "project_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_groups" ADD CONSTRAINT "project_groups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "project_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_parentRequirementId_fkey" FOREIGN KEY ("parentRequirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "requirement_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_versions" ADD CONSTRAINT "requirement_versions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_versions" ADD CONSTRAINT "requirement_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_parentSolutionId_fkey" FOREIGN KEY ("parentSolutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "solution_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_versions" ADD CONSTRAINT "solution_versions_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_versions" ADD CONSTRAINT "solution_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_solution_links" ADD CONSTRAINT "requirement_solution_links_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_solution_links" ADD CONSTRAINT "requirement_solution_links_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "task_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_versions" ADD CONSTRAINT "task_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iterations" ADD CONSTRAINT "iterations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iteration_items" ADD CONSTRAINT "iteration_items_iterationId_fkey" FOREIGN KEY ("iterationId") REFERENCES "iterations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iteration_items" ADD CONSTRAINT "iteration_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iteration_items" ADD CONSTRAINT "iteration_items_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_iterationId_fkey" FOREIGN KEY ("iterationId") REFERENCES "iterations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_test_links" ADD CONSTRAINT "requirement_test_links_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_test_links" ADD CONSTRAINT "requirement_test_links_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_test_links" ADD CONSTRAINT "solution_test_links_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_test_links" ADD CONSTRAINT "solution_test_links_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
