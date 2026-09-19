import { IsString } from 'class-validator';

export class ChangePlanDto {
  @IsString()
  newPlanId!: string;
}
