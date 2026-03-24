import { IsString, IsEnum, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
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
  @IsEnum(ProfessionalType, {
    message: 'El tipo debe ser MEDICO, ENFERMERO o ADMINISTRATIVO',
  })
  type: ProfessionalType;

  @IsString()
  @IsEnum(ProfessionalSpeciality, {
    message: 'La especialidad debe ser MEDICINA ALTERNATIVA, QUIROPRAXIA o FISIOTERAPIA'
  })
  specialty: ProfessionalSpeciality;

  @IsInt()
  @Min(1)
  @Max(60)
  intervalMinutes: number;
}