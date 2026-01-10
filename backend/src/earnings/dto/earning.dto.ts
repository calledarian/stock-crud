import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEarningsDto {
  @IsString()
  stockName: string;

  @IsDateString()
  earningsDate: string;

  @IsNumber()
  closePrice: number;
}

export class UpdateEarningsDto {
  @IsOptional()
  @IsString()
  stockName?: string;

  @IsOptional()
  @IsDateString()
  earningsDate?: string;

  @IsOptional()
  @IsNumber()
  closePrice?: number;
}
