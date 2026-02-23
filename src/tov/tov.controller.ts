import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TovService } from './tov.service.js';
import { CreateTovConfigDto } from './dto/create-tov-config.dto.js';
import { TovConfig } from './entities/tov-config.entity.js';

@ApiTags('TOV Configs')
@Controller('tov-configs')
export class TovController {
  constructor(private readonly tovService: TovService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tone-of-voice configuration' })
  @ApiBody({ type: CreateTovConfigDto })
  @ApiResponse({ status: 201, description: 'TOV config created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateTovConfigDto): Promise<TovConfig> {
    return this.tovService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all TOV configurations' })
  @ApiResponse({ status: 200, description: 'List of TOV configs' })
  findAll(): Promise<TovConfig[]> {
    return this.tovService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a TOV configuration by ID' })
  @ApiResponse({ status: 200, description: 'TOV config found' })
  @ApiResponse({ status: 404, description: 'TOV config not found' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<TovConfig> {
    return this.tovService.findById(id);
  }
}
