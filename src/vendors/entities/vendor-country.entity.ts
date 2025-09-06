import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Vendor } from "./vendor.entity";

@Entity("vendor_country")
@Unique(["vendorId", "country"])
@Index(["vendorId"])
@Index(["country"])
export class VendorCountry {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "vendor_id", type: "bigint" })
  vendorId: number;

  @Column({ type: "char", length: 2 })
  country: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Vendor, (vendor) => vendor.countries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;
}
