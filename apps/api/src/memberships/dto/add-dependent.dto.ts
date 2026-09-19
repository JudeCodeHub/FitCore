import { IsEmail } from 'class-validator';

export class AddDependentDto {
  @IsEmail()
  email!: string;
}
