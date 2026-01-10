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

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsNumber()
  closePrior45d?: number;

  @IsOptional()
  @IsDateString()
  datePrior45d?: string;

  @IsOptional()
  @IsNumber()
  closePrior30d?: number;

  @IsOptional()
  @IsDateString()
  datePrior30d?: string;

  @IsOptional()
  @IsNumber()
  closePrior14d?: number;

  @IsOptional()
  @IsDateString()
  datePrior14d?: string;

  @IsOptional()
  @IsNumber()
  closePrior1d?: number;

  @IsOptional()
  @IsDateString()
  datePrior1d?: string;
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

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsNumber()
  closePrior45d?: number;

  @IsOptional()
  @IsDateString()
  datePrior45d?: string;

  @IsOptional()
  @IsNumber()
  closePrior30d?: number;

  @IsOptional()
  @IsDateString()
  datePrior30d?: string;

  @IsOptional()
  @IsNumber()
  closePrior14d?: number;

  @IsOptional()
  @IsDateString()
  datePrior14d?: string;

  @IsOptional()
  @IsNumber()
  closePrior1d?: number;

  @IsOptional()
  @IsDateString()
  datePrior1d?: string;
}
