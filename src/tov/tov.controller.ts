import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TovService } from './tov.service.js';
import { CreateTovConfigDto } from './dto/create-tov-config.dto.js';
import { TovConfig } from './entities/tov-config.entity.js';

@Controller('tov-configs')
export class TovController {
  constructor(private readonly tovService: TovService) {}

  @Post()
  create(@Body() dto: CreateTovConfigDto): Promise<TovConfig> {
    return this.tovService.create(dto);
  }

  @Get()
  findAll(): Promise<TovConfig[]> {
    return this.tovService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<TovConfig> {
    return this.tovService.findById(id);
  }
}
