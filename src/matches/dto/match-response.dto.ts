import { ApiProperty } from "@nestjs/swagger";

export class ClientSummaryDto {
  @ApiProperty({ example: "TechStart Inc" })
  companyName: string;
}

export class ProjectSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "DE" })
  country: string;

  @ApiProperty({ type: ClientSummaryDto })
  client: ClientSummaryDto;
}

export class VendorSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Euro Legal Services" })
  name: string;

  @ApiProperty({ example: 4 })
  rating: number;
}

export class MatchResponseDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ type: ProjectSummaryDto })
  project: ProjectSummaryDto;

  @ApiProperty({ example: 1 })
  vendorId: number;

  @ApiProperty({ type: VendorSummaryDto })
  vendor: VendorSummaryDto;

  @ApiProperty({ example: 9.0 })
  score: number;

  @ApiProperty({ example: "2025-06-26T12:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2025-06-26T12:00:00Z" })
  updatedAt: Date;
}

export class MatchDetailResponseDto extends MatchResponseDto {
  @ApiProperty({
    type: Object,
    description: "Additional match details and statistics",
    example: {
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
  })
  details?: any;
}
