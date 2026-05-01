import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { Availability } from '../../../modules/availabilities/entities/availability.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
  ) {}

    async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
  const date = new Date(createAppointmentDto.date);
  const dayOfWeek = date.getUTCDay();

  // Verificar disponibilidad del profesional ese día
  const availability = await this.availabilityRepo.findOne({
    where: {
      professional: { id: createAppointmentDto.professionalId },
      dayOfWeek: dayOfWeek,
      isActive: true
    }
  });

  if (!availability) {
    throw new BadRequestException('El profesional no tiene agenda en el día seleccionado');
  }

  // Verificar que no exista una cita en la misma fecha y hora para el mismo profesional
  const existingAppointment = await this.appointmentRepo.findOne({
    where: {
      professional: { id: createAppointmentDto.professionalId },
      date: createAppointmentDto.date,
      time: createAppointmentDto.time,
    }
  });

  if (existingAppointment) {
    throw new BadRequestException('Ya existe una cita para este profesional en la fecha y hora seleccionadas');
  }

  // Verificar que el paciente no tenga ya una cita en la misma fecha y hora
  const patientConflict = await this.appointmentRepo.findOne({
    where: {
      patient: { id: createAppointmentDto.patientId },
      date: createAppointmentDto.date,
      time: createAppointmentDto.time,
    }
  });

  if (patientConflict) {
    throw new BadRequestException('El paciente ya tiene una cita en la fecha y hora seleccionadas');
  }

  const newAppointment = this.appointmentRepo.create({
    ...createAppointmentDto,
    patient: { id: createAppointmentDto.patientId },
    professional: { id: createAppointmentDto.professionalId },
  });

  return await this.appointmentRepo.save(newAppointment);
}

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepo.find({
      relations: ['professional', 'patient'],
      order: {date: 'DESC'}
    });
  }

  // Para el frontend de Angular: Obtener appointmet con su cuadro de citas
  async findOne(id: string): Promise<Appointment | null> {
    return await this.appointmentRepo.findOne({
      where: { id },
      relations: ['professionals', 'patients']
    });
  }

  async findByUser(userId: string, role: string, date?: string, professionalId?: string): Promise<Appointment[]> {
  const where: any = {};

  // Filtrado por ROL
  if (role === UserRole.PACIENTE) {
    where.patient = { user: { id: userId } };
  } else if (role === UserRole.MEDICO || role === UserRole.TERAPISTA) {
    where.professional = { user: { id: userId } };
  }

  // Filtrado por PROFESIONAL
  if (professionalId && professionalId.length > 30) {
    where.professional = { id: professionalId };
  }

  // Filtrado por FECHA
  if (date) {
    where.date = date;
  }

  return await this.appointmentRepo.find({
    relations: ['patient', 'professional', 'patient.user', 'professional.user'],
    order: { time: 'ASC' },
    where,
  });
}
  async exportToCsv(professionalId?: string, date?: string): Promise<string> {
  const appointments = await this.findByUser('', 'ADMINISTRADOR', date, professionalId);

  const header = 'Hora,Documento,Nombre Completo,Celular\n';

  const rows = appointments.map(a => {
    const hora      = a.time ?? '';
    const documento = a.patient?.document ?? '';
    const nombre    = `${a.patient?.firstName ?? ''} ${a.patient?.lastName ?? ''}`.trim();
    const celular   = a.patient?.phone ?? '';
    return `${hora},${documento},${nombre},${celular}`;
  }).join('\n');

  return header + rows;
}
}
