import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vendor } from "./entities/vendor.entity";
import { VendorService } from "./entities/vendor-service.entity";
import { VendorCountry } from "./entities/vendor-country.entity";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { UpdateVendorDto } from "./dto/update-vendor.dto";
import { FilterVendorDto } from "./dto/filter-vendor.dto";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorService)
    private readonly vendorServiceRepo: Repository<VendorService>,
    @InjectRepository(VendorCountry)
    private readonly vendorCountryRepo: Repository<VendorCountry>,
  ) {}

  async findAll(filter: FilterVendorDto) {
    const {
      page = 1,
      limit = 20,
      search,
      country,
      service,
      minRating,
      maxRating,
      isActive,
    } = filter;

    const qb = this.vendorRepo
      .createQueryBuilder("vendor")
      .leftJoinAndSelect("vendor.services", "services")
      .leftJoinAndSelect("vendor.countries", "countries");

    if (search) {
      qb.andWhere(
        "(vendor.name ILIKE :search OR vendor.contactEmail ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    if (country) {
      qb.andWhere("countries.country = :country", { country });
    }
    if (service) {
      qb.andWhere("services.service = :service", { service });
    }
    if (minRating !== undefined) {
      qb.andWhere("vendor.rating >= :minRating", { minRating });
    }
    if (maxRating !== undefined) {
      qb.andWhere("vendor.rating <= :maxRating", { maxRating });
    }
    if (isActive !== undefined) {
      qb.andWhere("vendor.isActive = :isActive", {
        isActive: isActive === "true",
      });
    }

    const [vendors, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: vendors,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateVendorDto) {
    const existing = await this.vendorRepo.findOne({
      where: { contactEmail: dto.contactEmail },
    });
    if (existing) throw new ConflictException("Email already exists");

    const vendor = this.vendorRepo.create({
      name: dto.name,
      contactEmail: dto.contactEmail,
      rating: dto.rating ?? 0,
      responseSlaHours: dto.responseSlaHours ?? 48,
      isActive: dto.isActive ?? true,
    });
    await this.vendorRepo.save(vendor);

    const services = dto.servicesOffered.map((service) =>
      this.vendorServiceRepo.create({ vendor, service }),
    );
    const countries = dto.countriesSupported.map((country) =>
      this.vendorCountryRepo.create({ vendor, country }),
    );

    await this.vendorServiceRepo.save(services);
    await this.vendorCountryRepo.save(countries);

    vendor.services = services;
    vendor.countries = countries;
    return vendor;
  }

  async findOne(id: number) {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: ["services", "countries", "matches"],
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return vendor;
  }

  async update(id: number, dto: UpdateVendorDto) {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: ["services", "countries"],
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    if (dto.contactEmail && dto.contactEmail !== vendor.contactEmail) {
      const existing = await this.vendorRepo.findOne({
        where: { contactEmail: dto.contactEmail },
      });
      if (existing) throw new ConflictException("Email already exists");
    }

    Object.assign(vendor, dto);
    await this.vendorRepo.save(vendor);

    if (dto.servicesOffered) {
      await this.vendorServiceRepo.delete({ vendor: { id } });
      const services = dto.servicesOffered.map((service) =>
        this.vendorServiceRepo.create({ vendor, service }),
      );
      await this.vendorServiceRepo.save(services);
      vendor.services = services;
    }

    if (dto.countriesSupported) {
      await this.vendorCountryRepo.delete({ vendor: { id } });
      const countries = dto.countriesSupported.map((country) =>
        this.vendorCountryRepo.create({ vendor, country }),
      );
      await this.vendorCountryRepo.save(countries);
      vendor.countries = countries;
    }

    return vendor;
  }

  async remove(id: number) {
    const vendor = await this.vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    vendor.isActive = false;
    await this.vendorRepo.save(vendor);

    return { message: "Vendor deactivated successfully" };
  }
}
