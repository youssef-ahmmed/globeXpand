import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/typeorm";
import { InjectConnection as InjectMongoConnection } from "@nestjs/mongoose";
import { Connection } from "typeorm";
import { Connection as MongoConnection } from "mongoose";

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private mysqlConnection: Connection,
    @InjectMongoConnection() private mongoConnection: MongoConnection,
  ) {}

  async check() {
    const mysql = await this.checkMySQL();
    const mongodb = await this.checkMongoDB();

    const status =
      mysql.status === "healthy" && mongodb.status === "healthy"
        ? "healthy"
        : "unhealthy";

    return {
      status,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        mysql,
        mongodb,
      },
      uptime: process.uptime(),
    };
  }

  private async checkMySQL() {
    try {
      const start = Date.now();
      await this.mysqlConnection.query("SELECT 1");
      const responseTime = Date.now() - start;

      return {
        status: "healthy",
        responseTime,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        responseTime: null,
      };
    }
  }

  private async checkMongoDB() {
    try {
      const start = Date.now();
      await this.mongoConnection.db.admin().ping();
      const responseTime = Date.now() - start;

      return {
        status: "healthy",
        responseTime,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        responseTime: null,
      };
    }
  }
}
