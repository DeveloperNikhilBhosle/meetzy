import { Inject, Injectable } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { MEETZY } from 'src/dbmodels/database.module-definition';
import * as MEETZY_SCHEMA from '../drizzel/meetzydb/migrations/schema';

@Injectable()
export class MeetZyDrizzleService {
    public db: NodePgDatabase<typeof MEETZY_SCHEMA>;
    constructor(@Inject(MEETZY) private readonly pool: Pool) {
        this.db = drizzle(this.pool, { schema: MEETZY_SCHEMA });
    }
}
