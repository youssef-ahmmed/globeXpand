import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Client } from "@/clients/entities/client.entity";
import { ProjectService } from "./project-service.entity";
import { Match } from "@/matches/entities/match.entity";

export enum ProjectStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CLOSED = "closed",
}

@Entity("project")
@Index(["clientId"])
@Index(["country"])
@Index(["status"])
@Index(["createdAt"])
export class Project {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "client_id", type: "bigint" })
  clientId: number;

  @Column({ type: "char", length: 2 })
  country: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Client, (client) => client.projects, { onDelete: "CASCADE" })
  @JoinColumn({ name: "client_id" })
  client: Client;

  @OneToMany(() => ProjectService, (service) => service.project, {
    cascade: true,
    eager: true,
  })
  services: ProjectService[];

  @OneToMany(() => Match, (match) => match.project)
  matches: Match[];
}
