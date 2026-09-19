import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard, type RequestUser } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ClassesService } from './classes.service.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { ListClassesQueryDto } from './dto/list-classes-query.dto.js';
import { UpdateClassDto } from './dto/update-class.dto.js';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // Viewing the timetable is open to every authenticated role — members
  // need to see it to eventually book, staff need it to run the gym.
  @Get()
  findAll(@Query() query: ListClassesQueryDto) {
    return this.classesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'TRAINER')
  create(@Body() dto: CreateClassDto, @CurrentUser() user: RequestUser) {
    return this.classesService.create(dto, user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TRAINER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.classesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.classesService.remove(id, user);
  }
}
