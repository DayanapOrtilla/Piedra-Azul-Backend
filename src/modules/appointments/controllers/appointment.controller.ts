import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Req, Query } from '@nestjs/common';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

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

  @Get('my-appointments')
  async geMyHistory(@Req() req, 
    @Query('date') date?: string, 
    @Query('professionalId') professionalId?: string
  ) {
    return await this.appointmentService.findByUser(
      req.user.id, 
      req.user.role, 
      date, 
      professionalId
    );
  }
}