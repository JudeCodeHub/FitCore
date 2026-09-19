import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  name!: string;

  /** Required when an ADMIN creates the class; ignored (forced to self) for a TRAINER. */
  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}
