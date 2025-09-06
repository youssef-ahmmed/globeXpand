import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  servicesNeeded?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  budget?: number;

  @IsOptional()
  @IsIn(["active", "paused", "closed"])
  status?: string;
}
