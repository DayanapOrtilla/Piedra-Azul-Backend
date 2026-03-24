import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  async findAll() {
    return await this.appointmentService.findAll();
  }

  @Get(':id')
  // Usamos ParseUUIDPipe para validar que el ID de Angular sea un UUID válido
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.appointmentService.findOne(id);
  }
}