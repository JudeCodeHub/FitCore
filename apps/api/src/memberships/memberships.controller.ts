import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateMembershipDto } from './dto/create-membership.dto.js';
import { MembershipsService } from './memberships.service.js';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string) {
    return this.membershipsService.activate(id);
  }

  @Post(':id/freeze')
  @HttpCode(HttpStatus.OK)
  freeze(@Param('id') id: string) {
    return this.membershipsService.freeze(id);
  }

  @Post(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  unfreeze(@Param('id') id: string) {
    return this.membershipsService.unfreeze(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.membershipsService.cancel(id);
  }

  @Post(':id/expire')
  @HttpCode(HttpStatus.OK)
  expire(@Param('id') id: string) {
    return this.membershipsService.expire(id);
  }
}
