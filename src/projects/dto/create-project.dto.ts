import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
  ArrayNotEmpty,
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
