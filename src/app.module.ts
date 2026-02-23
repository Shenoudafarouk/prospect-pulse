import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { DatabaseModule } from './database/database.module.js';
import { TovModule } from './tov/tov.module.js';
import { SequencesModule } from './sequences/sequences.module.js';
import configuration from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    TovModule,
    SequencesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
