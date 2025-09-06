import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Match } from "./entities/match.entity";
import { GetMatchesDto } from "./dto/get-matches.dto";

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  async findAll(query: GetMatchesDto) {
    const {
      page = 1,
      limit = 20,
      projectId,
      vendorId,
      country,
      minScore,
      from,
      to,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const queryBuilder = this.createBaseQuery();

    // Apply filters
    if (projectId) {
      queryBuilder.andWhere("match.projectId = :projectId", { projectId });
    }

    if (vendorId) {
      queryBuilder.andWhere("match.vendorId = :vendorId", { vendorId });
    }

    if (country) {
      queryBuilder.andWhere("project.country = :country", { country });
    }

    if (minScore) {
      queryBuilder.andWhere("match.score >= :minScore", { minScore });
    }

    if (from) {
      queryBuilder.andWhere("match.createdAt >= :from", {
        from: new Date(from),
      });
    }

    if (to) {
      queryBuilder.andWhere("match.createdAt <= :to", { to: new Date(to) });
    }

    // Apply sorting
    const orderDirection = sortOrder.toUpperCase() as "ASC" | "DESC";
    if (sortBy === "score") {
      queryBuilder.orderBy("match.score", orderDirection);
    } else if (sortBy === "createdAt") {
      queryBuilder.orderBy("match.createdAt", orderDirection);
    }

    // Add secondary sort for consistency
    queryBuilder.addOrderBy("match.id", "DESC");

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Get results
    const matches = await queryBuilder.getMany();

    // Calculate pagination metadata
    const pages = Math.ceil(total / limit);
    return {
      data: matches,
      meta: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const match = await this.createBaseQuery()
      .andWhere("match.id = :id", { id })
      .getOne();

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    // Add additional details for single match view
    return {
      ...match,
      details: await this.getMatchDetails(match),
    };
  }

  private createBaseQuery(): SelectQueryBuilder<Match> {
    return this.matchRepository
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.project", "project")
      .leftJoinAndSelect("project.client", "client")
      .leftJoinAndSelect("match.vendor", "vendor")
      .select([
        "match.id",
        "match.projectId",
        "match.vendorId",
        "match.score",
        "match.createdAt",
        "match.updatedAt",
        "project.id",
        "project.country",
        "client.companyName",
        "vendor.id",
        "vendor.name",
        "vendor.rating",
      ]);
  }

  private async getMatchDetails(match: Match): Promise<any> {
    // This would typically involve additional queries to get:
    // - Services overlap calculation
    // - Matching services list
    // - SLA weight calculation
    // - Score breakdown

    // For now, return mock details structure
    // In a real implementation, this would calculate actual values
    return {
      servicesOverlap: 2,
      matchingServices: ["legal", "compliance"],
      slaWeight: match.vendor?.responseSlaHours <= 24 ? 1 : 0,
      calculationDetails: {
        serviceWeight: 2,
        servicesOverlap: 2,
        rating: match.vendor?.rating || 0,
        slaBonus: match.vendor?.responseSlaHours <= 24 ? 1 : 0,
        totalScore: match.score,
      },
    };
  }

  async getMatchStats() {
    const stats = await this.matchRepository
      .createQueryBuilder("match")
      .select([
        "COUNT(*) as totalMatches",
        "AVG(match.score) as averageScore",
        "MAX(match.score) as highestScore",
        "MIN(match.score) as lowestScore",
      ])
      .getRawOne();

    return {
      totalMatches: parseInt(stats.totalMatches) || 0,
      averageScore: parseFloat(stats.averageScore) || 0,
      highestScore: parseFloat(stats.highestScore) || 0,
      lowestScore: parseFloat(stats.lowestScore) || 0,
    };
  }

  async findByProject(projectId: number, minScore?: number, limit = 10) {
    const queryBuilder = this.createBaseQuery().andWhere(
      "match.projectId = :projectId",
      { projectId },
    );

    if (minScore) {
      queryBuilder.andWhere("match.score >= :minScore", { minScore });
    }

    queryBuilder
      .orderBy("match.score", "DESC")
      .addOrderBy("match.createdAt", "DESC")
      .take(limit);

    return queryBuilder.getMany();
  }

  async getRecentMatches(days = 7, limit = 10) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.createBaseQuery()
      .andWhere("match.createdAt >= :fromDate", { fromDate })
      .orderBy("match.createdAt", "DESC")
      .take(limit)
      .getMany();
  }
}
