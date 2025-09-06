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
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreateProjectDto } from "@/projects/dto/create-project.dto";
import { FilterProjectDto } from "@/projects/dto/filter-project.dto";
import { UpdateProjectDto } from "@/projects/dto/update-project.dto";
import { GetProjectMatchesDto } from "@/projects/dto/project-matches.dto";
import { ResearchDocumentsService } from "@/documents/research-documents.service";
import { RolesGuard } from "@/common/guards/roles.guard";

@ApiTags("Projects")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly researchDocumentsService: ResearchDocumentsService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  async findAll(@Query() query: FilterProjectDto, @Req() req) {
    return this.projectsService.findAll(query, req.user);
  }

  @Post()
  async create(@Body() dto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(dto, req.user);
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.projectsService.findOne(id, req.user);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @Req() req,
  ) {
    return this.projectsService.update(id, dto, req.user);
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  @Get(":id/matches")
  async getProjectMatches(
    @Param("id", ParseIntPipe) projectId: number,
    @Query() query: GetProjectMatchesDto,
    @Req() req,
  ) {
    return this.projectsService.getProjectMatches(projectId, query, req.user);
  }

  @Post(":id/matches/rebuild")
  async rebuildProjectMatches(
    @Param("id", ParseIntPipe) projectId: number,
    @Req() req,
  ) {
    return this.projectsService.rebuildProjectMatches(projectId, req.user);
  }

  @Get(":id/documents")
  @ApiOperation({ summary: "Get all research documents for a project" })
  async getProjectDocuments(
    @Param("id", ParseIntPipe) projectId: number,
    @Req() req,
  ) {
    return this.researchDocumentsService.findByProject(projectId, req.user);
  }
}
