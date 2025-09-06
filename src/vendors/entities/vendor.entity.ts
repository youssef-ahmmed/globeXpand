import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { VendorService } from "./vendor-service.entity";
import { VendorCountry } from "./vendor-country.entity";
import { Match } from "@/matches/entities/match.entity";

@Entity("vendor")
@Index(["name"])
@Index(["contactEmail"])
@Index(["isActive"])
@Index(["rating"])
@Check(`rating >= 0 AND rating <= 5`)
export class Vendor {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "contact_email", type: "varchar", length: 255, unique: true })
  contactEmail: string;

  @Column({ type: "tinyint", unsigned: true, default: 0 })
  rating: number;

  @Column({
    name: "response_sla_hours",
    type: "smallint",
    unsigned: true,
    default: 48,
  })
  responseSlaHours: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => VendorService, (service) => service.vendor, {
    cascade: true,
    eager: true,
  })
  services: VendorService[];

  @OneToMany(() => VendorCountry, (country) => country.vendor, {
    cascade: true,
    eager: true,
  })
  countries: VendorCountry[];

  @OneToMany(() => Match, (match) => match.vendor)
  matches: Match[];
}
