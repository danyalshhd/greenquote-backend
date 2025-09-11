import { IsEmail, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsNotEmpty() fullName: string;

  @IsEmail() email: string;

  @IsNotEmpty() address: string;

  @IsNumber() @Min(0) monthlyConsumptionKwh: number;

  @IsNumber() @Min(0) systemSizeKw: number;

  @IsOptional() @IsNumber() @Min(0) downPayment?: number;
}
