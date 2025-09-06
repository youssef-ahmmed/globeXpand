import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendNewMatchesEmail(to: string, matches: any[]) {
    // Replace this with real email integration
    this.logger.log(`Sending email to ${to} for ${matches.length} new matches`);
    matches.forEach((m) => {
      this.logger.log(`New Match: ${m.vendorName} (Score: ${m.score})`);
    });
    return true;
  }
}
