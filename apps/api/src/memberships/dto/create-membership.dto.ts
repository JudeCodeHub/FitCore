import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  userId!: string;

  @IsString()
  planId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
