import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class CreateVendorDto {
  @IsString()
  @Length(2, 255)
  name: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  responseSlaHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ArrayNotEmpty()
  @ArrayMinSize(1)
  countriesSupported: string[];

  @ArrayNotEmpty()
  @ArrayMinSize(1)
  servicesOffered: string[];
}
