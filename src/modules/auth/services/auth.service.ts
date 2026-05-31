import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { LoginDto } from '../dto/auth.login.dto';
import { RegisterPatientDto } from '../../../application/patient-registration/dto/register-patient.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { user: loginDto.user, isActive: true },
      select: ['id', 'user', 'password', 'role', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      user: user.user,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    let patientProfile: Patient | null = null;

    if (user.role === ('PACIENTE' as any)) {
      patientProfile = await this.patientRepo.findOne({
        where: { document: user.user },
      });
    }

    return {
      user: {
        id: user.id,
        user: user.user,
        document: patientProfile?.document ?? (user.role === ('PACIENTE' as any) ? user.user : undefined),
        firstName: patientProfile?.firstName,
        lastName: patientProfile?.lastName,
        email: patientProfile?.email,
        phone: patientProfile?.phone,
        role: user.role,
        isActive: user.isActive,
      },
      token,
      access_token: token,
    };
  }

  async register(registerDto: RegisterPatientDto) {
    const document = registerDto.document.trim();

    const existingUser = await this.userRepo.findOne({
      where: { user: document },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario registrado con este documento.');
    }

    const existingPatient = await this.patientRepo.findOne({
      where: { document },
    });

    if (existingPatient) {
      throw new ConflictException('Ya existe un paciente registrado con este documento.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new User();
    user.user = document;
    user.password = hashedPassword;
    user.role = 'PACIENTE' as any;
    user.isActive = true;

    const savedUser = await this.userRepo.save(user);

    const patient = new Patient();
    patient.document = document;
    patient.firstName = registerDto.firstName;
    patient.lastName = registerDto.lastName;
    patient.birthdate = (registerDto as any).birthdate;
    patient.phone = registerDto.phone;
    patient.gender = registerDto.gender as any;
    patient.email = registerDto.email;
    patient.isActive = true;
    patient.user = savedUser;

    const savedPatient = await this.patientRepo.save(patient);

    return {
      message: 'Paciente registrado con éxito',
      id: savedPatient.id,
      role: savedUser.role,
    };
  }
}

