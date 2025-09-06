import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SchedulingService } from "./scheduling.service";
import { Match } from "@/matches/entities/match.entity";
import { Vendor } from "@/vendors/entities/vendor.entity";
import { VendorHealth } from "@/vendors/entities/vendor-health.entity";
import { NotificationsModule } from "@/notifications/notifications.module";
import { ProjectsModule } from "@/projects/projects.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Match, Vendor, VendorHealth]),
    NotificationsModule,
    ProjectsModule,
  ],
  providers: [SchedulingService],
  exports: [],
})
export class SchedulingModule {}
