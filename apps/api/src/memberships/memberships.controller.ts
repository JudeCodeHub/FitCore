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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard, type RequestUser } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AddDependentDto } from './dto/add-dependent.dto.js';
import { ChangePlanDto } from './dto/change-plan.dto.js';
import { CreateMembershipDto } from './dto/create-membership.dto.js';
import { FreezeMembershipDto } from './dto/freeze-membership.dto.js';
import { MembershipsService } from './memberships.service.js';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // NOTE: must be registered before ':id' — otherwise Nest would match
  // "/memberships/me" as findOne with id="me".
  @Get('me')
  getMine(@CurrentUser() user: RequestUser) {
    return this.membershipsService.getMyMembership(user.sub);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Post(':id/activate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string) {
    return this.membershipsService.activate(id);
  }

  @Get(':id/freeze-status')
  @Roles('ADMIN')
  freezeStatus(@Param('id') id: string) {
    return this.membershipsService.getFreezeStatus(id);
  }

  @Post(':id/freeze')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  freeze(@Param('id') id: string, @Body() dto: FreezeMembershipDto) {
    return this.membershipsService.freeze(id, dto);
  }

  @Post(':id/unfreeze')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  unfreeze(@Param('id') id: string) {
    return this.membershipsService.unfreeze(id);
  }

  @Post(':id/change-plan')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  changePlan(@Param('id') id: string, @Body() dto: ChangePlanDto) {
    return this.membershipsService.changePlan(id, dto);
  }

  @Get(':id/dependents')
  @Roles('ADMIN')
  listDependents(@Param('id') id: string) {
    return this.membershipsService.listDependents(id);
  }

  @Post(':id/dependents')
  @Roles('ADMIN')
  addDependent(@Param('id') id: string, @Body() dto: AddDependentDto) {
    return this.membershipsService.addDependent(id, dto);
  }

  @Delete(':id/dependents/:userId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  removeDependent(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.membershipsService.removeDependent(id, userId);
  }

  @Post(':id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.membershipsService.cancel(id);
  }

  @Post(':id/expire')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  expire(@Param('id') id: string) {
    return this.membershipsService.expire(id);
  }
}
