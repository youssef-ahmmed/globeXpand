import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "@/auth/dto/register.dto";
import { LoginDto } from "@/auth/dto/login.dto";
import { ChangePasswordDto } from "@/auth/dto/change-password.dto";
import { ClientsService } from "@/clients/clients.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly jwtService: JwtService,
  ) {}

  async generateTokens(payload: any) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.clientsService.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email is already registered");

    const hashedPassword = await this.hashPassword(dto.password);
    const client = await this.clientsService.create({
      companyName: dto.companyName,
      contactEmail: dto.email,
      passwordHash: hashedPassword,
    });

    const payload = {
      sub: client.id,
      email: client.contactEmail,
      role: client.role,
    };
    const tokens = await this.generateTokens(payload);

    return {
      companyName: client.companyName,
      email: client.contactEmail,
      role: client.role,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const client = await this.clientsService.findByEmail(dto.email);
    if (!client) throw new UnauthorizedException("Invalid email or password");

    const isMatch = await bcrypt.compare(dto.password, client.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Invalid email or password");

    const payload = {
      sub: client.id,
      email: client.contactEmail,
      role: client.role,
    };
    const tokens = await this.generateTokens(payload);

    return {
      companyName: client.companyName,
      email: client.contactEmail,
      role: client.role,
      ...tokens,
    };
  }

  async changePassword(clientId: number, dto: ChangePasswordDto) {
    const client = await this.clientsService.findById(clientId);
    if (!client) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.oldPassword, client.passwordHash);
    if (!isMatch) throw new UnauthorizedException("Invalid current password");

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        "New password must be different from old password",
      );
    }

    client.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.clientsService.save(client);

    return { message: "Password changed successfully" };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
