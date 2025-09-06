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
import { Project } from "./project.entity";

@Entity("project_service")
@Unique(["projectId", "service"])
@Index(["projectId"])
@Index(["service"])
export class ProjectService {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "project_id", type: "bigint" })
  projectId: number;

  @Column({ type: "varchar", length: 64 })
  service: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.services, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;
}
