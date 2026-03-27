import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty, IsDate, IsPhoneNumber, IsBoolean, MaxLength, Matches, IsEmpty, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../../../shared/enum/appointment-status.enum';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    date: Date;

    @IsString()
    @IsNotEmpty()
    time: string;

    @IsString()
    @IsEnum(AppointmentStatus, {
    message: 'El estado debe ser PENDIENTE, CONFIRMADA, CANCELADA o ATENDIDA.',
    })
    status: AppointmentStatus;

    @IsUUID()
    patientId: string;

    @IsUUID()
    professionalId: string;
}