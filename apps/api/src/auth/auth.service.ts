import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '../mailer/mailer.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CompleteInviteDto } from './dto/complete-invite.dto.js';
import type { InviteStaffDto } from './dto/invite-staff.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { SignupDto } from './dto/signup.dto.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AuthUser = { id: string; name: string; email: string; role: string };

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async signup(dto: SignupDto, userAgent?: string) {
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

    return (await this.issueNewSession(user, userAgent)).response;
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

  async login(dto: LoginDto, userAgent?: string) {
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

    return (await this.issueNewSession(user, userAgent)).response;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      this.mailer.sendPasswordResetEmail(user.email, resetToken);
    }

    return {
      message: 'If that email is registered, a reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiresAt) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    // Password changed — kill every existing session so a leaked/old
    // refresh token can't survive a password reset.
    await this.prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  async refresh(refreshToken: string, userAgent?: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      // This token was already rotated away once before — someone is
      // reusing an old, retired refresh token. That means it was copied
      // by someone other than its rightful owner. Kill every session for
      // this user so the thief (and the real owner) both get logged out.
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new ForbiddenException(
        'Refresh token reuse detected — all sessions revoked',
      );
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const result = await this.issueNewSession(user, userAgent);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedById: result.sessionId },
    });

    return result.response;
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out' };
  }

  async inviteStaff(dto: InviteStaffDto, invitedBy: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Invalidate any earlier unused invite for this email before creating
    // a fresh one, so only one invite link is ever valid at a time.
    await this.prisma.staffInvite.deleteMany({
      where: { email: dto.email, usedAt: null },
    });

    const token = randomBytes(32).toString('hex');
    await this.prisma.staffInvite.create({
      data: {
        email: dto.email,
        role: dto.role,
        token,
        invitedBy,
        expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
      },
    });

    this.mailer.sendStaffInviteEmail(dto.email, token, dto.role);

    return { message: 'Invite sent' };
  }

  async getInvite(token: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }

    return { email: invite.email, role: invite.role };
  }

  async completeInvite(dto: CompleteInviteDto, userAgent?: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { token: dto.token },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: invite.email,
        passwordHash,
        role: invite.role,
        emailVerified: true,
      },
    });

    await this.prisma.staffInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return (await this.issueNewSession(user, userAgent)).response;
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked' };
  }

  private async issueNewSession(
    user: AuthUser,
    userAgent: string | undefined,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomBytes(16).toString('hex'),
    };

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

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };

    return { response, sessionId: session.id };
  }
}
