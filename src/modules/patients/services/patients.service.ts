import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { AppointmentService } from 'src/modules/appointments/services/appointment.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    try {
        createPatientDto.document = createPatientDto.document.replace(/^-+|-+$/g, '');
        return await this.patientRepo.save(createPatientDto);
    } catch (error) {
      console.error('Error en la creación del paciente:', error);
      throw new InternalServerErrorException('No se pudo crear el paciente');
    }
  }

  async findAll(): Promise<Patient[]> {
    return await this.patientRepo.find({
      order: {
        document: 'ASC', // Opcional: ordenarlos alfabéticamente
      },
    });
  }

  async findOne(id: string): Promise<Patient | null> {
    return await this.patientRepo.findOne({
      where: { id },
      relations: ['appointments'] // Trae las citas del paciente
    });
  }
}