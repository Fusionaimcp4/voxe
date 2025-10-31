-- CreateTable
CREATE TABLE "system_message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_message_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "changeLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_message_versions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_message_versions" ADD CONSTRAINT "system_message_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "system_message_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
