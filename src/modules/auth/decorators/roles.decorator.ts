import { SetMetadata } from '@nestjs/common';
import { Roles as KeycloakRoles } from 'nest-keycloak-connect';
import { UserRole } from '../../../shared/enum/user-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => {
  return (target: any, key: string, descriptor?: any) => {
    SetMetadata(ROLES_KEY, roles)(target, key, descriptor);
    SetMetadata('roles', roles)(target, key, descriptor);
  };
};