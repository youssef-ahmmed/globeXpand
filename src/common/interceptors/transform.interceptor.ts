import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Don't transform if data already has pagination meta or is a health check
        if (
          data &&
          (data.meta ||
            request.url.includes("/health") ||
            request.url.includes("/docs"))
        ) {
          return data;
        }

        // Transform single responses
        return data;
      }),
    );
  }
}
