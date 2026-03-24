import { Controller, Patch, Param, Body, ParseUUIDPipe, Get } from '@nestjs/common';
import { AvailabilityService } from '../services/availability.service';

@Controller('availabilities')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll() {
    return await this.availabilityService.findAll();
  }

  @Get('professional/:professionalId') // GET http://localhost:3000/availability/professional/UUID
  async findByProfessional(@Param('professionalId', ParseUUIDPipe) professionalId: string) {
    return await this.availabilityService.findByProfessional(professionalId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: any // Luego podemos crear un DTO para esto
  ) {
    return await this.availabilityService.update(id, updateData);
  }
}