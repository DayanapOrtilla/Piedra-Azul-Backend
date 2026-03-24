import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Availability } from '../../availabilities/entities/availability.entity';
import { ProfessionalType } from '../../../shared/enum/professional-type.enum';
import { ProfessionalSpeciality } from '../../../shared/enum/professional-speciality.enum';

@Entity('professionals')
export class Professional {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({
        type: 'enum',
        enum: ProfessionalType,
        default: ProfessionalType.MEDICO
    })
    type: ProfessionalType;

    @Column({
        type: 'enum',
        enum: ProfessionalSpeciality,
        default: ProfessionalSpeciality.MEDICINA_ALTERNATIVA
    })
    specialty: ProfessionalSpeciality;

    @Column({ default: 20 })
    intervalMinutes: number;

    @OneToMany(() => Appointment, (appointment) => appointment.professional)
    appointments: Appointment[];

    @OneToMany(() => Availability, (availability) => availability.professional)
    availabilities: Availability[];
}