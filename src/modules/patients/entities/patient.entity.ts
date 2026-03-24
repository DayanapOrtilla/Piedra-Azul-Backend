import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Check } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';

@Entity('patients')
@Check(`"document" ~ '^[0-9-]+$'`)
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'varchar',
    length: 10,
    unique: true 
  })
  document: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column ({nullable: true})
  birthdate: Date;

  @Column({
    type: 'enum',
    enum: PatientGender,
  })
  gender: PatientGender;

  @Column()
  phone: string;

  @Column({ nullable: true})
  email: string;

  @Column ( {default: true})
  isActive: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];
}