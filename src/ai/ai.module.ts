import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGeneration } from './entities/ai-generation.entity.js';
import { AiService } from './ai.service.js';
import { PromptBuilderService } from './prompt-builder.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AiGeneration])],
  providers: [AiService, PromptBuilderService],
  exports: [AiService],
})
export class AiModule {}
