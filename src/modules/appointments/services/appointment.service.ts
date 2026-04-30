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
        const availability = await this.availabilityRepo.findOne({
            where: {
                professional: {id: createAppointmentDto.professionalId},
                dayOfWeek: dayOfWeek,
                isActive: true
            }
        })

        if (!availability) {
            throw new BadRequestException('El profesional no tiene agenda en el dia seleccionado');
        }

        //TODO: Validador de que la cita esté en el rango de disponibilidad

        const newAppointment = this.appointmentRepo.create({
            ...createAppointmentDto,
            patient: {id: createAppointmentDto.patientId},
            professional: { id: createAppointmentDto.professionalId},
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

  // Filtrado por PROFESIONAL — solo si es un UUID válido
  if (professionalId && professionalId.length > 30) {
    where.professional = { id: professionalId };
  }

  // Filtrado por FECHA — se agrega al final para no pisar el objeto professional
  const finalWhere = date ? { ...where, date } : where;

  return await this.appointmentRepo.find({
    relations: ['patient', 'professional', 'patient.user', 'professional.user'],
    order: { time: 'ASC' },
    where: finalWhere,
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
