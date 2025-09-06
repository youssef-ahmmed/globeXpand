import { ApiProperty } from "@nestjs/swagger";

export class RegisterResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: "TechStart Inc" })
  companyName: string;

  @ApiProperty({ example: "founder@techstart.com" })
  email: string;

  @ApiProperty({ example: "client", enum: ["admin", "client"] })
  role: string;
}
