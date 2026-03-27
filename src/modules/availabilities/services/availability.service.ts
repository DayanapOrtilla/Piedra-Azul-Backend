import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
    private dataSource: DataSource,
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

  async findByProfessionalId(professionalId: string): Promise<Availability[]> {
    return await this.availabilityRepo.find({
      where: { professional: { id: professionalId } },
      order: { dayOfWeek: 'ASC' }
    });
  }

  async findById(id: string): Promise<Availability> {
    const availability = await this.availabilityRepo.findOne({where: {id}});

    if (!availability) {
        throw new NotFoundException('El horario de disponibilidad no existe');
    }
    return availability;
  }

  async update(id: string, availabilities: UpdateAvailabilityDto[]): Promise<Availability[]> {
    // 1. VALIDACIÓN LOGICA: Fin > Inicio
    for (const day of availabilities) {
      if (day.isActive) {
        if (day.endTime <= day.startTime) {
          throw new BadRequestException(
            `Error en el día ${day.dayOfWeek}: La hora de fin (${day.endTime}) debe ser posterior a la de inicio (${day.startTime}).`
          );
        }
      }
    }

    // 2. TRANSACCIÓN: Borrar lo viejo y guardar lo nuevo
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Eliminar disponibilidad previa del profesional
      await queryRunner.manager.delete(Availability, {professional : {id:id}});

      // Insertar la nueva configuración
      const newAvailabilities = availabilities.map(d => 
        this.availabilityRepo.create({
          ...d, 
          professional: {id: id}
        })
      );
      
      const saved = await queryRunner.manager.save(newAvailabilities);
      
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deactivate(id: string): Promise<Availability>{
    const availability = await this.availabilityRepo.findOne({where: {id}});

    if (!availability) {
        throw new NotFoundException('El horario de disponibilidad no existe');
    }
    availability.isActive=!availability.isActive;

    const updated = this.availabilityRepo.merge(availability);
    return await this.availabilityRepo.save(updated);
  }
}