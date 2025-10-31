-- AddForeignKey
ALTER TABLE "system_messages" ADD CONSTRAINT "system_messages_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES "demos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
