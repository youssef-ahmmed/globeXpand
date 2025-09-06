import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Match } from '@/matches/entities/match.entity';
import { Project } from '@/projects/entities/project.entity';
import { Vendor } from '@/vendors/entities/vendor.entity';
import { Client } from '@/clients/entities/client.entity';
import { ProjectService } from '@/projects/entities/project-service.entity';
import { ResearchDocument, ResearchDocumentSchema } from '@/documents/schemas/research-document.schema';
import { ProjectsModule } from '@/projects/projects.module';

@Module({
    imports: [
        // TypeORM repos we need
        TypeOrmModule.forFeature([Match, Project, Vendor, Client, ProjectService]),
        // Mongoose research documents
        MongooseModule.forFeature([{ name: ResearchDocument.name, schema: ResearchDocumentSchema }]),
        // forwardRef in case ProjectsModule imports AnalyticsModule (avoid circular issues)
        forwardRef(() => ProjectsModule),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
