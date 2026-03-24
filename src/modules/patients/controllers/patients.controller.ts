import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@Body() createPatientDto: CreatePatientDto) {
    return await this.patientsService.create(createPatientDto);
  }

  @Get()
  async findAll() {
    return await this.patientsService.findAll();
  }

  @Get(':id')
  // Usamos ParseUUIDPipe para validar que el ID de Angular sea un UUID válido
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.patientsService.findOne(id);
  }
}