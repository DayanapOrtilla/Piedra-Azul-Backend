import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
  ) {}

  async createDefaultSchedule(professional: Professional) {
    const defaultAvailabilities: Availability[] = [];

    for (let day = 0; day <= 6; day++) {
      const availability = this.availabilityRepo.create({
        dayOfWeek: day,
        startTime: '08:00:00',
        endTime: '12:00:00',
        isActive: false,
        professional: professional, // Aquí pasamos el objeto que recibimos
      });
      defaultAvailabilities.push(availability);
    }

    return await this.availabilityRepo.save(defaultAvailabilities);
  }

  async findAll(): Promise<Availability[]> {
    return await this.availabilityRepo.find({
      relations: ['professional'], // Incluye los datos del médico dueño del horario
      order: {
        dayOfWeek: 'ASC', // Los ordena de Domingo (0) a Sabado (6)
        startTime: 'ASC', // Y luego por hora de inicio
      },
    });
  }

  async findByProfessional(professionalId: string): Promise<Availability[]> {
    return await this.availabilityRepo.find({
      where: { professional: { id: professionalId } },
      order: { dayOfWeek: 'ASC' }
    });
  }

  async update(id: string, updateData: UpdateAvailabilityDto): Promise<Availability> {
    const availability = await this.availabilityRepo.findOne({where: {id}});

    if (!availability) {
        throw new NotFoundException('El horario de disponibilidad no existe');
    }

    const { startTime, endTime } = updateData;

    if (startTime && endTime) {
      if (startTime >= endTime) {
        throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
      }
    }

    const updated = this.availabilityRepo.merge(availability, updateData);
    return await this.availabilityRepo.save(updated);
  }
}