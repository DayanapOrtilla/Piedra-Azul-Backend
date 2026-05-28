import { Professional } from "../../../modules/professionals/entities/professional.entity";
import { UserRole } from "../../../shared/enum/user-role.enum";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Patient } from "../../../modules/patients/entities/patient.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true})
    user!: string;

    @Column({ select: false})
    password!: string;

    @Column({
        type: 'enum',
        enum: UserRole
    })
    role!: UserRole

    @Column({ default: true })
    isActive!: boolean;

    // Relaciones inversas
    @OneToOne(() => Professional, (prof) => prof.user, { onDelete: "CASCADE"})
    professional!: Professional;

    @OneToOne(() => Patient, (patient) => patient.user, )
    patient!: Patient;
}