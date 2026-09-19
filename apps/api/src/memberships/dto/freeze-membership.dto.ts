import { IsDateString } from 'class-validator';

export class FreezeMembershipDto {
  @IsDateString()
  until!: string;
}
