import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { MailerService } from "@/common/services/mailer.service";

@Module({
  providers: [NotificationsService, MailerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
