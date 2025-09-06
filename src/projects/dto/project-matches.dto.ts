import { IsIn, IsNumber, IsOptional, Min } from "class-validator";

export class RebuildProjectMatchesDto {}

export class GetProjectMatchesDto {
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsIn(["score", "createdAt"])
  sortBy?: "score" | "createdAt" = "score";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
