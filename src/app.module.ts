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
        url: "postgresql://pguser:R5sWDsMWc7aYHfQc@ec2-13-235-15-173.ap-south-1.compute.amazonaws.com:5432/MeetZyDBDev",
      }),
    }),
    MeetingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
