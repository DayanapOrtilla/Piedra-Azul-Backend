import { Controller, Patch, Param, Body, ParseUUIDPipe, Get, Put } from '@nestjs/common';
import { AvailabilityService } from '../services/availability.service';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';

@Controller('availabilities')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll() {
    return await this.availabilityService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) professionalId: string){
    return await this.availabilityService.findById(professionalId);
  }


  @Get(':id/availability') // GET http://localhost:3000/availabilities/id/availability
  async findByProfessionalId(@Param('id', ParseUUIDPipe) professionalId: string) {
    return await this.availabilityService.findByProfessionalId(professionalId);
  }

  @Put(':id/availability')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: UpdateAvailabilityDto[] // Luego podemos crear un DTO para esto
  ) {
    return await this.availabilityService.update(id, updateData);
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.availabilityService.deactivate(id);
  }
}