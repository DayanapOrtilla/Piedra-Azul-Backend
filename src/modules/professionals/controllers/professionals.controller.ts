import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query, ParseBoolPipe } from '@nestjs/common';
import { ProfessionalsService } from '../services/professionals.service';
import { CreateProfessionalDto } from '../dto/create-professional.dto';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  async create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return await this.professionalsService.create(createProfessionalDto);
  }

  @Get()
  async findAll(
    @Query('specialty') specialty?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean
  ) {  
    return this.professionalsService.findAll(specialty, isActive);
  }


  @Get(':id')
  // Usamos ParseUUIDPipe para validar que el ID de Angular sea un UUID válido
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.professionalsService.findOne(id);
  }
}