import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TopVendorsQueryDto } from './dto/top-vendors-query.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('top-vendors')
    @ApiOperation({ summary: 'Top vendors per country (admin only)' })
    async getTopVendors(@Query() query: TopVendorsQueryDto) {
        return this.analyticsService.getTopVendors(query.days, query.limit);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Dashboard statistics overview (admin only)' })
    async getDashboard() {
        return this.analyticsService.getDashboard();
    }
}
