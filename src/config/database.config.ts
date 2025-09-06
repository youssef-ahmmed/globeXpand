import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: "mysql",
  host: configService.get("MYSQL_HOST"),
  port: configService.get("MYSQL_PORT"),
  username: configService.get("MYSQL_USERNAME"),
  password: configService.get("MYSQL_PASSWORD"),
  database: configService.get("MYSQL_DATABASE"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../database/mysql/migrations/*{.ts,.js}"],
  synchronize: configService.get("MYSQL_SYNCHRONIZE") === "true",
  logging: configService.get("MYSQL_LOGGING") === "true",
  charset: "utf8mb4",
  timezone: "Z",
  migrationsRun: true,
});
