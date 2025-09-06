import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ProjectsService } from "@/projects/projects.service";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "@/matches/entities/match.entity";
import { Vendor } from "@/vendors/entities/vendor.entity";
import { VendorHealth } from "@/vendors/entities/vendor-health.entity";
import { NotificationsService } from "@/notifications/notifications.service";

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly projectsService: ProjectsService,
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorHealth)
    private readonly vendorHealthRepo: Repository<VendorHealth>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(process.env.CRON_MATCH_REFRESH || "0 3 * * *")
  async handleDailyRefresh() {
    this.logger.log(
      "Scheduled job: refresh matches for active projects started",
    );

    let projectIds: number[] = [];

    try {
      // Preferred method
      if (typeof this.projectsService.getActiveProjectIds === "function") {
        projectIds = await this.projectsService.getActiveProjectIds();
      } else {
        // fallback
        const activeProjects =
          (await this.projectsService.findAllActiveProjectsForScheduling?.()) ??
          [];
        projectIds = activeProjects.map((p) => p.id);
      }
    } catch (err) {
      this.logger.error("Failed to fetch active projects", err);
      return;
    }

    if (projectIds.length === 0) {
      this.logger.warn("No active projects found for daily refresh");
      return;
    }

    // Rebuild matches per project
    for (const pid of projectIds) {
      try {
        const res = await (this.projectsService as any).rebuildMatches(pid); // assumes you’ll implement or already have
        this.logger.log(
          `Rebuilt matches for project ${pid}: created=${res?.created ?? 0}, updated=${res?.updated ?? 0}`,
        );
      } catch (err) {
        this.logger.error(`Failed to rebuild matches for project ${pid}`, err);
      }
    }

    // Flag expired SLAs
    try {
      await this.flagExpiredSlas();
    } catch (err) {
      this.logger.error("Failed to flag expired SLAs", err);
    }

    this.logger.log(
      "Scheduled job: refresh matches for active projects finished",
    );
  }

  @Cron(process.env.CRON_SLA_CHECK || "0 */6 * * *")
  async flagExpiredSlas() {
    this.logger.log("Scheduled job: SLA check started");

    const matches = await this.matchRepo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.vendor", "v")
      .where("v.is_active = TRUE")
      .getMany();

    const now = Date.now();
    for (const m of matches) {
      const vendor = await this.vendorRepo.findOne({
        where: { id: m.vendorId },
      });
      if (!vendor) continue;
      const created = m.createdAt ? m.createdAt.getTime() : 0;
      const hoursPassed = (now - created) / (1000 * 60 * 60);
      if (hoursPassed > vendor.responseSlaHours) {
        let health = await this.vendorHealthRepo.findOne({
          where: { vendorId: vendor.id },
        });
        if (!health) {
          health = this.vendorHealthRepo.create({
            vendorId: vendor.id,
            slaExpired: true,
            lastCheckedAt: new Date(),
          });
        } else {
          if (!health.slaExpired) health.slaExpired = true;
          health.lastCheckedAt = new Date();
        }
        await this.vendorHealthRepo.save(health);

        // send notification (mock)
        await this.notifications.sendSlaExpiredNotification(vendor.id, {
          matchId: m.id,
        });
        this.logger.log(`Vendor ${vendor.id} flagged SLA expired`);
      }
    }

    this.logger.log("Scheduled job: SLA check finished");
  }
}
