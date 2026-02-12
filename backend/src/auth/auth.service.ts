import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { StudentProfile } from '../students/student-profile.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepository: Repository<StudentProfile>,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const existingUser = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = this.usersRepository.create({
      email: payload.email,
      passwordHash,
      role: payload.role ?? UserRole.ADVISOR,
      fullName: payload.fullName,
    });

    if (user.role === UserRole.STUDENT) {
      const studentProfile = this.studentProfilesRepository.create({
        externalStudentId: payload.email,
        fullName: payload.fullName ?? payload.email,
        features: {},
      });
      const savedProfile = await this.studentProfilesRepository.save(studentProfile);
      user.studentProfileId = savedProfile.id;
    }

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

  async login(payload: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.usersRepository.findOne({ where: { email: payload.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
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

  private async createAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      studentProfileId: user.studentProfileId,
    });
  }
}
