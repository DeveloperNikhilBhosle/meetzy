import { UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

export class Helper {

    async GetEmailByGoogleToken(token: string) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) throw new UnauthorizedException('Invalid Google token');
        return payload.email;
    }

    static SUCCESSResponse(code: number, message: string, data?: any) {
        return {
            status_code: code,
            message: message,
            data: data ? data : {}
        }
    }

}