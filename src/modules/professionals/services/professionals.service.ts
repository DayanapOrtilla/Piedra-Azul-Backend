import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional } from '../entities/professional.entity';
import { AvailabilityService } from '../../availabilities/services/availability.service';
import { CreateProfessionalDto } from '../dto/create-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
    
    // Inyectamos el servicio que gestiona los marcos de tiempo
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalDto): Promise<Professional> {
    try {
      const newProfessional = this.professionalRepo.create(createProfessionalDto);
      const savedProfessional = await this.professionalRepo.save(newProfessional);

      const professionalToUse = Array.isArray(savedProfessional) 
        ? savedProfessional[0] 
        : savedProfessional;

        await this.availabilityService.createDefaultSchedule(professionalToUse);

        return professionalToUse;
    } catch (error) {
      console.error('Error en la creación del profesional:', error);
      throw new InternalServerErrorException('No se pudo crear el profesional con sus horarios base');
    }
  }

  async findAll(): Promise<Professional[]> {
    return await this.professionalRepo.find({
      // Esto es clave para Software III: trae al médico con su lista de horarios
      relations: ['availabilities'], 
      order: {
        lastName: 'ASC', // Opcional: ordenarlos alfabéticamente
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