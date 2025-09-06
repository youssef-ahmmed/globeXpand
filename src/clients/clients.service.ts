import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "./entities/client.entity";
import { PaginationDto, PaginationMetaDto } from "@/common/dto/pagination.dto";

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
  ) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search, role } = query;

    const qb = this.clientsRepo.createQueryBuilder("client");

    if (search) {
      qb.andWhere(
        "(client.companyName ILIKE :search OR client.contactEmail ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (role) {
      qb.andWhere("client.role = :role", { role });
    }

    qb.select([
      "client.id",
      "client.companyName",
      "client.contactEmail",
      "client.role",
      "client.createdAt",
      "client.updatedAt",
    ]);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(Math.min(limit, 100))
      .getManyAndCount();

    return {
      data,
      meta: new PaginationMetaDto(page, limit, total),
    };
  }

  async create(data: Partial<Client>): Promise<any> {
    const client = this.clientsRepo.create(data);
    const saved = await this.clientsRepo.save(client);

    return {
      id: saved.id,
      companyName: saved.companyName,
      email: saved.contactEmail,
      role: saved.role,
    };
  }

  async update(id: number, attrs: Partial<Client>): Promise<any> {
    if (attrs.contactEmail) {
      const existing = await this.findByEmail(attrs.contactEmail);
      if (existing && existing.id !== id) {
        throw new ConflictException("Email already exists");
      }
    }

    await this.clientsRepo.update(id, attrs);
    return this.findById(id);
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.clientsRepo.findOne({ where: { contactEmail: email } });
  }

  async findById(id: number): Promise<any> {
    if (!id || isNaN(id)) {
      throw new BadRequestException("Invalid client ID");
    }

    const client = await this.clientsRepo.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return {
      id: client.id,
      email: client.contactEmail,
      companyName: client.companyName,
      role: client.role,
    };
  }

  async save(client: Client): Promise<Client> {
    return this.clientsRepo.save(client);
  }

  async remove(id: number) {
    const result = await this.clientsRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Client not found");
    }
    return { message: "Client deleted successfully" };
  }
}
