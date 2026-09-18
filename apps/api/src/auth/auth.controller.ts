import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { CompleteInviteDto } from './dto/complete-invite.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { InviteStaffDto } from './dto/invite-staff.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { JwtAuthGuard, type RequestUser } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.signup(dto, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.login(dto, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refresh(dto.refreshToken, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(@CurrentUser() user: RequestUser) {
    return this.authService.listSessions(user.sub);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('id') sessionId: string,
  ) {
    return this.authService.revokeSession(user.sub, sessionId);
  }

  @Post('invite-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  inviteStaff(@Body() dto: InviteStaffDto, @CurrentUser() user: RequestUser) {
    return this.authService.inviteStaff(dto, user.sub);
  }

  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.authService.getInvite(token);
  }

  @Post('complete-invite')
  @HttpCode(HttpStatus.OK)
  completeInvite(
    @Body() dto: CompleteInviteDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.completeInvite(dto, userAgent);
  }
}
