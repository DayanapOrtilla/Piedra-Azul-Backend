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
    const queryOptions: any = {
    // 'professional.user' y 'patient.user' para que las relaciones estén completas
    relations: ['patient', 'professional', 'patient.user', 'professional.user'],
      order: { date: 'DESC' },
      where: {}
    };

    //Filtrado por ROL (Seguridad)
    if (role === UserRole.PACIENTE) {
      queryOptions.where.patient = { user: { id: userId } };
    } 
    else if (role === UserRole.MEDICO || role === UserRole.TERAPISTA) {
      queryOptions.where.professional = { user: { id: userId } };
    }
    // Si es ADMIN/AGENDADOR, queryOptions.where se queda vacío aquí (ve todo)

    //Filtrado por FECHA
    if (date) {
      queryOptions.where.date = date; // TypeORM maneja el string 'YYYY-MM-DD' directo
    }

    // 3. Filtrado por PROFESIONAL
    if (professionalId) {
      queryOptions.where.professional = { id: professionalId };
    }

    return await this.appointmentRepo.find(queryOptions);
  }
}