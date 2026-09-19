import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const PLAN_DURATIONS = ['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const;

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn(PLAN_DURATIONS)
  duration?: (typeof PLAN_DURATIONS)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
