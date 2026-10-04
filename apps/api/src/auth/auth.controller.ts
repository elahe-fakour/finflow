import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService, type AuthenticatedUser } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() input: RegisterDto): Promise<AuthenticatedUser> {
    return this.authService.register(input);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() input: LoginDto): Promise<AuthenticatedUser> {
    return this.authService.login(input);
  }
}
