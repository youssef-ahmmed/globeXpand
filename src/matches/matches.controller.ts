import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { MatchesService } from "./matches.service";
import { GetMatchesDto } from "./dto/get-matches.dto";
import {
  MatchDetailResponseDto,
  MatchResponseDto,
} from "./dto/match-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Role, Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Matches")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller("matches")
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: "Get all matches (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of matches with pagination",
    example: {
      data: [
        {
          id: 101,
          projectId: 1,
          project: {
            id: 1,
            country: "DE",
            client: {
              companyName: "TechStart Inc",
            },
          },
          vendorId: 1,
          vendor: {
            id: 1,
            name: "Euro Legal Services",
            rating: 4,
          },
          score: 9.0,
          createdAt: "2025-06-26T12:00:00Z",
          updatedAt: "2025-06-26T12:00:00Z",
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 234,
        pages: 12,
        hasNext: true,
        hasPrevious: false,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
    example: {
      statusCode: 403,
      message: "Insufficient permissions for the operation",
      error: "Forbidden",
    },
  })
  async findAll(@Query() query: GetMatchesDto) {
    return this.matchesService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get match statistics (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Match statistics",
    example: {
      totalMatches: 234,
      averageScore: 7.8,
      highestScore: 10.0,
      lowestScore: 3.2,
    },
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async getStats() {
    return this.matchesService.getMatchStats();
  }

  @Get("recent")
  @ApiOperation({ summary: "Get recent matches (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Recent matches",
    type: [MatchResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
  })
  async getRecentMatches(
    @Query("days") days?: number,
    @Query("limit") limit?: number,
  ) {
    return this.matchesService.getRecentMatches(days, limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get match by ID (Admin only)" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "Match ID",
    example: 101,
  })
  @ApiResponse({
    status: 200,
    description: "Match details",
    type: MatchDetailResponseDto,
    example: {
      id: 101,
      projectId: 1,
      project: {
        id: 1,
        country: "DE",
        client: {
          companyName: "TechStart Inc",
        },
      },
      vendorId: 1,
      vendor: {
        id: 1,
        name: "Euro Legal Services",
        rating: 4,
      },
      score: 9.0,
      createdAt: "2025-06-26T12:00:00Z",
      updatedAt: "2025-06-26T12:00:00Z",
      details: {
        servicesOverlap: 2,
        matchingServices: ["legal", "compliance"],
        slaWeight: 1,
        calculationDetails: {
          serviceWeight: 2,
          servicesOverlap: 2,
          rating: 4,
          slaBonus: 1,
          totalScore: 9.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Admin access required",
    example: {
      statusCode: 403,
      message: "Insufficient permissions for the operation",
      error: "Forbidden",
    },
  })
  @ApiResponse({
    status: 404,
    description: "Match not found",
    example: {
      statusCode: 404,
      message: "Match not found",
      error: "Not Found",
    },
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }
}
