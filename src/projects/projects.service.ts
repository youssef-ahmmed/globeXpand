import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project, ProjectStatus } from "./entities/project.entity";
import { ProjectService } from "./entities/project-service.entity";
import { Client } from "@/clients/entities/client.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { FilterProjectDto } from "./dto/filter-project.dto";
import { GetProjectMatchesDto } from "@/projects/dto/project-matches.dto";
import { Vendor } from "@/vendors/entities/vendor.entity";
import { Match } from "@/matches/entities/match.entity";
import { MailerService } from "@/common/services/mailer.service";
import { Role } from "@/common/decorators/roles.decorator";
import { PaginationMetaDto } from "@/common/dto/pagination.dto";
import { NotificationsService } from "@/notifications/notifications.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(ProjectService)
    private psRepo: Repository<ProjectService>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    private mailerService: MailerService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filter: FilterProjectDto, user: any) {
    const {
      page,
      limit,
      country,
      status,
      service,
      clientId,
      minBudget,
      maxBudget,
    } = filter;

    const query = this.repo
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.client", "client")
      .leftJoinAndSelect("project.services", "services");

    if (user.role !== Role.ADMIN) {
      query.andWhere("client.id = :clientId", { clientId: user.sub });
    } else if (clientId) {
      query.andWhere("client.id = :clientId", { clientId });
    }

    if (country) query.andWhere("project.country = :country", { country });
    if (status) query.andWhere("project.status = :status", { status });
    if (minBudget)
      query.andWhere("project.budget >= :minBudget", { minBudget });
    if (maxBudget)
      query.andWhere("project.budget <= :maxBudget", { maxBudget });
    if (service) query.andWhere("services.service = :service", { service });

    const [projects, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const mapped = projects.map(this.mapProject);
    return {
      data: mapped,
      meta: new PaginationMetaDto(page, limit, total),
    };
  }

  async create(dto: CreateProjectDto, user: any) {
    let clientId = user.sub;
    if (user.role === Role.ADMIN && dto.clientId) clientId = dto.clientId;

    const client = await this.clientRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException("Client not found");

    const project = this.repo.create({
      clientId: client.id,
      country: dto.country,
      budget: dto.budget,
      status: (dto.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
    });
    await this.repo.save(project);

    const services = dto.servicesNeeded.map((s) =>
      this.psRepo.create({ project, service: s }),
    );
    await this.psRepo.save(services);
    project.services = services;

    return this.mapProject(project);
  }

  async findOne(id: number, user: any) {
    const project = await this.repo.findOne({
      where: { id },
      relations: ["client", "services"],
    });
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== Role.ADMIN && project.client.id !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    return this.mapProject(project);
  }

  async update(id: number, dto: UpdateProjectDto, user: any) {
    const project = await this.repo.findOne({
      where: { id },
      relations: ["client", "services"],
    });
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== Role.ADMIN && project.client.id !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    if (dto.country) project.country = dto.country;
    if (dto.budget) project.budget = dto.budget;
    if (dto.status) project.status = dto.status as ProjectStatus;

    await this.repo.save(project);

    if (dto.servicesNeeded) {
      await this.psRepo.delete({ project: { id } });
      const services = dto.servicesNeeded.map((s) =>
        this.psRepo.create({ project, service: s }),
      );
      await this.psRepo.save(services);
      project.services = services;
    }

    return this.mapProject(project);
  }

  async remove(id: number) {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) throw new NotFoundException("Project not found");

    await this.repo.remove(project);
    return { message: "Project deleted successfully" };
  }

  private mapProject(project: Project) {
    return {
      id: project.id,
      clientId: project.client?.id,
      country: project.country,
      budget: project.budget,
      status: project.status,
      createdAt: project.createdAt,
      services: project.services?.map((s) => ({
        id: s.id,
        service: s.service,
        createdAt: s.createdAt,
      })),
    };
  }

  async getClientProjectIds(clientId: number): Promise<number[]> {
    const projects = await this.repo.find({
      where: { client: { id: clientId } },
      select: ["id"],
    });
    return projects.map((p) => p.id);
  }

  async getActiveProjectIds(): Promise<number[]> {
    const rows = await this.repo
      .createQueryBuilder("p")
      .select("p.id", "id")
      .where("p.status = :status", { status: ProjectStatus.ACTIVE })
      .getRawMany();
    return rows.map((r) => Number(r.id));
  }

  async findAllActiveProjectsForScheduling(): Promise<Project[]> {
    return this.repo.find({
      where: { status: ProjectStatus.ACTIVE },
      relations: ["services"], // we only need services if matching uses them
    });
  }

  async getProjectMatches(
    projectId: number,
    query: GetProjectMatchesDto,
    user: any,
  ) {
    const project = await this.repo.findOne({
      where: { id: projectId },
      relations: ["client", "services"],
    });
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== "admin" && project.client.id !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    const {
      minScore,
      limit = 10,
      sortBy = "score",
      sortOrder = "desc",
    } = query;

    const queryBuilder = this.matchRepo
      .createQueryBuilder("match")
      .leftJoinAndSelect("match.vendor", "vendor")
      .leftJoinAndSelect("vendor.services", "vendorServices")
      .leftJoinAndSelect("vendor.countries", "vendorCountries")
      .where("match.projectId = :projectId", { projectId });

    if (minScore)
      queryBuilder.andWhere("match.score >= :minScore", { minScore });

    queryBuilder
      .orderBy(`match.${sortBy}`, sortOrder.toUpperCase() as "ASC" | "DESC")
      .take(limit);

    const matches = await queryBuilder.getMany();
    const total = await queryBuilder.getCount();

    return {
      data: matches.map((m) => ({
        id: m.id,
        projectId: m.projectId,
        vendorId: m.vendorId,
        vendor: {
          id: m.vendor.id,
          name: m.vendor.name,
          contactEmail: m.vendor.contactEmail,
          rating: m.vendor.rating,
          responseSlaHours: m.vendor.responseSlaHours,
          countries: m.vendor.countries.map((c) => c.country),
          services: m.vendor.services.map((s) => s.service),
        },
        score: m.score,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      meta: { total, limit },
    };
  }

  async rebuildProjectMatches(projectId: number, user: any) {
    const project = await this.repo.findOne({
      where: { id: projectId },
      relations: ["client", "services"],
    });
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== "admin" && project.client.id !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    try {
      // 1. Find active vendors supporting the project country
      const vendors = await this.vendorRepo
        .createQueryBuilder("vendor")
        .leftJoinAndSelect("vendor.services", "services")
        .leftJoinAndSelect("vendor.countries", "countries")
        .where("vendor.isActive = true")
        .andWhere("countries.country = :country", { country: project.country })
        .getMany();

      const createdMatches: any[] = [];
      const updatedMatches: any[] = [];

      for (const vendor of vendors) {
        const projectServices = project.services.map((s) => s.service);
        const vendorServices = vendor.services.map((s) => s.service);

        const servicesOverlap = projectServices.filter((s) =>
          vendorServices.includes(s),
        ).length;

        const slaWeight = vendor.responseSlaHours <= 24 ? 1 : 0;
        const score = servicesOverlap * 2 + vendor.rating + slaWeight;

        let match = await this.matchRepo.findOne({
          where: { projectId, vendorId: vendor.id },
        });
        if (match) {
          match.score = score;
          await this.matchRepo.save(match);
          updatedMatches.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            score,
            servicesOverlap,
            isNew: false,
          });
        } else {
          match = this.matchRepo.create({
            projectId,
            vendorId: vendor.id,
            score,
          });
          await this.matchRepo.save(match);
          createdMatches.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            score,
            servicesOverlap,
            isNew: true,
          });
        }
      }

      const allMatches = [...createdMatches, ...updatedMatches]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // top 3 matches

      // Send email for new matches
      let emailSent = false;
      if (createdMatches.length > 0) {
        await this.mailerService.sendNewMatchesEmail(
          project.client.contactEmail,
          createdMatches,
        );
        emailSent = true;
      }

      return {
        created: createdMatches.length,
        updated: updatedMatches.length,
        totalMatches: createdMatches.length + updatedMatches.length,
        topMatches: allMatches,
        emailSent,
      };
    } catch (err) {
      throw new InternalServerErrorException("Rebuild failed");
    }
  }

  async rebuildMatches(projectId: number, options?: { topN?: number }) {
    const topN =
      options?.topN ??
      Number(this.configService.get("MATCHING_TOP_MATCHES_COUNT", 3));
    // SLA threshold and weights from env (fallback to defaults)
    const slaThresholdHours = Number(
      this.configService.get("MATCHING_SLA_THRESHOLD_HOURS", 24),
    ); // used if needed
    const slaWeight = Number(this.configService.get("MATCHING_SLA_WEIGHT", 1));
    const serviceWeight = Number(
      this.configService.get("MATCHING_SERVICE_WEIGHT", 2),
    );

    // 1) load project with services & client
    const project = await this.repo.findOne({
      where: { id: projectId },
      relations: ["services", "client"],
    });
    if (!project) throw new NotFoundException("Project not found");

    // 2) find candidate vendors who support the project country and at least one service
    // we'll use query builder to compute services_overlap
    const candidates = await this.vendorRepo
      .createQueryBuilder("v")
      .select([
        "v.id AS vendorId",
        "v.name AS vendorName",
        "v.rating AS rating",
        "v.response_sla_hours AS responseSlaHours",
        "COUNT(ps.service) AS servicesOverlap",
      ])
      .innerJoin("v.countries", "vc", "vc.country = :country", {
        country: project.country,
      })
      .innerJoin("v.services", "vs", "vs.vendor_id = v.id")
      .innerJoin(
        "project_service",
        "ps",
        "ps.service = vs.service AND ps.project_id = :projectId",
        { projectId },
      )
      .where("v.is_active = TRUE")
      .groupBy("v.id, v.name, v.rating, v.response_sla_hours")
      .getRawMany();

    // Map existing matches for this project to detect creates vs updates
    const existingMatches = await this.matchRepo.find({ where: { projectId } });
    const existingMap = new Map<number, Match>();
    for (const m of existingMatches) existingMap.set(m.vendorId, m);

    const created: Match[] = [];
    const updated: Match[] = [];

    // 3) compute score for each candidate and upsert
    for (const c of candidates) {
      const vendorId = Number(c.vendorId);
      const servicesOverlap = Number(c.servicesOverlap) || 0;
      if (servicesOverlap <= 0) continue; // skip
      const rating = Number(c.rating) || 0;
      const responseSlaHours = Number(c.responseSlaHours) || 99999;
      const slaBonus = responseSlaHours <= slaThresholdHours ? slaWeight : 0;

      const score = servicesOverlap * serviceWeight + rating + slaBonus;

      const existing = existingMap.get(vendorId);
      if (existing) {
        // if score changed, update
        if (Number(existing.score) !== Number(score)) {
          existing.score = Number(score.toFixed(2));
          await this.matchRepo.save(existing);
          updated.push(existing);
        } else {
          // update updatedAt timestamp
          existing.updatedAt = new Date();
          await this.matchRepo.save(existing);
        }
      } else {
        // create new match
        const newMatch = this.matchRepo.create({
          projectId: project.id,
          vendorId,
          score: Number(score.toFixed(2)),
        });
        await this.matchRepo.save(newMatch);
        created.push(newMatch);
      }
    }

    const totalMatches = await this.matchRepo.count({ where: { projectId } });

    // 4) pick top matches (by score)
    const topMatchesRaw = await this.matchRepo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.vendor", "vendor")
      .where("m.projectId = :projectId", { projectId })
      .orderBy("m.score", "DESC")
      .take(topN)
      .getMany();

    const topMatches = topMatchesRaw.map((m) => ({
      vendorId: m.vendorId,
      vendorName: m.vendor?.name,
      score: Number(m.score),
      servicesOverlap: null, // optional: computing matching services would need extra queries
      isNew: created.some((c) => c.vendorId === m.vendorId),
    }));

    // 5) Notifications: send email to client for newly created matches only
    let emailSent = false;
    if (created.length > 0) {
      try {
        const clientEmail = project.client?.contactEmail;
        if (clientEmail) {
          // prepare top N new vendors to include in email
          const newVendorDetails = created
            .sort((a, b) => Number(b.score) - Number(a.score))
            .slice(0, topN)
            .map((m) => ({ vendorId: m.vendorId, score: m.score }));

          // call notifications service (mock uses MailerService)
          await this.notificationsService.sendNewMatchesEmail(
            clientEmail,
            project,
            newVendorDetails,
          );
          emailSent = true;
        }
      } catch (err) {
        // swallow, but log (you might integrate logger)
        // console.error('Failed to send new matches email', err);
      }
    }

    return {
      created: created.length,
      updated: updated.length,
      totalMatches,
      topMatches,
      emailSent,
    };
  }
}
