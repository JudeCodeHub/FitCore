import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AddDependentDto } from './dto/add-dependent.dto.js';
import type { ChangePlanDto } from './dto/change-plan.dto.js';
import type { CreateMembershipDto } from './dto/create-membership.dto.js';
import type { FreezeMembershipDto } from './dto/freeze-membership.dto.js';

const MAX_FREEZE_DAYS_PER_YEAR = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

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

const DEPENDENT_MANAGEABLE_STATUSES: MembershipStatus[] = ['ACTIVE', 'FROZEN'];

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

  /** Switches a membership to a different plan mid-cycle, prorating the
   * price difference for the remaining days of the CURRENT billing cycle.
   * The cycle's start/end dates don't change — only the plan does; the new
   * plan's own duration takes effect starting from the next renewal
   * (handled once billing/Stripe exists in a later phase). This only
   * calculates and returns the proration amount — it doesn't charge or
   * credit anything yet, since there's no payment system wired up. */
  async changePlan(id: string, dto: ChangePlanDto) {
    const membership = await this.findOne(id);

    if (membership.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot change plan on a membership that is currently ${membership.status}`,
      );
    }

    if (dto.newPlanId === membership.planId) {
      throw new BadRequestException('Membership is already on this plan');
    }

    const newPlan = await this.prisma.plan.findUnique({
      where: { id: dto.newPlanId },
    });
    if (!newPlan) throw new NotFoundException('Plan not found');
    if (!newPlan.isActive) {
      throw new BadRequestException('Cannot switch to an inactive plan');
    }

    const now = new Date();
    const cycleStart = membership.startDate;
    const cycleEnd = membership.endDate;
    const totalCycleDays = Math.max(
      1,
      Math.round((cycleEnd.getTime() - cycleStart.getTime()) / MS_PER_DAY),
    );
    const remainingDays = Math.min(
      totalCycleDays,
      Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / MS_PER_DAY)),
    );

    const oldPrice = Number(membership.plan.price);
    const newPrice = Number(newPlan.price);

    const unusedCredit = round2((oldPrice / totalCycleDays) * remainingDays);
    const newPlanCharge = round2((newPrice / totalCycleDays) * remainingDays);
    const netAmount = round2(newPlanCharge - unusedCredit);

    const updated = await this.prisma.membership.update({
      where: { id },
      data: { planId: dto.newPlanId },
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      membership: updated,
      proration: {
        cycleStart,
        cycleEnd,
        totalCycleDays,
        remainingDays,
        oldPlan: {
          id: membership.plan.id,
          name: membership.plan.name,
          price: oldPrice,
        },
        newPlan: { id: newPlan.id, name: newPlan.name, price: newPrice },
        unusedCredit,
        newPlanCharge,
        netAmount,
        direction: netAmount > 0 ? 'CHARGE' : netAmount < 0 ? 'CREDIT' : 'NONE',
      },
    };
  }

  async listDependents(id: string) {
    await this.findOne(id);
    return this.prisma.membershipDependent.findMany({
      where: { membershipId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { addedAt: 'asc' },
    });
  }

  /** Links an existing user under this membership's owner (family/group
   * plan), up to the plan's maxMembers (which includes the owner, so a
   * plan with maxMembers=4 allows up to 3 dependents). */
  async addDependent(id: string, dto: AddDependentDto) {
    const membership = await this.findOne(id);

    if (!DEPENDENT_MANAGEABLE_STATUSES.includes(membership.status)) {
      throw new BadRequestException(
        `Cannot add a dependent to a membership that is currently ${membership.status}`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No user found with that email');
    }

    if (user.id === membership.userId) {
      throw new BadRequestException(
        'The membership owner cannot be added as their own dependent',
      );
    }

    const existingLink = await this.prisma.membershipDependent.findUnique({
      where: { userId: user.id },
    });
    if (existingLink) {
      throw new BadRequestException(
        existingLink.membershipId === id
          ? 'This user is already linked to this membership'
          : 'This user is already linked to a different membership',
      );
    }

    const dependentCount = await this.prisma.membershipDependent.count({
      where: { membershipId: id },
    });
    const maxDependents = membership.plan.maxMembers - 1;
    if (dependentCount >= maxDependents) {
      throw new BadRequestException(
        `This plan supports up to ${membership.plan.maxMembers} member(s) total — no room for another dependent`,
      );
    }

    return this.prisma.membershipDependent.create({
      data: { membershipId: id, userId: user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeDependent(id: string, userId: string) {
    const link = await this.prisma.membershipDependent.findUnique({
      where: { userId },
    });
    if (!link || link.membershipId !== id) {
      throw new NotFoundException('This user is not a dependent on this membership');
    }

    await this.prisma.membershipDependent.delete({ where: { userId } });
    return { message: 'Dependent removed' };
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
