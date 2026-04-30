import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, IsPhoneNumber, IsEnum, MaxLength, IsOptional, IsDate, IsBoolean } from 'class-validator';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';
import { Type } from 'class-transformer';

export class RegisterPatientDto {

    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    lastName!: string;

    @IsString()
    @IsNotEmpty({message: 'El número de documento es obligatorio.'})
    @MaxLength(10, {message: 'El documento no puede exceder los 10 caracteres.'})
    @Matches(/^[0-9-]+$/, {message: 'El documento solo puede contener números y guiones.'})
    document!: string;

    @IsString()
    @IsEnum(PatientGender, {
    message: 'El género debe ser MASCULINO, FEMENINO u OTRO.',
    })
    gender!: PatientGender;

    @Matches(/^[0-9]{10}$/)
    phone!: string;
    
    @IsEmail()
    @IsString()
    email!: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password!: string;
    
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    birthdate!: Date;


    @IsBoolean()
    isActive!: boolean;
}