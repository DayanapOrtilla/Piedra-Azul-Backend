import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('RolesGuard', () => {
  let reflector: any;
  let guard: RolesGuard;

  const crearContexto = (role: UserRole) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          user: {
            id: 'user-1',
            role,
          },
        })),
      })),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new RolesGuard(reflector);
  });

  it('debe permitir el acceso cuando la ruta no exige roles específicos', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(crearContexto(UserRole.PACIENTE));

    expect(result).toBe(true);
  });

  it('debe permitir el acceso cuando el usuario tiene uno de los roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMINISTRADOR,
      UserRole.AGENDADOR,
    ]);

    const result = guard.canActivate(crearContexto(UserRole.AGENDADOR));

    expect(result).toBe(true);
  });

  it('debe bloquear el acceso cuando el usuario no tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMINISTRADOR,
    ]);

    expect(() => guard.canActivate(crearContexto(UserRole.PACIENTE))).toThrow(
      ForbiddenException,
    );
  });
});