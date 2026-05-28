import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  user!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}