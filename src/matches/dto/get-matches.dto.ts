import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
  IsIn,
  IsNumber,
  Min,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class GetMatchesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Filter by project ID",
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  projectId?: number;

  @ApiPropertyOptional({
    description: "Filter by vendor ID",
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  vendorId?: number;

  @ApiPropertyOptional({
    description: "Filter by project country code",
    example: "DE",
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: "Minimum score filter",
    example: 7.5,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({
    description: "Filter matches created from date (ISO format)",
    example: "2025-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Filter matches created to date (ISO format)",
    example: "2025-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: "Sort by field",
    enum: ["score", "createdAt"],
    example: "score",
  })
  @IsOptional()
  @IsIn(["score", "createdAt"])
  sortBy?: "score" | "createdAt";

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["desc", "asc"],
    example: "desc",
  })
  @IsOptional()
  @IsIn(["desc", "asc"])
  sortOrder?: "desc" | "asc";
}
