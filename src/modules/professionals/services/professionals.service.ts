import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional } from '../entities/professional.entity';
import { AvailabilityService } from '../../availabilities/services/availability.service';
import { CreateProfessionalDto } from '../dto/create-professional.dto';
import { User } from '../../../modules/users/entities/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';
import * as bcrypt from 'bcrypt';


@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalDto): Promise<Professional> {
    try {
      const emailExists = await this.userRepo.findOne({ where: { user: createProfessionalDto.email}});
      if (emailExists) throw new BadRequestException('El correo ya está registrado para otro usuario');

      let assignedRole: UserRole;

      const type = createProfessionalDto.type;

      if (type.includes('MEDICO')) {
        assignedRole = UserRole.MEDICO;
      } else if (type.includes('TERAPISTA')) {
        assignedRole = UserRole.TERAPISTA;
      } else {
        // Rol por defecto si no coincide con los anteriores
        assignedRole = UserRole.AGENDADOR; 
      }

      const hashedPassword = await bcrypt.hash(createProfessionalDto.password, 10);

      const newUser = this.userRepo.create({
        user: createProfessionalDto.email,
        password: hashedPassword,
        role: assignedRole,
      });

      const newProfessional = this.professionalRepo.create({...createProfessionalDto, user: newUser});
      const savedProfessional = await this.professionalRepo.save(newProfessional);

      await this.availabilityService.createDefaultSchedule(savedProfessional);
      const fullProfessional = await this.findOne(savedProfessional.id);

      if (!fullProfessional) {
        throw new InternalServerErrorException('Error al recuperar el profesional recién creado');
      }

      return fullProfessional;
    } catch (error) {
      console.error('Error en la creación del profesional:', error);
      throw new InternalServerErrorException('No se pudo crear el profesional con sus horarios base');
    }
  }

  async findAll(specialty?: string, isActive?: boolean): Promise<Professional[]> {
    const where: any = {};

    if (specialty) {
      where.specialty = specialty;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.professionalRepo.find({
      where,
      relations: ['availabilities'],
      order: {
        firstName: 'ASC',
      },
    });
  }

  // Para el frontend de Angular: Obtener profesional con su cuadro de horarios
  async findOne(id: string): Promise<Professional | null> {
    return await this.professionalRepo.findOne({
      where: { id },
      relations: ['availabilities'] // Trae el cuadro de horarios (Lunes a Domingo)
    });
  }
}