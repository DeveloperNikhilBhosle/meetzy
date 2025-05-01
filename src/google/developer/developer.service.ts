import { BadRequestException, Injectable } from '@nestjs/common';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { LinkWebhook } from './developer.dto';
import { Helper } from 'helper';
import { webhook_details } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, sql, or } from 'drizzle-orm';


@Injectable()
export class DeveloperService {
    constructor(private readonly meetzy: MeetZyDrizzleService) { }


    async SaveWebhook(ip: LinkWebhook) {
        if (Helper.isNullOrEmpty(ip.api_url)) {
            throw new BadRequestException("Invalid API URL")
        } else if (Helper.isNullOrInvalid(ip.event_type_id)) {
            throw new BadRequestException("Invalid API Event")
        }

        const exists = await this.meetzy.db.select()
            .from(webhook_details)
            .where(and(eq(webhook_details.enterprise_id, ip.enterprise_id.toString()), eq(webhook_details.link, ip.api_url), eq(webhook_details.is_active, true)));


        if (exists.length > 0) {
            throw new BadRequestException("Webhook Already Linked");
        }

        const Obj = {
            enterprise_id: ip.enterprise_id.toString(),
            event_id: ip.event_type_id.toString(),
            link: ip.api_url,
            client_id: ip.user_name,
            client_secret: ip.password,
            is_active: true,
            created_at: sql`CURRENT_TIMESTAMP`,
            last_updated_at: sql`CURRENT_TIMESTAMP`,
        }

        await this.meetzy.db.insert(webhook_details).values(Obj);

        return Helper.SUCCESSResponse(200, "Webhook Saved Successfully");


    }
}
