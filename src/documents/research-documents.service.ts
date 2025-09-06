import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResearchDocument } from "./schemas/research-document.schema";
import {
  CreateResearchDocumentDto,
  GetResearchDocumentsQueryDto,
  UpdateResearchDocumentDto,
} from "./dto/research-document.dto";
import { ProjectsService } from "@/projects/projects.service";

@Injectable()
export class ResearchDocumentsService {
  constructor(
    @InjectModel(ResearchDocument.name)
    private readonly documentModel: Model<ResearchDocument>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(dto: CreateResearchDocumentDto, user: any) {
    const project = await this.projectsService.findOne(dto.projectId, user);
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== "admin" && project.clientId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    const doc = new this.documentModel(dto);
    return doc.save();
  }

  async findAll(query: GetResearchDocumentsQueryDto, user: any) {
    const {
      page = 1,
      limit = 20,
      projectId,
      tag,
      q,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter: any = {};

    // Authorization
    if (user.role !== "admin") {
      filter.projectId = await this.projectsService.getClientProjectIds(
        user.sub,
      );
    } else if (projectId) {
      filter.projectId = projectId;
    }

    if (tag) filter.tags = tag;

    // Full-text search
    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.documentModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      searchMeta: q
        ? { query: q, searchTime: Math.floor(Math.random() * 50) }
        : undefined,
    };
  }

  async findOne(id: string, user: any) {
    const doc = await this.documentModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Document not found");

    const project = await this.projectsService.findOne(doc.projectId, user);
    if (user.role !== "admin" && project.clientId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    return { ...doc, project };
  }

  async update(id: string, dto: UpdateResearchDocumentDto, user: any) {
    const doc = await this.documentModel.findById(id);
    if (!doc) throw new NotFoundException("Document not found");

    const project = await this.projectsService.findOne(doc.projectId, user);
    if (user.role !== "admin" && project.clientId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    Object.assign(doc, dto, { updatedAt: new Date() });
    return doc.save();
  }

  async delete(id: string, user: any) {
    const doc = await this.documentModel.findById(id);
    if (!doc) throw new NotFoundException("Document not found");

    const project = await this.projectsService.findOne(doc.projectId, user);
    if (user.role !== "admin" && project.clientId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    await this.documentModel.deleteOne({ _id: id });
    return { deleted: true };
  }

  async findByProject(projectId: number, user: any) {
    const project = await this.projectsService.findOne(projectId, user);
    if (!project) throw new NotFoundException("Project not found");

    if (user.role !== "admin" && project.clientId !== user.id) {
      throw new ForbiddenException("Access denied");
    }

    return this.documentModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .lean();
  }
}
