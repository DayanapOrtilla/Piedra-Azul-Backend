import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
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

    @InjectRepository(AppointmentHistory)
    private readonly historyRepo: Repository<AppointmentHistory>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const date = new Date(createAppointmentDto.date);
    const dayOfWeek = date.getUTCDay();

    const availability = await this.availabilityRepo.findOne({
      where: {
        professional: { id: createAppointmentDto.professionalId },
        dayOfWeek,
        isActive: true
      }
    });

    if (!availability) {
      throw new BadRequestException('El profesional no tiene agenda en el día seleccionado');
    }

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

  async reschedule(
    id: string,
    newDate: string,
    newTime: string,
    rescheduledById: string,
    reason?: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['professional', 'patient'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Verificar disponibilidad en el nuevo horario
    const date = new Date(newDate);
    const dayOfWeek = date.getUTCDay();

    const availability = await this.availabilityRepo.findOne({
      where: {
        professional: { id: appointment.professional.id },
        dayOfWeek,
        isActive: true,
      }
    });

    if (!availability) {
      throw new BadRequestException('El profesional no tiene agenda en el día seleccionado');
    }

    // Verificar que no haya conflicto con otra cita
    const conflict = await this.appointmentRepo.findOne({
      where: {
        professional: { id: appointment.professional.id },
        date: newDate as any,
        time: newTime,
      }
    });

    if (conflict && conflict.id !== id) {
      throw new BadRequestException('Ya existe una cita en la nueva fecha y hora seleccionadas');
    }

    // Guardar historial
    const history = this.historyRepo.create({
      appointment: { id },
      previousDate: appointment.date,
      previousTime: appointment.time,
      newDate: newDate as any,
      newTime,
      rescheduledBy: { id: rescheduledById },
      reason,
    });
    await this.historyRepo.save(history);

    // Actualizar la cita
    appointment.date = newDate as any;
    appointment.time = newTime;
    return await this.appointmentRepo.save(appointment);
  }

  async getHistory(id: string): Promise<AppointmentHistory[]> {
    return await this.historyRepo.find({
      where: { appointment: { id } },
      relations: ['rescheduledBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepo.find({
      relations: ['professional', 'patient'],
      order: { date: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Appointment | null> {
    return await this.appointmentRepo.findOne({
      where: { id },
      relations: ['professional', 'patient'],
    });
  }

  async findByUser(userId: string, role: string, date?: string, professionalId?: string): Promise<Appointment[]> {
    const where: any = {};

    if (role === UserRole.PACIENTE) {
      where.patient = { user: { id: userId } };
    } else if (role === UserRole.MEDICO || role === UserRole.TERAPISTA) {
      where.professional = { user: { id: userId } };
    }

    if (professionalId && professionalId.length > 30) {
      where.professional = { id: professionalId };
    }

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