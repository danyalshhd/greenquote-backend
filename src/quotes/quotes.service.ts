import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaClient, Quote } from '@prisma/client';
import { CreateQuoteDto } from './dto/create-qoute.dto';
import { QuoteResponse } from './interface/quote-response.interface';
import { Offer } from './interface/offer.interface';

@Injectable()
export class QuotesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  private systemPriceFor(sizeKw: number): number {
    return sizeKw * 1200; // currency units
  }

  private computeRiskBand(
    monthlyConsumptionKwh: number,
    systemSizeKw: number,
  ): 'A' | 'B' | 'C' {
    if (monthlyConsumptionKwh >= 400 && systemSizeKw <= 6) return 'A';
    if (monthlyConsumptionKwh >= 250) return 'B';
    return 'C';
  }

  private aprForBand(band: string): number {
    if (band === 'A') return 6.9;
    if (band === 'B') return 8.9;
    return 11.9;
  }

  // amortization monthly payment formula
  // P = principal, r = monthly rate, n = number of months
  private monthlyPayment(
    principal: number,
    aprPercent: number,
    termYears: number,
  ): number {
    const r = aprPercent / 100 / 12;
    const n = termYears * 12;
    if (principal <= 0) return 0;
    if (r === 0) return principal / n;
    const payment =
      (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    return Number(payment.toFixed(2));
  }

  private buildOffers(principal: number, band: string): Offer[] {
    const apr = this.aprForBand(band);
    const terms = [5, 10, 15];
    return terms.map((t) => ({
      termYears: t,
      apr,
      principalUsed: Number(principal.toFixed(2)),
      monthlyPayment: this.monthlyPayment(principal, apr, t),
    }));
  }

  async createQuote(
    userId: string,
    dto: CreateQuoteDto,
  ): Promise<QuoteResponse> {
    const systemPrice = this.systemPriceFor(dto.systemSizeKw);
    const down = dto.downPayment ?? 0;
    const principal = Math.max(0, systemPrice - down);
    const band = this.computeRiskBand(
      dto.monthlyConsumptionKwh,
      dto.systemSizeKw,
    );
    const offers: Offer[] = this.buildOffers(principal, band);

    const quote: Quote = await this.prisma.quote.create({
      data: {
        userId,
        fullName: dto.fullName,
        email: dto.email,
        address: dto.address,
        monthlyConsumptionKwh: Math.round(dto.monthlyConsumptionKwh),
        systemSizeKw: dto.systemSizeKw,
        downPayment: down,
        systemPrice: Number(systemPrice.toFixed(2)),
        principalAmount: Number(principal.toFixed(2)),
        riskBand: band,
        offersJson: JSON.stringify(offers),
      },
    });

    return {
      id: quote.id,
      inputs: {
        fullName: quote.fullName,
        email: quote.email,
        address: quote.address,
        monthlyConsumptionKwh: quote.monthlyConsumptionKwh,
        systemSizeKw: quote.systemSizeKw,
        downPayment: quote.downPayment,
      },
      derived: {
        systemPrice: quote.systemPrice,
        principalAmount: quote.principalAmount,
        riskBand: quote.riskBand,
      },
      offers,
    };
  }

  async getQuoteById(
    requester: { id: string; isAdmin: boolean },
    id: string,
  ): Promise<QuoteResponse | null> {
    const q: Quote | null = await this.prisma.quote.findUnique({
      where: { id },
    });
    if (!q) return null;

    if (q.userId !== requester.id && !requester.isAdmin) {
      throw new ForbiddenException('Not authorized to access this quote');
    }

    return {
      id: q.id,
      inputs: {
        fullName: q.fullName,
        email: q.email,
        address: q.address,
        monthlyConsumptionKwh: q.monthlyConsumptionKwh,
        systemSizeKw: q.systemSizeKw,
        downPayment: q.downPayment,
      },
      derived: {
        systemPrice: q.systemPrice,
        principalAmount: q.principalAmount,
        riskBand: q.riskBand,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      offers: JSON.parse(q.offersJson),
    };
  }

  async listQuotesForUser(userId: string): Promise<
    Array<{
      id: string;
      systemSizeKw: number;
      systemPrice: number;
      riskBand: string;
      createdAt: Date;
    }>
  > {
    const quotes: Quote[] = await this.prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map((q) => ({
      id: q.id,
      systemSizeKw: q.systemSizeKw,
      systemPrice: q.systemPrice,
      riskBand: q.riskBand,
      createdAt: q.createdAt,
    }));
  }

  async listAllQuotesForAdmin(filter?: { term?: string }): Promise<
    Array<{
      id: string;
      userId: string;
      fullName: string;
      email: string;
      systemSizeKw: number;
      systemPrice: number;
      riskBand: string;
      createdAt: Date;
    }>
  > {
    // simple name/email filter
    const where = filter?.term
      ? {
          OR: [
            { email: { contains: filter.term, mode: 'insensitive' as const } },
            {
              fullName: { contains: filter.term, mode: 'insensitive' as const },
            },
          ],
        }
      : {};

    const quotes: Quote[] = await this.prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map((q) => ({
      id: q.id,
      userId: q.userId,
      fullName: q.fullName,
      email: q.email,
      systemSizeKw: q.systemSizeKw,
      systemPrice: q.systemPrice,
      riskBand: q.riskBand,
      createdAt: q.createdAt,
    }));
  }
}
