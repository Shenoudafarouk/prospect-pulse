import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from './entities/prospect.entity.js';
import { ProspectsService } from './prospects.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Prospect])],
  providers: [ProspectsService],
  exports: [ProspectsService],
})
export class ProspectsModule {}
