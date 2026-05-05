import { SetMetadata } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => {
  return (target: any, key: string, descriptor?: any) => {
    SetMetadata(IS_PUBLIC_KEY, true)(target, key, descriptor);
    Unprotected()(target, key, descriptor);
  };
};