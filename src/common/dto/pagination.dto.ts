import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.pages = Math.ceil(total / limit);
    this.hasNext = page < this.pages;
    this.hasPrevious = page > 1;
  }
}
