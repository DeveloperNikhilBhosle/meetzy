import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';  // Import the strategy
import { JwtAuthGuard } from './jwt.auth';  // Import the guard
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PassportModule, ConfigModule],  // Import PassportModule and ConfigModule
    providers: [JwtStrategy, JwtAuthGuard],  // Provide JwtStrategy and JwtAuthGuard
    exports: [JwtAuthGuard],  // Optionally export the guard to be used in other modules
})
export class AuthModule { }
