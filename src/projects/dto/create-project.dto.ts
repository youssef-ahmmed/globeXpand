import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateProjectDto {
  @IsOptional()
  clientId?: number;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  servicesNeeded: string[];

  @IsNumber()
  @Min(1)
  budget: number;

  @IsOptional()
  @IsIn(["active", "paused", "closed"])
  status: string = "active";
}
