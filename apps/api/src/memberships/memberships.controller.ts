import {
  Body,
  Controller,
  Delete,
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
import { AddDependentDto } from './dto/add-dependent.dto.js';
import { ChangePlanDto } from './dto/change-plan.dto.js';
import { CreateMembershipDto } from './dto/create-membership.dto.js';
import { FreezeMembershipDto } from './dto/freeze-membership.dto.js';
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

  @Get(':id/freeze-status')
  freezeStatus(@Param('id') id: string) {
    return this.membershipsService.getFreezeStatus(id);
  }

  @Post(':id/freeze')
  @HttpCode(HttpStatus.OK)
  freeze(@Param('id') id: string, @Body() dto: FreezeMembershipDto) {
    return this.membershipsService.freeze(id, dto);
  }

  @Post(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  unfreeze(@Param('id') id: string) {
    return this.membershipsService.unfreeze(id);
  }

  @Post(':id/change-plan')
  @HttpCode(HttpStatus.OK)
  changePlan(@Param('id') id: string, @Body() dto: ChangePlanDto) {
    return this.membershipsService.changePlan(id, dto);
  }

  @Get(':id/dependents')
  listDependents(@Param('id') id: string) {
    return this.membershipsService.listDependents(id);
  }

  @Post(':id/dependents')
  addDependent(@Param('id') id: string, @Body() dto: AddDependentDto) {
    return this.membershipsService.addDependent(id, dto);
  }

  @Delete(':id/dependents/:userId')
  @HttpCode(HttpStatus.OK)
  removeDependent(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.membershipsService.removeDependent(id, userId);
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
