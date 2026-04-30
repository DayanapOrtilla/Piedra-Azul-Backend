import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { User } from '../../../modules/users/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
        document: 'ASC',
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
      relations: ['appointments', ]
    });
  }

  async findByDocument(document: string): Promise<Patient | null> {
    return await this.patientRepo.findOne({
      where: { document },
    });
  }

  async findByUser(user: string): Promise<Patient | null> {
    return await this.patientRepo.findOne({
      where: {user: {id: user}},
    });
  }

  async linkUser(patientId: string, userId: string): Promise <Patient> {
    const [patient, user] = await Promise.all([
      this.patientRepo.findOne({ where: { id: patientId } }),
      this.userRepo.findOne({ where: { id: userId } })
    ]);

    if (!patient) { throw new NotFoundException(`El paciente con ID ${patientId} no existe.`); }

    if (!user) { throw new NotFoundException(`El usuario con ID ${userId} no existe.`); }

    if (patient.user) { throw new BadRequestException('El paciente ya tiene un usuario vinculado.'); }

    patient.user = user;
    
    return await this.patientRepo.save(patient);
  }

  async search(term: string): Promise<Patient[]>{
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