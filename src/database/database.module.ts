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
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('database.url');

        const connectionOptions = databaseUrl
          ? { url: databaseUrl, ssl: { rejectUnauthorized: false } }
          : {
              host: config.get<string>('database.host'),
              port: config.get<number>('database.port'),
              username: config.get<string>('database.username'),
              password: config.get<string>('database.password'),
              database: config.get<string>('database.database'),
            };

        return {
          type: 'postgres' as const,
          ...connectionOptions,
          entities: [
            Prospect,
            TovConfig,
            MessageSequence,
            SequenceMessage,
            AiGeneration,
          ],
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: config.get<string>('nodeEnv') === 'production',
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
