import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ok } from '../common/utils/normalize-response';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(
      body.fullName,
      body.email,
      body.password,
    );
    return ok(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const valid = await this.authService.validateUser(
      body.email,
      body.password,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = await this.authService.login(valid);
    return ok(token);
  }
}
