import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Role } from "../decorators/roles.decorator";

@Injectable()
export class OwnershipGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin can access everything
    if (user.role === Role.ADMIN) {
      return true;
    }

    // For clients, check ownership based on the resource
    if (user.role === Role.CLIENT) {
      const resourceClientId = this.extractClientId(request);

      if (resourceClientId && resourceClientId !== user.clientId) {
        throw new ForbiddenException("Access denied to this resource");
      }
    }

    return true;
  }

  private extractClientId(request: any): number | null {
    // From query parameters
    if (request.query.clientId) {
      return parseInt(request.query.clientId, 10);
    }

    // From route parameters
    if (request.params.clientId) {
      return parseInt(request.params.clientId, 10);
    }

    // From body
    if (request.body && request.body.clientId) {
      return parseInt(request.body.clientId, 10);
    }

    return null;
  }
}
