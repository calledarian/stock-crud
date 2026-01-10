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
  createdAt: string;

  @IsOptional()
  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsNumber()
  closePrior45d?: number;

  @IsOptional()
  @IsNumber()
  closePrior30d?: number;

  @IsOptional()
  @IsNumber()
  closePrior14d?: number;

  @IsOptional()
  @IsNumber()
  closePrior1d?: number;
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
  @IsNumber()
  closePrior30d?: number;

  @IsOptional()
  @IsNumber()
  closePrior14d?: number;

  @IsOptional()
  @IsNumber()
  closePrior1d?: number;
}
