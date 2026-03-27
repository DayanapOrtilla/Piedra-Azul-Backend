import { Controller, Post, Body, Get, ParseUUIDPipe, Param, Delete, Patch, UseGuards, Query, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UserRole } from '../../../shared/enum/user-role.enum';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { Public } from '../../../modules/auth/decorators/public.decorator';
import { SeedService } from '../services/seed.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly seedService: SeedService,
  ) {}

  @Get('seed/run')
  @Public() // <--- Importante para poder ejecutarlo sin estar logueado la primera vez
  async executeSeed() {
    return await this.seedService.runSeed(); // Asegúrate de inyectar el SeedService o poner la lógica en UsersService
  }

  @Get()
  @Roles(UserRole.ADMINISTRADOR)
  async findAll(@Query('role') role?: UserRole) {
    return await this.usersService.findAllFiltered(role);
  }

  // ADMINISTRADOR crea Staff / AGENDADOR crea Paciente con o sin User
  @Post('register-patient')
  @Roles(UserRole.ADMINISTRADOR, UserRole.AGENDADOR)
  async createAccount(@Body() dto: any, @Req() req: any) {
    return this.usersService.registerPatient(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMINISTRADOR, UserRole.AGENDADOR)
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string, @Body('isActive') isActive: boolean, @Req() req: any) {
    return await this.usersService.updateStatus(id, isActive, req.user);
  }

  @Patch(':id/password')
  async updatePassword(@Param('id', ParseUUIDPipe) id: string, @Body('newPassword') newPass: string, @Req() req: any) {
    if (req.user.role !== UserRole.ADMINISTRADOR && req.user.sub !== id) {
      throw new ForbiddenException('No tienes permiso para cambiar esta contraseña');
    }
    return await this.usersService.changePassword(id, newPass);
  }
}