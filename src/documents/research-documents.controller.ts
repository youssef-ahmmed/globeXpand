import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ResearchDocumentsService } from "./research-documents.service";
import {
  CreateResearchDocumentDto,
  GetResearchDocumentsQueryDto,
  UpdateResearchDocumentDto,
} from "./dto/research-document.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Research Documents")
@ApiBearerAuth("JWT-auth")
@Controller("documents")
export class ResearchDocumentsController {
  constructor(private readonly documentsService: ResearchDocumentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new research document" })
  async create(@Body() dto: CreateResearchDocumentDto, @Req() req) {
    return this.documentsService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Get all research documents" })
  async findAll(@Query() query: GetResearchDocumentsQueryDto, @Req() req) {
    return this.documentsService.findAll(query, req.user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get research document by ID" })
  async findOne(@Param("id") id: string, @Req() req) {
    return this.documentsService.findOne(id, req.user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update research document by ID" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateResearchDocumentDto,
    @Req() req,
  ) {
    return this.documentsService.update(id, dto, req.user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete research document by ID" })
  async delete(@Param("id") id: string, @Req() req) {
    return this.documentsService.delete(id, req.user);
  }
}
