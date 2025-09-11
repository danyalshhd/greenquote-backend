/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from '../src/quotes/quotes.service';

describe('QuotesService', () => {
  let service: QuotesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: 'PRISMA',
          useValue: {
            quote: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  it('computes system price and offers correctly', () => {
    const principal = 12000;
    const payments = service['buildOffers'](principal, 'A');
    expect(payments.length).toBe(3);
    // check monthly payment numeric
    expect(payments[0].monthlyPayment).toBeGreaterThan(0);
  });

  it('calculates system price correctly', () => {
    expect(service['systemPriceFor'](10)).toBe(12000);
    expect(service['systemPriceFor'](0)).toBe(0);
  });

  it('computes risk band correctly', () => {
    expect(service['computeRiskBand'](500, 5)).toBe('A');
    expect(service['computeRiskBand'](300, 7)).toBe('B');
    expect(service['computeRiskBand'](100, 2)).toBe('C');
  });

  it('returns correct APR for band', () => {
    expect(service['aprForBand']('A')).toBe(6.9);
    expect(service['aprForBand']('B')).toBe(8.9);
    expect(service['aprForBand']('C')).toBe(11.9);
  });

  it('calculates monthly payment correctly', () => {
    expect(service['monthlyPayment'](12000, 6.9, 10)).toBeGreaterThan(0);
    expect(service['monthlyPayment'](0, 6.9, 10)).toBe(0);
    expect(service['monthlyPayment'](12000, 0, 10)).toBeCloseTo(100);
  });

  it('creates a quote and returns expected structure', async () => {
    const mockQuote = {
      id: 'q1',
      fullName: 'Test User',
      email: 'test@example.com',
      address: '123 Main St',
      monthlyConsumptionKwh: 400,
      systemSizeKw: 5,
      downPayment: 1000,
      systemPrice: 6000,
      principalAmount: 5000,
      riskBand: 'A',
      offersJson: JSON.stringify([
        { termYears: 5, apr: 6.9, principalUsed: 5000, monthlyPayment: 98.5 },
      ]),
    };
    const prisma = (service as any).prisma;
    (prisma.quote.create as jest.Mock).mockResolvedValue(mockQuote);
    const dto = {
      fullName: 'Test User',
      email: 'test@example.com',
      address: '123 Main St',
      monthlyConsumptionKwh: 400,
      systemSizeKw: 5,
      downPayment: 1000,
    };
    const result = await service.createQuote('user1', dto);
    expect(result).not.toBeNull();
    expect(result.id).toBe('q1');
    expect(result.inputs.fullName).toBe('Test User');
    expect(result.derived.systemPrice).toBe(6000);
    expect(Array.isArray(result.offers)).toBe(true);
  });

  it('gets quote by id with authorization', async () => {
    const mockQuote = {
      id: 'q2',
      userId: 'user2',
      fullName: 'User Two',
      email: 'user2@example.com',
      address: '456 Main St',
      monthlyConsumptionKwh: 300,
      systemSizeKw: 4,
      downPayment: 500,
      systemPrice: 4800,
      principalAmount: 4300,
      riskBand: 'B',
      offersJson: JSON.stringify([
        { termYears: 10, apr: 8.9, principalUsed: 4300, monthlyPayment: 54.2 },
      ]),
    };
    const prisma = (service as any).prisma;
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);
    const requester = { id: 'user2', isAdmin: false };
    const result = await service.getQuoteById(requester, 'q2');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('q2');
    expect(result!.inputs.fullName).toBe('User Two');
    expect(result!.derived.systemPrice).toBe(4800);
    expect(Array.isArray(result!.offers)).toBe(true);
  });

  it('throws ForbiddenException if unauthorized', async () => {
    const mockQuote = { id: 'q3', userId: 'user3', offersJson: '[]' };
    const prisma = (service as any).prisma;
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);
    const requester = { id: 'userX', isAdmin: false };
    await expect(service.getQuoteById(requester, 'q3')).rejects.toThrow(
      'Not authorized to access this quote',
    );
  });

  it('lists quotes for user', async () => {
    const mockQuotes = [
      {
        id: 'q1',
        systemSizeKw: 5,
        systemPrice: 6000,
        riskBand: 'A',
        createdAt: new Date(),
      },
      {
        id: 'q2',
        systemSizeKw: 4,
        systemPrice: 4800,
        riskBand: 'B',
        createdAt: new Date(),
      },
    ];
    const prisma = (service as any).prisma;
    (prisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);
    const result = await service.listQuotesForUser('user1');
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('q1');
  });

  it('lists all quotes for admin with filter', async () => {
    const mockQuotes = [
      {
        id: 'q1',
        userId: 'user1',
        fullName: 'Test User',
        email: 'test@example.com',
        systemSizeKw: 5,
        systemPrice: 6000,
        riskBand: 'A',
        createdAt: new Date(),
      },
      {
        id: 'q2',
        userId: 'user2',
        fullName: 'User Two',
        email: 'user2@example.com',
        systemSizeKw: 4,
        systemPrice: 4800,
        riskBand: 'B',
        createdAt: new Date(),
      },
    ];
    const prisma = (service as any).prisma;
    (prisma.quote.findMany as jest.Mock).mockResolvedValue(mockQuotes);
    const result = await service.listAllQuotesForAdmin({ term: 'Test' });
    expect(result.length).toBe(2);
    expect(result[0].userId).toBe('user1');
  });
});
