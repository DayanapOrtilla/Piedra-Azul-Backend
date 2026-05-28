import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query, Put, Patch, Delete, Req } from '@nestjs/common';
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';


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

  @Get('search')
  async search(@Query('term') term: string) {
    return await this.patientsService.search(term);
  }
  @Get('user')
async findByUser(@Req() req: any) {
  return await this.patientsService.findByUser(req.user.id);
}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.patientsService.findOne(id);
  }

  

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updatePatientDto: UpdatePatientDto
  ) {
    return await this.patientsService.update(id, updatePatientDto);
  }

  // Este coincide con tu repo de Angular: this.url/${id}/deactivate
  @Patch(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.patientsService.deactivate(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.patientsService.remove(id);
  }
}