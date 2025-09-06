import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { Project } from "./entities/project.entity";
import { ProjectService } from "./entities/project-service.entity";
import { Client } from "@/clients/entities/client.entity";
import { Vendor } from "@/vendors/entities/vendor.entity";
import { Match } from "@/matches/entities/match.entity";
import { ClientsModule } from "@/clients/clients.module";
import { VendorsModule } from "@/vendors/vendors.module";
import { MatchesModule } from "@/matches/matches.module";
import { MailerService } from "@/common/services/mailer.service";
import { ResearchDocumentsModule } from "@/documents/research-documents.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectService, Client, Vendor, Match]),
    ClientsModule,
    VendorsModule,
    MatchesModule,
    forwardRef(() => ResearchDocumentsModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, MailerService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
