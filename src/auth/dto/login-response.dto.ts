import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: "TechStart Inc" })
  companyName: string;

  @ApiProperty({ example: "founder@techstart.com" })
  email: string;

  @ApiProperty({ example: "client", enum: ["admin", "client"] })
  role: string;

  @ApiProperty({ example: 456, nullable: true })
  clientId: number | null;
}

export class LoginResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token",
  })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
