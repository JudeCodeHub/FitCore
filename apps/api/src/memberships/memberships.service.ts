import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMembershipDto } from './dto/create-membership.dto.js';

type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'FROZEN'
  | 'EXPIRED'
  | 'CANCELLED';

type MembershipAction = 'activate' | 'freeze' | 'unfreeze' | 'cancel' | 'expire';

/** The membership lifecycle state machine: each action names exactly which
 * starting statuses it's legal from, and what it moves the membership to.
 * "activate" and "unfreeze" both end at ACTIVE but from different starting
 * states on purpose — they're distinct actions, not interchangeable, even
 * though the destination happens to be the same. */
const ACTIONS: Record<
  MembershipAction,
  { from: MembershipStatus[]; to: MembershipStatus }
> = {
  activate: { from: ['PENDING'], to: 'ACTIVE' },
  freeze: { from: ['ACTIVE'], to: 'FROZEN' },
  unfreeze: { from: ['FROZEN'], to: 'ACTIVE' },
  cancel: { from: ['PENDING', 'ACTIVE', 'FROZEN'], to: 'CANCELLED' },
  expire: { from: ['ACTIVE', 'FROZEN'], to: 'EXPIRED' },
};

function addDuration(
  date: Date,
  duration: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
): Date {
  const result = new Date(date);
  if (duration === 'MONTHLY') result.setMonth(result.getMonth() + 1);
  else if (duration === 'QUARTERLY') result.setMonth(result.getMonth() + 3);
  else result.setFullYear(result.getFullYear() + 1);
  return result;
}

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.membership.findMany({
      include: { plan: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { plan: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return membership;
  }

  async create(dto: CreateMembershipDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = addDuration(startDate, plan.duration);

    return this.prisma.membership.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        status: 'PENDING',
        startDate,
        endDate,
      },
    });
  }

  activate(id: string) {
    return this.transition(id, 'activate');
  }

  freeze(id: string) {
    return this.transition(id, 'freeze');
  }

  unfreeze(id: string) {
    return this.transition(id, 'unfreeze');
  }

  cancel(id: string) {
    return this.transition(id, 'cancel');
  }

  expire(id: string) {
    return this.transition(id, 'expire');
  }

  private async transition(id: string, action: MembershipAction) {
    const membership = await this.findOne(id);
    const from = membership.status as MembershipStatus;
    const { from: allowedFrom, to } = ACTIONS[action];

    if (!allowedFrom.includes(from)) {
      throw new BadRequestException(
        `Cannot ${action} a membership that is currently ${from}`,
      );
    }

    return this.prisma.membership.update({
      where: { id },
      data: { status: to },
    });
  }
}
