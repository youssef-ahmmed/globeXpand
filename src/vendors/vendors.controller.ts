import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { VendorsService } from "./vendors.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Role, Roles } from "@/common/decorators/roles.decorator";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { UpdateVendorDto } from "./dto/update-vendor.dto";
import { FilterVendorDto } from "./dto/filter-vendor.dto";

@Controller("vendors")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async findAll(@Query() filter: FilterVendorDto) {
    return this.vendorsService.findAll(filter);
  }

  @Post()
  async create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.vendorsService.remove(id);
  }
}
