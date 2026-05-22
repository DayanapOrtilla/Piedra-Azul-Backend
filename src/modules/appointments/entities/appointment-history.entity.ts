import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointment_history')
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  appointment!: Appointment;

  @Column({ type: 'date' })
  previousDate!: Date;

  @Column({ type: 'time' })
  previousTime!: string;

  @Column({ type: 'date' })
  newDate!: Date;

  @Column({ type: 'time' })
  newTime!: string;

  @ManyToOne(() => User, { nullable: true })
  rescheduledBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'text', nullable: true })
  reason!: string;
}