import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty, MinLength, IsEmail, IsBoolean } from 'class-validator';
import { ProfessionalSpeciality } from '../../../shared/enum/professional-speciality.enum';
import { ProfessionalType } from '../../../shared/enum/professional-type.enum';

export class CreateProfessionalDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty({message: 'El tipo de profesional es obligatorio.'})
  @IsEnum(ProfessionalType, {
    message: 'El tipo debe ser MEDICO, ENFERMERO o ADMINISTRATIVO',
  })
  type: ProfessionalType;

  @IsString()
  @IsEnum(ProfessionalSpeciality, {
    message: 'La especialidad debe ser TERAPIA NEURAL, QUIROPRAXIA o FISIOTERAPIA'
  })
  specialty: ProfessionalSpeciality;

  @IsInt()
  @Min(1)
  @Max(60)
  intervalMinutes: number;

  @IsEmail()
  @IsNotEmpty({message: 'El correo es obligatorio.'})
  email: string;

  @IsString()
  @IsNotEmpty({message: 'La contraseña es obligatoria.'})
  @MinLength(8)
  password: string;

  @IsBoolean()
  isActive: boolean;

}