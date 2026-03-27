import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { AppointmentService } from '../../../modules/appointments/services/appointment.service';
import { UpdatePatientDto } from '../dto/update-patient.dto';

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

  async update(id: string, updatePatientDto: UpdatePatientDto) {
  const patient = await this.patientRepo.preload({
    id: id,
    ...updatePatientDto,
  });

  if (!patient) throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
  
  return await this.patientRepo.save(patient);
}

  async findOne(id: string): Promise<Patient | null> {
    return await this.patientRepo.findOne({
      where: { id },
      relations: ['appointments'] // Trae las citas del paciente
    });
  }

  async search(term: string) {
    if (!term) return this.findAll();

    return await this.patientRepo.find({
      where: [
        { firstName: ILike(`%${term}%`) },
        { lastName:  ILike(`%${term}%`) },
        { document:  ILike(`%${term}%`) }
      ],
      order: { firstName: 'ASC' }
    });
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    
    if (!patient) {
      throw new NotFoundException(`No se pudo eliminar: el paciente no existe.`);
    }

    return await this.patientRepo.remove(patient);
  }

  async deactivate(id: string) {
    const patient = await this.findOne(id);
    if (!patient) {
      throw new NotFoundException(`El paciente con ID ${id} no existe.`);
    }
    patient.isActive = false;
    return await this.patientRepo.save(patient);
  }
}