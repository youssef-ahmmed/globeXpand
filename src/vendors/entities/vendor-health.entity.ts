import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("vendor_health")
export class VendorHealth {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "vendor_id", type: "bigint", unique: true })
  @Index()
  vendorId: number;

  @Column({ name: "sla_expired", type: "boolean", default: false })
  slaExpired: boolean;

  @Column({ name: "last_checked_at", type: "timestamp", nullable: true })
  lastCheckedAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
