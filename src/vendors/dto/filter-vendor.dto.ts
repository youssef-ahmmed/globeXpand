import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { PaginationDto } from "@/common/dto/pagination.dto";

export class FilterVendorDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  maxRating?: number;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
