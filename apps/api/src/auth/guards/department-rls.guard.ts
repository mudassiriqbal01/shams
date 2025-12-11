import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '@shams-vision/shared';

@Injectable()
export class DepartmentRlsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || !user.activeDepartmentId) {
      throw new ForbiddenException('No active department context');
    }

    // Add department context to request for use in services
    request.departmentId = user.activeDepartmentId;
    request.userId = user.userId;

    return true;
  }
}
