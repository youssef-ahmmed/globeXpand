import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";

// Modules
import { AuthModule } from "./auth/auth.module";
import { ClientsModule } from "./clients/clients.module";
import { ProjectsModule } from "./projects/projects.module";
import { VendorsModule } from "./vendors/vendors.module";
import { MatchesModule } from "./matches/matches.module";
import { ResearchDocumentsModule } from "./documents/research-documents.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthModule } from "./health/health.module";
import { SchedulingModule } from "./scheduling/scheduling.module";

import { validationSchema } from "./config/validation.schema";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // MySQL Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("MYSQL_HOST"),
        port: configService.get("MYSQL_PORT"),
        username: configService.get("MYSQL_USERNAME"),
        password: configService.get("MYSQL_PASSWORD"),
        database: configService.get("MYSQL_DATABASE"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/database/mysql/migrations/*{.ts,.js}"],
        synchronize: configService.get("MYSQL_SYNCHRONIZE") === "true",
        logging: configService.get("MYSQL_LOGGING") === "true",
        charset: "utf8mb4",
        timezone: "Z",
        migrationsRun: true,
      }),
    }),

    // MongoDB Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("MONGODB_URI"),
      }),
    }),

    // Throttling
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: "short",
          ttl: configService.get("THROTTLE_TTL") * 1000,
          limit: configService.get("THROTTLE_LIMIT"),
        },
        {
          name: "medium",
          ttl: 60000,
          limit: 20,
        },
        {
          name: "long",
          ttl: 3600000,
          limit: 100,
        },
      ],
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 5, // 5 minutes default
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    ClientsModule,
    ProjectsModule,
    VendorsModule,
    MatchesModule,
    ResearchDocumentsModule,
    AnalyticsModule,
    NotificationsModule,
    HealthModule,
    SchedulingModule,
  ],
})
export class AppModule {}
