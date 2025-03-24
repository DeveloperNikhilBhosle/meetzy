import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { MeetZyDrizzleService } from './meetzydb.drizzle.service';
import { ConfigurableDatabaseModule, DATABASE_OPTIONS, MEETZY } from 'src/dbmodels/database.module-definition';
import { DatabaseConfig } from 'src/dbmodels/database-options.interface';

@Global()
@Module({
    exports: [MeetZyDrizzleService],
    providers: [
        MeetZyDrizzleService,
        {
            provide: MEETZY,
            inject: [DATABASE_OPTIONS],
            useFactory: (databaseOptions: DatabaseConfig) => {
                return new Pool({
                    connectionString: databaseOptions.url,
                });
            },
        },
    ],
})
export class MeetZyDatabaseModule extends ConfigurableDatabaseModule { }

