import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-qoute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateQuoteResponse } from './interface/create-quote.response';
import { AuthUser } from './interface/auth-user.interface';
import { ok, created } from '../common/utils/normalize-response';

@Controller('api/quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: { user: AuthUser },
    @Body() body: CreateQuoteDto,
  ): Promise<CreateQuoteResponse> {
    const result = await this.quotesService.createQuote(req.user.id, body);
    return created(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Request() req: { user: AuthUser }, @Param('id') id: string) {
    const res = await this.quotesService.getQuoteById(req.user, id);
    if (!res) throw new NotFoundException('Quote not found');
    return ok(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listMy(@Request() req: { user: AuthUser }) {
    const res = await this.quotesService.listQuotesForUser(req.user.id);
    return ok(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/admin/all')
  async adminList(@Request() req: { user: AuthUser }, @Query('q') q?: string) {
    if (!req.user.isAdmin) throw new NotFoundException('Admin only');
    const res = await this.quotesService.listAllQuotesForAdmin({ term: q });
    return ok(res);
  }
}
