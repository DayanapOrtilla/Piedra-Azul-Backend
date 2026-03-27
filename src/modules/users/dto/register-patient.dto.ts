import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, IsPhoneNumber, IsEnum } from 'class-validator';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';

export class RegisterPatientDto {

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9-]+$/, { message: 'El documento solo permite números y guiones' })
    document: string;

    @IsString()
    @IsEnum(PatientGender, {
    message: 'El género debe ser MASCULINO, FEMENINO U OTRO.',
    })
    type: PatientGender;

    @IsPhoneNumber()
    phone: string;
  
    @IsString()
    email: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;
}