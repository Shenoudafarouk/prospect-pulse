import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TovConfig } from './entities/tov-config.entity.js';
import { TovService } from './tov.service.js';
import { TovTranslatorService } from './tov-translator.service.js';
import { TovController } from './tov.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TovConfig])],
  controllers: [TovController],
  providers: [TovService, TovTranslatorService],
  exports: [TovService, TovTranslatorService],
})
export class TovModule {}
