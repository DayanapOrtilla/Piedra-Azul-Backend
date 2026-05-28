import { IsString, IsInt, Min, Max, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsBoolean()
  isActive!: boolean;
}