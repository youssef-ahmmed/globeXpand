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

@Entity("vendor_service")
@Unique(["vendorId", "service"])
@Index(["vendorId"])
@Index(["service"])
export class VendorService {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "vendor_id", type: "bigint" })
  vendorId: number;

  @Column({ type: "varchar", length: 64 })
  service: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Vendor, (vendor) => vendor.services, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;
}
