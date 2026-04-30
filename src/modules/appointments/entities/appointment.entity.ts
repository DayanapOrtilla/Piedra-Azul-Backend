import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Professional } from '../../professionals/entities/professional.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { AppointmentStatus } from '../../../shared/enum/appointment-status.enum';
import { ProfessionalSpeciality } from '../../../shared/enum/professional-speciality.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time' })
  time!: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDIENTE,
   })
  status!: AppointmentStatus;

  @ManyToOne(() => Professional, (professional) => professional.appointments)
  professional!: Professional;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient!: Patient;
}