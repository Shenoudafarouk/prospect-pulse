import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Prospect } from '../prospects/entities/prospect.entity.js';
import { TovConfig } from '../tov/entities/tov-config.entity.js';
import { MessageSequence } from '../sequences/entities/message-sequence.entity.js';
import { SequenceMessage } from '../sequences/entities/sequence-message.entity.js';
import { AiGeneration } from '../ai/entities/ai-generation.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [
          Prospect,
          TovConfig,
          MessageSequence,
          SequenceMessage,
          AiGeneration,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
