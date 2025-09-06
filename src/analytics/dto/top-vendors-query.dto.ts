import { IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class TopVendorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days = 30;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 3;
}
