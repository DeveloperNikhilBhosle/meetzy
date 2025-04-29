import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        console.log(process.env.JWT_ACCESS_SECRET, 'process.env.JWT_ACCESS_SECRET');
        console.log(ExtractJwt.fromAuthHeaderAsBearerToken(), 'ExtractJwt.fromAuthHeaderAsBearerToken(),')
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // Ensure expiration is checked
            secretOrKey: process.env.JWT_ACCESS_SECRET //configService.get<string>('JWT_ACCESS_SECRET'), // Secret key from .env file
        });
    }

    // Validate the token payload
    async validate(payload: any) {
        console.log('JWT Payload:', payload);
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        if (payload.exp && payload.exp < now) {
            throw new UnauthorizedException('Token has expired');
        }

        return {
            userId: payload.id,
            email: payload.email,
        };
    }
}
