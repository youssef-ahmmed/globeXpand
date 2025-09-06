import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Project } from "@/projects/entities/project.entity";

export enum ClientRole {
  ADMIN = "admin",
  CLIENT = "client",
}

@Entity("client")
@Index(["contactEmail"])
@Index(["role"])
export class Client {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "company_name", type: "varchar", length: 255 })
  companyName: string;

  @Column({ name: "contact_email", type: "varchar", length: 255, unique: true })
  contactEmail: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({
    type: "enum",
    enum: ClientRole,
    default: ClientRole.CLIENT,
  })
  role: ClientRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];
}
