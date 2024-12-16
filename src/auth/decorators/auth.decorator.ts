import { UseGuards, applyDecorators } from '@nestjs/common';
import { PassportModule,AuthGuard } from '@nestjs/passport';


import { RolProtected } from './role-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { Role } from '@prisma/client';

export function Auth(...roles: Role[]) {

  return applyDecorators(
    RolProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard)
  );
}