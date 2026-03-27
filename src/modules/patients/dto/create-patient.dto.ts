import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty, IsDate, IsPhoneNumber, IsBoolean, MaxLength, Matches, isStrongPassword, MinLength, IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';
import { Type } from 'class-transformer';

export class CreatePatientDto {
    @IsString()
    @IsNotEmpty({message: 'El número de documento es obligatorio.'})
    @MaxLength(10, {message: 'El documento no puede exceder los 10 caracteres.'})
    @Matches(/^[0-9-]+$/, {message: 'El documento solo puede contener números y guiones.'})
    document: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    birthdate: Date;

    @IsString()
    @IsEnum(PatientGender, {
    message: 'El género debe ser MASCULINO, FEMENINO U OTRO.',
    })
    gender: PatientGender;

    @IsString()
    phone: string;

    @ValidateIf(o => o.email !== '')
    @IsOptional()
    @IsString()
    @IsEmail()
    email: string;

    @IsBoolean()
    isActive: boolean;

}