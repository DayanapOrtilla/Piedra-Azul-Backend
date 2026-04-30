import { UserRole } from '@shared/enum/user-role.enum';
import { IsString, IsInt, Min, Max, IsNotEmpty, IsBoolean, Matches, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9-]+$/, { message: 'El documento solo permite números y guiones' })
    user!: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password!: string;

    @IsString()
    @IsNotEmpty({message: 'El Rol es obligatorio.'})
    @IsEnum(UserRole, {
        message: 'El Rol debe ser MEDICO, TERAPISTA, PACIENTE, AGENDADOR o ADMINISTRADOR',
        })
    role!: UserRole;

    @IsBoolean()
    isActive!: boolean;
}