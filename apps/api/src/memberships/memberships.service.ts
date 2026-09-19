import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMembershipDto } from './dto/create-membership.dto.js';
import type { FreezeMembershipDto } from './dto/freeze-membership.dto.js';

const MAX_FREEZE_DAYS_PER_YEAR = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

  async freeze(id: string, dto: FreezeMembershipDto) {
    const membership = await this.findOne(id);
    const from = membership.status as MembershipStatus;

    if (!ACTIONS.freeze.from.includes(from)) {
      throw new BadRequestException(
        `Cannot freeze a membership that is currently ${from}`,
      );
    }

    const now = new Date();
    const until = new Date(dto.until);
    if (until <= now) {
      throw new BadRequestException('Freeze end date must be in the future');
    }

    const requestedDays = Math.ceil(
      (until.getTime() - now.getTime()) / MS_PER_DAY,
    );
    const usedDays = await this.getFreezeDaysUsedThisYear(id, now);
    const remainingDays = MAX_FREEZE_DAYS_PER_YEAR - usedDays;

    if (requestedDays > remainingDays) {
      throw new BadRequestException(
        `Only ${remainingDays} freeze day(s) left this year (requested ${requestedDays})`,
      );
    }

    await this.prisma.membershipFreeze.create({
      data: { membershipId: id, startedAt: now },
    });

    return this.prisma.membership.update({
      where: { id },
      data: { status: 'FROZEN', frozenUntil: until },
    });
  }

  async unfreeze(id: string) {
    const membership = await this.findOne(id);
    const from = membership.status as MembershipStatus;

    if (!ACTIONS.unfreeze.from.includes(from)) {
      throw new BadRequestException(
        `Cannot unfreeze a membership that is currently ${from}`,
      );
    }

    const openFreeze = await this.prisma.membershipFreeze.findFirst({
      where: { membershipId: id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (openFreeze) {
      await this.prisma.membershipFreeze.update({
        where: { id: openFreeze.id },
        data: { endedAt: new Date() },
      });
    }

    return this.prisma.membership.update({
      where: { id },
      data: { status: 'ACTIVE', frozenUntil: null },
    });
  }

  /** Total days used across completed freezes that started in the given
   * date's calendar year. A freeze spanning a year boundary is counted
   * entirely toward the year it started in — a deliberate simplification. */
  async getFreezeDaysUsedThisYear(
    membershipId: string,
    reference: Date,
  ): Promise<number> {
    const yearStart = new Date(reference.getFullYear(), 0, 1);
    const yearEnd = new Date(reference.getFullYear() + 1, 0, 1);

    const freezes = await this.prisma.membershipFreeze.findMany({
      where: {
        membershipId,
        endedAt: { not: null },
        startedAt: { gte: yearStart, lt: yearEnd },
      },
    });

    return freezes.reduce((sum, f) => {
      const days = Math.ceil(
        (f.endedAt!.getTime() - f.startedAt.getTime()) / MS_PER_DAY,
      );
      return sum + days;
    }, 0);
  }

  async getFreezeStatus(id: string) {
    await this.findOne(id);
    const now = new Date();
    const usedDays = await this.getFreezeDaysUsedThisYear(id, now);
    return {
      maxDaysPerYear: MAX_FREEZE_DAYS_PER_YEAR,
      usedDays,
      remainingDays: MAX_FREEZE_DAYS_PER_YEAR - usedDays,
    };
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
