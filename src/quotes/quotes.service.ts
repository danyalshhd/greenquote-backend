import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaClient, Quote } from '@prisma/client';
import { CreateQuoteDto } from './dto/create-qoute.dto';
import { QuoteResponse } from './interface/quote-response.interface';
import { Offer } from './interface/offer.interface';
import {
  systemPriceFor,
  computeRiskBand,
  buildOffers,
} from './utils/quote-calculations';

@Injectable()
export class QuotesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async createQuote(
    userId: string,
    dto: CreateQuoteDto,
  ): Promise<QuoteResponse> {
    const systemPrice = systemPriceFor(dto.systemSizeKw);
    const down = dto.downPayment ?? 0;
    const principal = Math.max(0, systemPrice - down);
    const band = computeRiskBand(dto.monthlyConsumptionKwh, dto.systemSizeKw);
    const offers: Offer[] = buildOffers(principal, band);

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
