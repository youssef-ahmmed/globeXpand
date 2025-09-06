import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Role, Roles } from "@/common/decorators/roles.decorator";
import { PaginationDto } from "@/common/dto/pagination.dto";

@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(@Query() query: PaginationDto) {
    return this.clientsService.findAll(query);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    return this.clientsService.findById(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param("id", ParseIntPipe) id: number, @Req() req) {
    const client = await this.clientsService.findById(id);
    if (!client) throw new NotFoundException();
    return client;
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(@Body() updateDto: any, @Req() req) {
    console.log(req.user);
    const clientId = req.user.id;
    const client = await this.clientsService.findById(clientId);
    if (!client) throw new NotFoundException();

    return this.clientsService.update(clientId, updateDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateByAdmin(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: any,
  ) {
    const client = await this.clientsService.findById(id);
    if (!client) throw new NotFoundException();

    return this.clientsService.update(id, updateDto);
  }

  @Delete("me")
  @UseGuards(JwtAuthGuard)
  async removeMe(@Req() req) {
    const clientId = req.user.id;
    const client = await this.clientsService.findById(clientId);
    if (!client) throw new NotFoundException();

    await this.clientsService.remove(clientId);
    return { message: "Your account has been deleted successfully" };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeByAdmin(@Param("id", ParseIntPipe) id: number) {
    const client = await this.clientsService.findById(id);
    if (!client) throw new NotFoundException();

    await this.clientsService.remove(id);
    return { message: "Client deleted successfully" };
  }
}
