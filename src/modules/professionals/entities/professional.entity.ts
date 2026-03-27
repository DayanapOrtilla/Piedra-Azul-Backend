import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Availability } from '../../availabilities/entities/availability.entity';
import { ProfessionalType } from '../../../shared/enum/professional-type.enum';
import { ProfessionalSpeciality } from '../../../shared/enum/professional-speciality.enum';
import { User } from '../../../modules/users/entities/user.entity';

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
    })
    specialty: ProfessionalSpeciality;

    @Column({ default: 20 })
    intervalMinutes: number;

    @Column( {unique: true})
    email: string;

    @Column()
    isActive: boolean;

    @OneToOne(() => User, (user) => user.professional, { cascade: true})
    @JoinColumn()
    user: User;

    @OneToMany(() => Appointment, (appointment) => appointment.professional)
    appointments: Appointment[];

    @OneToMany(() => Availability, (availability) => availability.professional)
    availabilities: Availability[];
}