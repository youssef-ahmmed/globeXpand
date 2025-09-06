import { SetMetadata } from "@nestjs/common";

export enum Role {
  ADMIN = "admin",
  CLIENT = "client",
}

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
