import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  ResearchDocument,
  ResearchDocumentSchema,
} from "./schemas/research-document.schema";
import { ResearchDocumentsService } from "./research-documents.service";
import { ResearchDocumentsController } from "./research-documents.controller";
import { ProjectsModule } from "@/projects/projects.module";
import { forwardRef } from "@nestjs/common";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResearchDocument.name, schema: ResearchDocumentSchema },
    ]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [ResearchDocumentsController],
  providers: [ResearchDocumentsService],
  exports: [ResearchDocumentsService],
})
export class ResearchDocumentsModule {}
