import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '../mailer/mailer.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

type AuthUser = { id: string; name: string; email: string; role: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'MEMBER',
        verificationToken,
        verificationTokenExpiresAt: new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        ),
      },
    });

    this.mailer.sendVerificationEmail(user.email, verificationToken);

    return this.buildAuthResponse(user);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user || !user.verificationTokenExpiresAt) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: process.env.JWT_REFRESH_SECRET },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async buildAuthResponse(user: AuthUser) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: REFRESH_TOKEN_TTL,
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
