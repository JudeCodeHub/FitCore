import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateClassDto } from './dto/create-class.dto.js';
import type { ListClassesQueryDto } from './dto/list-classes-query.dto.js';
import type { UpdateClassDto } from './dto/update-class.dto.js';

type RequestingUser = { sub: string; role: string };

function assertTimeRange(startTime: string, endTime: string) {
  if (new Date(endTime) <= new Date(startTime)) {
    throw new BadRequestException('endTime must be after startTime');
  }
}

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListClassesQueryDto) {
    const classes = await this.prisma.class.findMany({
      where: {
        ...(query.from || query.to
          ? {
              startTime: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        trainer: { select: { id: true, name: true } },
        bookings: { where: { status: 'BOOKED' }, select: { id: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return classes.map(this.withSeatInfo);
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, name: true } },
        bookings: { where: { status: 'BOOKED' }, select: { id: true } },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return this.withSeatInfo(cls);
  }

  async create(dto: CreateClassDto, requester: RequestingUser) {
    assertTimeRange(dto.startTime, dto.endTime);

    const trainerId =
      requester.role === 'TRAINER' ? requester.sub : dto.trainerId;

    if (!trainerId) {
      throw new BadRequestException('trainerId is required');
    }

    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
    });
    if (!trainer || trainer.role !== 'TRAINER') {
      throw new BadRequestException('trainerId must reference a trainer account');
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        trainerId,
        capacity: dto.capacity,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  async update(id: string, dto: UpdateClassDto, requester: RequestingUser) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');

    this.assertOwnership(cls.trainerId, requester);

    if (dto.startTime || dto.endTime) {
      assertTimeRange(
        dto.startTime ?? cls.startTime.toISOString(),
        dto.endTime ?? cls.endTime.toISOString(),
      );
    }

    if (dto.trainerId && requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only an admin can reassign a class to a different trainer');
    }

    return this.prisma.class.update({
      where: { id },
      data: {
        name: dto.name,
        trainerId: dto.trainerId,
        capacity: dto.capacity,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  async remove(id: string, requester: RequestingUser) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');

    this.assertOwnership(cls.trainerId, requester);

    await this.prisma.class.delete({ where: { id } });
  }

  private assertOwnership(trainerId: string, requester: RequestingUser) {
    if (requester.role === 'ADMIN') return;
    if (requester.role === 'TRAINER' && requester.sub === trainerId) return;
    throw new ForbiddenException('You can only manage your own classes');
  }

  private withSeatInfo<T extends { capacity: number; bookings: { id: string }[] }>(
    cls: T,
  ) {
    const { bookings, ...rest } = cls;
    return {
      ...rest,
      bookedCount: bookings.length,
      availableSeats: Math.max(0, cls.capacity - bookings.length),
    };
  }
}
