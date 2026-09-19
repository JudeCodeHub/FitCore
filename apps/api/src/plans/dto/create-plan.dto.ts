import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const PLAN_DURATIONS = ['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const;

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsIn(PLAN_DURATIONS)
  duration!: (typeof PLAN_DURATIONS)[number];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  features!: string[];
}
