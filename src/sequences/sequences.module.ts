import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageSequence } from './entities/message-sequence.entity.js';
import { SequenceMessage } from './entities/sequence-message.entity.js';
import { AiGeneration } from '../ai/entities/ai-generation.entity.js';
import { SequencesController } from './sequences.controller.js';
import { SequencesService } from './sequences.service.js';
import { LinkedInModule } from '../linkedin/linkedin.module.js';
import { ProspectsModule } from '../prospects/prospects.module.js';
import { TovModule } from '../tov/tov.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageSequence, SequenceMessage, AiGeneration]),
    LinkedInModule,
    ProspectsModule,
    TovModule,
    AiModule,
  ],
  controllers: [SequencesController],
  providers: [SequencesService],
})
export class SequencesModule {}
