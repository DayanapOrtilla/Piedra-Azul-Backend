import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty, IsDate, IsPhoneNumber, IsBoolean, MaxLength, Matches } from 'class-validator';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';

export class CreatePatientDto {
    @IsString()
    @IsNotEmpty({message: 'El número de documento es obligatoriio.'})
    @MaxLength(10, {message: 'El documento no puede exceder los 10 caracteres.'})
    @Matches(/^[0-9-]+$/, {message: 'El documento solo puede contener números y guiones.'})
    document: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsDate()
    birthdate: Date;

    @IsString()
    @IsEnum(PatientGender, {
    message: 'El género debe ser MASCULINO, FEMENINO U OTRO.',
    })
    type: PatientGender;

    @IsPhoneNumber()
    phone: string;

    @IsBoolean()
    isActive: boolean;
}