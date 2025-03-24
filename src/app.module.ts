import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeetingsModule } from './google/meetings/meetings.module';
import { ConfigModule } from '@nestjs/config';
import { MeetZyDatabaseModule } from './dbmodels/meetzydb/meetzydb.drizzle.module';
import 'dotenv/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MeetZyDatabaseModule.forRootAsync({
      useFactory: () => ({
        url: "",
      }),
    }),
    MeetingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
