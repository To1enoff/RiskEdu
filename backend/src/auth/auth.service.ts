import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { StudentProfile } from '../students/student-profile.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepository: Repository<StudentProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Backfill legacy accounts created before email verification was introduced.
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ emailVerified: true })
      .where('"emailVerified" = :verified', { verified: false })
      .andWhere('"emailVerificationCode" IS NULL')
      .andWhere('"emailVerificationExpiresAt" IS NULL')
      .execute();

    if ((result.affected ?? 0) > 0) {
      this.logger.log(`Marked ${result.affected} legacy account(s) as emailVerified=true`);
    }
  }

  async register(
    payload: RegisterDto,
  ): Promise<{ requiresVerification: true; email: string; message: string }> {
    const allowedAdminEmail = (this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@riskedu.local').toLowerCase();
    if (payload.email.toLowerCase() === allowedAdminEmail) {
      throw new ForbiddenException('This email is reserved for admin access');
    }

    const existingUser = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = this.usersRepository.create({
      email: payload.email,
      passwordHash,
      // Public self-registration is strictly student-only.
      role: UserRole.STUDENT,
      fullName: payload.fullName,
      emailVerified: false,
      emailVerificationCode: generateVerificationCode(),
      emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const studentProfile = this.studentProfilesRepository.create({
      externalStudentId: payload.email,
      fullName: payload.fullName ?? payload.email,
      features: {},
    });
    const savedProfile = await this.studentProfilesRepository.save(studentProfile);
    user.studentProfileId = savedProfile.id;

    const savedUser = await this.usersRepository.save(user);
    await this.sendVerificationEmail(savedUser.email, savedUser.emailVerificationCode ?? '');

    return {
      requiresVerification: true,
      email: savedUser.email,
      message: 'Verification code sent to email',
    };
  }

  async login(payload: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === UserRole.ADMIN) {
      const allowedAdminEmail = this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@riskedu.local';
      if (user.email.toLowerCase() !== allowedAdminEmail.toLowerCase()) {
        throw new UnauthorizedException('Admin access is restricted');
      }
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === UserRole.STUDENT && !user.emailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const accessToken = await this.createAccessToken(user);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentProfileId: user.studentProfileId,
      },
    };
  }

  async verifyEmail(payload: VerifyEmailDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Email verification is only for student accounts');
    }
    if (user.emailVerified) {
      const accessToken = await this.createAccessToken(user);
      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          studentProfileId: user.studentProfileId,
        },
      };
    }
    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw new BadRequestException('Verification code not generated');
    }
    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code expired');
    }
    if (user.emailVerificationCode !== payload.code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiresAt = undefined;
    const savedUser = await this.usersRepository.save(user);
    const accessToken = await this.createAccessToken(savedUser);
    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        fullName: savedUser.fullName,
        studentProfileId: savedUser.studentProfileId,
      },
    };
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (!user) {
      // Do not reveal whether email exists.
      return { message: 'If this email exists, a reset code was sent.' };
    }

    user.passwordResetCode = generateVerificationCode();
    user.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.usersRepository.save(user);
    await this.sendPasswordResetEmail(user.email, user.passwordResetCode);
    return { message: 'If this email exists, a reset code was sent.' };
  }

  async resetPassword(payload: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (!user || !user.passwordResetCode || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid reset request');
    }
    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset code expired');
    }
    if (user.passwordResetCode !== payload.code) {
      throw new BadRequestException('Invalid reset code');
    }

    user.passwordHash = await bcrypt.hash(payload.newPassword, 10);
    user.passwordResetCode = undefined;
    user.passwordResetExpiresAt = undefined;
    await this.usersRepository.save(user);
    return { message: 'Password was reset successfully.' };
  }

  private async createAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      studentProfileId: user.studentProfileId,
    });
  }

  private async sendVerificationEmail(email: string, code: string) {
    await this.sendAuthCodeEmail(
      email,
      'RiskEdu email verification code',
      `Your verification code is: ${code}. It expires in 10 minutes.`,
      `[auth] Verification code for ${email}: ${code}`,
    );
  }

  private async sendPasswordResetEmail(email: string, code: string) {
    await this.sendAuthCodeEmail(
      email,
      'RiskEdu password reset code',
      `Your password reset code is: ${code}. It expires in 10 minutes.`,
      `[auth] Password reset code for ${email}: ${code}`,
    );
  }

  private async sendAuthCodeEmail(email: string, subject: string, text: string, fallbackLog: string) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpFrom = this.configService.get<string>('SMTP_FROM') ?? smtpUser ?? 'noreply@riskedu.local';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(fallbackLog);
      return;
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject,
        text,
      });
    } catch (error) {
      // Keep auth flows alive even if SMTP provider rejects the message.
      this.logger.warn(
        `SMTP send failed for ${email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(fallbackLog);
    }
  }
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
