import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../../app.module";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Client } from "../../../clients/entities/client.entity";
import { Project } from "../../../projects/entities/project.entity";
import { ProjectService } from "../../../projects/entities/project-service.entity";
import { Vendor } from "../../../vendors/entities/vendor.entity";
import { VendorService } from "../../../vendors/entities/vendor-service.entity";
import { VendorCountry } from "../../../vendors/entities/vendor-country.entity";
import { Match } from "../../../matches/entities/match.entity";
import * as bcrypt from "bcrypt";

async function runSeeds() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const clientRepository = app.get<Repository<Client>>(
    getRepositoryToken(Client),
  );
  const projectRepository = app.get<Repository<Project>>(
    getRepositoryToken(Project),
  );
  const projectServiceRepository = app.get<Repository<ProjectService>>(
    getRepositoryToken(ProjectService),
  );
  const vendorRepository = app.get<Repository<Vendor>>(
    getRepositoryToken(Vendor),
  );
  const vendorServiceRepository = app.get<Repository<VendorService>>(
    getRepositoryToken(VendorService),
  );
  const vendorCountryRepository = app.get<Repository<VendorCountry>>(
    getRepositoryToken(VendorCountry),
  );
  const matchRepository = app.get<Repository<Match>>(getRepositoryToken(Match));

  console.log("🌱 Running MySQL seeds...");

  // Seed clients
  const clients = [
    {
      companyName: "TechStart Inc",
      contactEmail: "founder@techstart.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "client" as any,
    },
    {
      companyName: "GlobalCorp Ltd",
      contactEmail: "admin@globalcorp.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "admin" as any,
    },
    {
      companyName: "InnovateHub",
      contactEmail: "ceo@innovatehub.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "client" as any,
    },
  ];

  for (const client of clients) {
    const exists = await clientRepository.findOne({
      where: { contactEmail: client.contactEmail },
    });

    if (!exists) {
      await clientRepository.save(client);
      console.log(`✅ Created client: ${client.contactEmail}`);
    }
  }

  // Seed vendors
  const vendors = [
    {
      name: "Euro Legal Services",
      contactEmail: "contact@eurolegal.com",
      rating: 4,
      responseSlaHours: 24,
      isActive: true,
    },
    {
      name: "Global Marketing Co",
      contactEmail: "info@globalmarketing.com",
      rating: 4,
      responseSlaHours: 48,
      isActive: true,
    },
    {
      name: "Accounting Plus",
      contactEmail: "hello@accountingplus.com",
      rating: 5,
      responseSlaHours: 12,
      isActive: true,
    },
    {
      name: "HR Solutions EU",
      contactEmail: "contact@hrsolutions.eu",
      rating: 4,
      responseSlaHours: 36,
      isActive: true,
    },
  ];

  for (const vendor of vendors) {
    const exists = await vendorRepository.findOne({
      where: { contactEmail: vendor.contactEmail },
    });

    if (!exists) {
      await vendorRepository.save(vendor);
      console.log(`✅ Created vendor: ${vendor.name}`);
    }
  }

  // Seed projects
  const projects = [
    {
      clientId: 1,
      country: "DE",
      budget: 50000.0,
      status: "active" as any,
    },
    {
      clientId: 1,
      country: "FR",
      budget: 25000.0,
      status: "active" as any,
    },
    {
      clientId: 3,
      country: "ES",
      budget: 75000.0,
      status: "active" as any,
    },
  ];

  for (const [index, project] of projects.entries()) {
    const exists = await projectRepository.findOne({
      where: { clientId: project.clientId, country: project.country },
    });

    if (!exists) {
      await projectRepository.save(project);
      console.log(`✅ Created project: ${project.country}`);
    }
  }

  // Seed project services
  const projectServices = [
    { projectId: 1, service: "legal" },
    { projectId: 1, service: "accounting" },
    { projectId: 1, service: "marketing" },
    { projectId: 2, service: "legal" },
    { projectId: 2, service: "hr" },
    { projectId: 3, service: "marketing" },
    { projectId: 3, service: "legal" },
    { projectId: 3, service: "consulting" },
  ];

  for (const service of projectServices) {
    const exists = await projectServiceRepository.findOne({
      where: { projectId: service.projectId, service: service.service },
    });

    if (!exists) {
      await projectServiceRepository.save(service);
      console.log(
        `✅ Added service ${service.service} to project ${service.projectId}`,
      );
    }
  }

  // Seed vendor services
  const vendorServices = [
    { vendorId: 1, service: "legal" },
    { vendorId: 1, service: "compliance" },
    { vendorId: 2, service: "marketing" },
    { vendorId: 2, service: "advertising" },
    { vendorId: 3, service: "accounting" },
    { vendorId: 3, service: "tax" },
    { vendorId: 3, service: "audit" },
    { vendorId: 4, service: "hr" },
    { vendorId: 4, service: "recruitment" },
  ];

  for (const service of vendorServices) {
    const exists = await vendorServiceRepository.findOne({
      where: { vendorId: service.vendorId, service: service.service },
    });

    if (!exists) {
      await vendorServiceRepository.save(service);
      console.log(
        `✅ Added service ${service.service} to vendor ${service.vendorId}`,
      );
    }
  }

  // Seed vendor countries
  const vendorCountries = [
    { vendorId: 1, country: "DE" },
    { vendorId: 1, country: "FR" },
    { vendorId: 1, country: "ES" },
    { vendorId: 2, country: "DE" },
    { vendorId: 2, country: "US" },
    { vendorId: 2, country: "UK" },
    { vendorId: 3, country: "FR" },
    { vendorId: 3, country: "DE" },
    { vendorId: 3, country: "IT" },
    { vendorId: 4, country: "DE" },
    { vendorId: 4, country: "FR" },
    { vendorId: 4, country: "ES" },
  ];

  for (const country of vendorCountries) {
    const exists = await vendorCountryRepository.findOne({
      where: { vendorId: country.vendorId, country: country.country },
    });

    if (!exists) {
      await vendorCountryRepository.save(country);
      console.log(
        `✅ Added country ${country.country} to vendor ${country.vendorId}`,
      );
    }
  }

  // Seed matches
  const matches = [
    { projectId: 1, vendorId: 1, score: 9.0 },
    { projectId: 1, vendorId: 3, score: 8.5 },
    { projectId: 1, vendorId: 2, score: 7.0 },
    { projectId: 2, vendorId: 1, score: 8.0 },
    { projectId: 2, vendorId: 4, score: 7.5 },
    { projectId: 3, vendorId: 1, score: 8.2 },
    { projectId: 3, vendorId: 2, score: 8.8 },
  ];

  for (const match of matches) {
    const exists = await matchRepository.findOne({
      where: { projectId: match.projectId, vendorId: match.vendorId },
    });

    if (!exists) {
      await matchRepository.save(match);
      console.log(
        `✅ Created match: Project ${match.projectId} - Vendor ${match.vendorId} (Score: ${match.score})`,
      );
    }
  }

  console.log("🎉 MySQL seeds completed!");
  await app.close();
}

runSeeds().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
