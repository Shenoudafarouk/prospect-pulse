import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { Prospect } from '../prospects/entities/prospect.entity.js';
import { TovConfig } from '../tov/entities/tov-config.entity.js';
import { MessageSequence } from '../sequences/entities/message-sequence.entity.js';
import { SequenceMessage } from '../sequences/entities/sequence-message.entity.js';
import { AiGeneration } from '../ai/entities/ai-generation.entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'prospect_pulse',
  password: process.env.DB_PASSWORD ?? 'prospect_pulse',
  database: process.env.DB_DATABASE ?? 'prospect_pulse',
  entities: [
    Prospect,
    TovConfig,
    MessageSequence,
    SequenceMessage,
    AiGeneration,
  ],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
});
