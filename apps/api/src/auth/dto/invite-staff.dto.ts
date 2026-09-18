import { IsEmail, IsIn } from 'class-validator';

const STAFF_ROLES = ['ADMIN', 'TRAINER', 'FRONT_DESK'] as const;

export class InviteStaffDto {
  @IsEmail()
  email!: string;

  @IsIn(STAFF_ROLES)
  role!: (typeof STAFF_ROLES)[number];
}
