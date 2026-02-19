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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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

  private async createAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      studentProfileId: user.studentProfileId,
    });
  }

  private async sendVerificationEmail(email: string, code: string) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpFrom = this.configService.get<string>('SMTP_FROM') ?? smtpUser ?? 'noreply@riskedu.local';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`[auth] Verification code for ${email}: ${code}`);
      return;
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'RiskEdu email verification code',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    });
  }
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
