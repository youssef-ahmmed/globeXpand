import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "founder@techstart.com",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "SecurePass123!",
    description: "User password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
