import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '@/matches/entities/match.entity';
import { Project, ProjectStatus } from '@/projects/entities/project.entity';
import { Vendor } from '@/vendors/entities/vendor.entity';
import { Client } from '@/clients/entities/client.entity';
import { ProjectService } from '@/projects/entities/project-service.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResearchDocument } from '@/documents/schemas/research-document.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
        @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
        @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
        @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
        @InjectRepository(ProjectService) private readonly projectServiceRepo: Repository<ProjectService>,
        @InjectModel(ResearchDocument.name) private readonly researchModel: Model<ResearchDocument>,
    ) {}

    /**
     * GET /analytics/top-vendors
     * - days: number of days to look back
     * - limit: top N vendors per country
     */
    async getTopVendors(days = 30, limit = 3) {
        const mysqlStart = Date.now();

        // since date
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);

        // Aggregate average score and count per vendor per country
        // Using QueryBuilder and raw results then group per country in JS
        const raw = await this.matchRepo
            .createQueryBuilder('m')
            .select('p.country', 'country')
            .addSelect('m.vendorId', 'vendorId')
            .addSelect('v.name', 'vendorName')
            .addSelect('v.rating', 'rating')
            .addSelect('AVG(m.score)', 'avgScore')
            .addSelect('COUNT(*)', 'matchCount')
            .innerJoin('m.project', 'p')
            .innerJoin('m.vendor', 'v')
            .where('m.createdAt >= :since', { since })
            .groupBy('p.country, m.vendorId, v.name, v.rating')
            .getRawMany();

        // normalize numbers and group by country
        const grouped = new Map<string, Array<any>>();
        for (const r of raw) {
            const country = String(r.country);
            const item = {
                vendorId: Number(r.vendorId),
                vendorName: String(r.vendorName),
                avgScore: parseFloat(String(r.avgScore)),
                matchCount: Number(r.matchCount),
                rating: Number(r.rating ?? 0),
            };
            if (!grouped.has(country)) grouped.set(country, []);
            grouped.get(country)!.push(item);
        }

        // For each country pick top N by avgScore desc
        const result: Array<any> = [];
        const countries = Array.from(grouped.keys());

        // precompute project id lists per country for mongodb queries
        const mysqlEnd = Date.now();
        const mysqlTimeMs = mysqlEnd - mysqlStart;

        const mongoStart = Date.now();

        for (const country of countries) {
            const vendors = grouped.get(country)!;
            vendors.sort((a, b) => b.avgScore - a.avgScore);
            const topVendors = vendors.slice(0, limit);

            // get project ids for this country
            const projectRows = await this.projectRepo
                .createQueryBuilder('p')
                .select('p.id', 'id')
                .where('p.country = :country', { country })
                .getRawMany();

            const projectIds = projectRows.map((r) => Number(r.id)).filter(Boolean);

            const documentsCount = projectIds.length
                ? await this.researchModel.countDocuments({ projectId: { $in: projectIds } })
                : 0;

            const activeProjectsCount = await this.projectRepo
                .createQueryBuilder('p')
                .where('p.country = :country', { country })
                .andWhere('p.status = :status', { status: ProjectStatus.ACTIVE })
                .getCount();

            result.push({
                country,
                topVendors,
                documentsCount,
                activeProjectsCount,
            });
        }

        const mongoEnd = Date.now();
        const mongoTimeMs = mongoEnd - mongoStart;

        const meta = {
            periodDays: days,
            generatedAt: new Date().toISOString(),
            totalCountries: result.length,
            queryTime: {
                mysql: mysqlTimeMs,
                mongodb: mongoTimeMs,
                total: mysqlTimeMs + mongoTimeMs,
            },
        };

        return {
            data: result,
            meta,
        };
    }

    /**
     * GET /analytics/dashboard
     * Return overview counts & top lists
     */
    async getDashboard() {
        const start = Date.now();

        // 1) counts (parallel)
        const [
            totalClients,
            totalProjects,
            activeProjects,
            totalVendors,
            activeVendors,
            totalMatches,
            totalDocuments,
        ] = await Promise.all([
            this.clientRepo.count(),
            this.projectRepo.count(),
            this.projectRepo.count({ where: { status: ProjectStatus.ACTIVE } }),
            this.vendorRepo.count(),
            this.vendorRepo.count({ where: { isActive: true } }),
            this.matchRepo.count(),
            this.researchModel.countDocuments({}),
        ]);

        // start of today (UTC)
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

        // 2) recent activity (today)
        const [
            projectsCreatedToday,
            matchesCreatedToday,
            documentsUploadedToday,
        ] = await Promise.all([
            this.projectRepo
                .createQueryBuilder('p')
                .where('p.createdAt >= :start', { start: startOfToday })
                .getCount(),
            this.matchRepo
                .createQueryBuilder('m')
                .where('m.createdAt >= :start', { start: startOfToday })
                .getCount(),
            this.researchModel.countDocuments({ createdAt: { $gte: startOfToday } }),
        ]);

        // 3) top countries by project count (top 3)
        const topCountriesRaw = await this.projectRepo
            .createQueryBuilder('p')
            .select('p.country', 'country')
            .addSelect('COUNT(*)', 'projectCount')
            .groupBy('p.country')
            .orderBy('projectCount', 'DESC')
            .limit(3)
            .getRawMany();

        const topCountries = topCountriesRaw.map((r) => {
            const projectCount = Number(r.projectCount);
            const percentage = totalProjects ? +(100 * (projectCount / totalProjects)).toFixed(1) : 0;
            return {
                country: r.country,
                projectCount,
                percentage,
            };
        });

        // 4) top services across projects (use project_service table) - top 3
        const topServicesRaw = await this.projectServiceRepo
            .createQueryBuilder('ps')
            .select('ps.service', 'service')
            .addSelect('COUNT(DISTINCT ps.projectId)', 'projectCount')
            .groupBy('ps.service')
            .orderBy('projectCount', 'DESC')
            .limit(3)
            .getRawMany();

        const topServices = topServicesRaw.map((r) => {
            const projectCount = Number(r.projectCount);
            const percentage = totalProjects ? +(100 * (projectCount / totalProjects)).toFixed(1) : 0;
            return {
                service: r.service,
                projectCount,
                percentage,
            };
        });

        const end = Date.now();
        const elapsedMs = end - start;

        return {
            overview: {
                totalClients,
                totalProjects,
                activeProjects,
                totalVendors,
                activeVendors,
                totalMatches,
                totalDocuments,
            },
            recentActivity: {
                projectsCreatedToday,
                matchesCreatedToday,
                documentsUploadedToday,
            },
            topCountries,
            topServices,
            meta: {
                generatedAt: new Date().toISOString(),
                queryTimeMs: elapsedMs,
            },
        };
    }
}
