import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty, IsDate, IsPhoneNumber, IsBoolean, MaxLength, Matches, IsEmpty, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../../../shared/enum/appointment-status.enum';

export class CreateAppointmentDto {
    @IsDate()
    @IsEmpty()
    date: Date;

    @IsString()
    @IsEmpty()
    time: string;

    @IsString()
    @IsEnum(AppointmentStatus, {
    message: 'El estado debe ser PENDIENTE, CONFIRMADA, CANCELADA o ATENDIDA.',
    })
    type: AppointmentStatus;

    @IsUUID()
    patientId: string;

    @IsUUID()
    professionalId: string;
}