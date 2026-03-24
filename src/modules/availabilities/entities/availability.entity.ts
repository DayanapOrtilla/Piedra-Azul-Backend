import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { Professional } from '../../professionals/entities/professional.entity';

@Entity('availabilities')
@Check(`"dayOfWeek" >= 0 and "dayOfWeek" <= 6`)
@Check( `"startTime" < "endTime"`)
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dayOfWeek: number; // 0 para Domingo, 1 para Lunes, etc.

  @Column({ type: 'time' })
  startTime: string; // Ejemplo: "08:00:00"

  @Column({ type: 'time' })
  endTime: string;   // Ejemplo: "12:00:00"

  @Column({ default: true })
  isActive: boolean;

  // Relación: Muchas disponibilidades pertenecen a un solo profesional
  @ManyToOne(() => Professional, (professional) => professional.availabilities, {
    onDelete: 'CASCADE', // Si borras al profesional, se borra su agenda
  })
  @JoinColumn({ name: 'professionalId' }) // Esto crea la columna de unión en la DB
  professional: Professional;
}