import { IsDateString, IsOptional } from 'class-validator';

export class ListClassesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
