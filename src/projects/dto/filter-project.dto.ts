import { IsOptional, IsString, IsNumber, IsIn, Min } from "class-validator";
import { Type } from "class-transformer";

export class FilterProjectDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(["active", "paused", "closed"])
  status?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @Type(() => Number)
  clientId?: number; // only admin

  @IsOptional()
  @Type(() => Number)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  maxBudget?: number;
}
