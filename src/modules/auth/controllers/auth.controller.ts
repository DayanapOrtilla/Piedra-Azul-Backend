import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/auth.login.dto';
import { UsersService } from '../../../modules/users/services/users.service';
import { Public } from '../decorators/public.decorator';
import { RegisterPatientDto } from '../../../application/patient-registration/dto/register-patient.dto';
import { PatientRegistrationService } from '../../../application/patient-registration/services/patient-registration.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly patientRegService: PatientRegistrationService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterPatientDto) {
    return await this.patientRegService.register(registerDto);
  }
}