import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@/common/services/mailer.service";
import { Project } from "@/projects/entities/project.entity";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendNewMatchesEmail(
    clientEmail: string,
    project: Project,
    vendorDetails: Array<{ vendorId: number; score: number }>,
  ) {
    this.logger.log(
      `Sending new matches email to ${clientEmail} for project ${project.id}`,
    );
    const lines = [
      `Hello ${project.client?.companyName || "Client"},`,
      "",
      `We found ${vendorDetails.length} new vendor matches for your project (${project.id}, country=${project.country}).`,
      "",
      "Top matches:",
      ...vendorDetails.map(
        (v) => ` - Vendor ID ${v.vendorId} (score: ${v.score})`,
      ),
      "",
      "Best regards,",
      "GlobeXpand Team",
    ];
    const text = lines.join("\n");

    await this.mailerService.sendNewMatchesEmail(
      clientEmail,
      vendorDetails as any,
    );

    this.logger.debug(`Email content:\n${text}`);
    return true;
  }

  async sendSlaExpiredNotification(vendorId: number, details: any) {
    this.logger.warn(
      `Vendor ${vendorId} SLA expired. Details: ${JSON.stringify(details)}`,
    );
    return true;
  }
}
