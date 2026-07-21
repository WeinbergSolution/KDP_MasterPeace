-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrgKind" AS ENUM ('personal', 'team');

-- CreateEnum
CREATE TYPE "FormatProfile" AS ENUM ('workbook', 'paperback', 'nonfiction', 'ebook');

-- CreateEnum
CREATE TYPE "VersionLabel" AS ENUM ('autosave', 'snapshot', 'pre_repair', 'export');

-- CreateEnum
CREATE TYPE "AiDisclosureLevel" AS ENUM ('human', 'ai_assisted', 'ai_generated');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "OrgKind" NOT NULL DEFAULT 'personal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentLocale" TEXT NOT NULL,
    "marketLocale" TEXT NOT NULL,
    "demoMode" BOOLEAN NOT NULL DEFAULT false,
    "disclosureText" "AiDisclosureLevel" NOT NULL DEFAULT 'ai_assisted',
    "disclosureCover" "AiDisclosureLevel" NOT NULL DEFAULT 'human',
    "disclosureInteriorImages" "AiDisclosureLevel" NOT NULL DEFAULT 'human',
    "disclosureTranslation" "AiDisclosureLevel" NOT NULL DEFAULT 'human',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workingTitle" TEXT NOT NULL,
    "formatProfile" "FormatProfile" NOT NULL DEFAULT 'workbook',
    "activeVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookVersion" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "parentVersionId" TEXT,
    "label" "VersionLabel" NOT NULL DEFAULT 'autosave',
    "etag" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookDocument" (
    "id" TEXT NOT NULL,
    "bookVersionId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "astHash" TEXT NOT NULL,
    "ast" JSONB NOT NULL,

    CONSTRAINT "BookDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_orgId_idx" ON "Project"("orgId");

-- CreateIndex
CREATE INDEX "Book_projectId_idx" ON "Book"("projectId");

-- CreateIndex
CREATE INDEX "BookVersion_bookId_idx" ON "BookVersion"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookVersion_bookId_versionNumber_key" ON "BookVersion"("bookId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BookDocument_bookVersionId_key" ON "BookDocument"("bookVersionId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVersion" ADD CONSTRAINT "BookVersion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookDocument" ADD CONSTRAINT "BookDocument_bookVersionId_fkey" FOREIGN KEY ("bookVersionId") REFERENCES "BookVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

