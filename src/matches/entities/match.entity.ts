import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "../../projects/entities/project.entity";
import { Vendor } from "../../vendors/entities/vendor.entity";

@Entity("match_table")
@Unique(["projectId", "vendorId"])
@Index(["projectId"])
@Index(["vendorId"])
@Index(["score"])
@Index(["createdAt"])
export class Match {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "project_id", type: "bigint" })
  projectId: number;

  @Column({ name: "vendor_id", type: "bigint" })
  vendorId: number;

  @Column({ type: "decimal", precision: 6, scale: 2 })
  score: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.matches, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @ManyToOne(() => Vendor, (vendor) => vendor.matches, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;
}
