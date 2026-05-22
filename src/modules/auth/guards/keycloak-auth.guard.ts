import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'http://localhost:8080/realms/piedrazul/protocol/openid-connect/certs',
});

function getKey(header: any, callback: any) {
  console.log('BUSCANDO CLAVE PARA KID:', header.kid);
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      console.error('ERROR AL OBTENER CLAVE:', err?.message);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    console.log('CLAVE OBTENIDA CORRECTAMENTE');
    callback(null, signingKey);
  });
}

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    console.log('TOKEN RECIBIDO (primeros 50 chars):', token.substring(0, 50));

    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
        if (err) {
          console.error('ERROR AL VERIFICAR TOKEN:', err.message);
          return reject(new UnauthorizedException('Token inválido'));
        }

        console.log('TOKEN VERIFICADO CORRECTAMENTE');
        console.log('ROLES DEL TOKEN:', decoded?.realm_access?.roles);

        const roles: string[] = decoded?.realm_access?.roles ?? [];

        request.user = {
          id: decoded.sub,
          username: decoded.preferred_username,
          email: decoded.email,
          role: roles.find(r =>
            ['ADMINISTRADOR','AGENDADOR','MEDICO','TERAPISTA','PACIENTE'].includes(r)
          ) ?? 'PACIENTE',
          roles,
          keycloakId: decoded.sub,
        };

        resolve(true);
      });
    });
  }
}