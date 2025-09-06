import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VendorsService } from "./vendors.service";
import { VendorsController } from "./vendors.controller";
import { Vendor } from "./entities/vendor.entity";
import { VendorService } from "./entities/vendor-service.entity";
import { VendorCountry } from "./entities/vendor-country.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, VendorService, VendorCountry])],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService, TypeOrmModule],
})
export class VendorsModule {}
