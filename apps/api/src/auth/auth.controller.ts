import { Public } from "@nestjs/authentication";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { AuthService, type AuthenticatedUser } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Public()
  register(@Body() input: RegisterDto): Promise<AuthenticatedUser> {
    return this.authService.register(input);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(
    @Body() input: LoginDto,
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthenticatedUser> {
    const result = await this.authService.login(input, request);
    response.append("Set-Cookie", result.cookie);

    return result.user;
  }

  @Get("me")
  getCurrentUser(@Req() request: HttpRequest): Promise<AuthenticatedUser> {
    return this.authService.getCurrentUser(request);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: HttpRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<void> {
    response.append("Set-Cookie", await this.authService.logout(request));
  }
}

type HttpRequest = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
};

type CookieResponse = {
  append(name: string, value: string): void;
};
