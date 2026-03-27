import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Patient]), // Importamos ambos aquí
  ],
  controllers: [UsersController],
  providers: [UsersService, SeedService,],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}