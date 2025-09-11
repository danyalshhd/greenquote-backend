import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  async health() {
    return { status: 200, success: true, timestamp: new Date().toISOString(), message: 'ok' };
  }
}
