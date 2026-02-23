import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SequencesService } from './sequences.service.js';
import { GenerateSequenceDto } from './dto/generate-sequence.dto.js';

@Controller()
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Post('generate-sequence')
  generate(@Body() dto: GenerateSequenceDto) {
    return this.sequencesService.generate(dto);
  }

  @Get('sequences/:id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.sequencesService.findById(id);
  }
}
