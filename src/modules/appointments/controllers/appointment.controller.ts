import { Controller, Get, Post, Patch, Body, Req, Query, Res, Param, ParseUUIDPipe } from '@nestjs/common';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import type { Response } from 'express';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  async findAll(
    @Query('date') date?: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return await this.appointmentService.findByUser('', 'ADMINISTRADOR', date, professionalId);
  }

  @Get('my-appointments')
  async getMyHistory(
    @Req() req,
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

  @Get('export')
  async exportCsv(
    @Query('professionalId') professionalId: string,
    @Query('date') date: string,
    @Res() res: Response
  ) {
    const csv = await this.appointmentService.exportToCsv(professionalId, date);
    const filename = `citas_${date || 'todas'}_${professionalId || 'todos'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  }

  @Patch(':id/reschedule')
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { newDate: string; newTime: string; reason?: string },
    @Req() req,
  ) {
    return await this.appointmentService.reschedule(
      id,
      body.newDate,
      body.newTime,
      req.user.id,
      body.reason,
    );
  }

  @Get(':id/history')
  async getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return await this.appointmentService.getHistory(id);
  }
}