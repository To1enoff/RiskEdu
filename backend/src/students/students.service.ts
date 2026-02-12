import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryStudentsDto } from './dto/query-students.dto';
import { StudentProfile } from './student-profile.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profilesRepository: Repository<StudentProfile>,
  ) {}

  async findAll(query: QueryStudentsDto) {
    const builder = this.profilesRepository.createQueryBuilder('profile');

    if (query.riskBucket) {
      builder.andWhere('profile.latestBucket = :riskBucket', { riskBucket: query.riskBucket });
    }

    if (query.department) {
      builder.andWhere('profile.department = :department', { department: query.department });
    }

    builder.orderBy('profile.latestProbability', query.sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    builder.addOrderBy('profile.updatedAt', 'DESC');
    builder.skip((query.page - 1) * query.limit).take(query.limit);

    const [items, total] = await builder.getManyAndCount();

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<StudentProfile> {
    const profile = await this.profilesRepository.findOne({
      where: { id },
      relations: {
        predictions: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Student ${id} not found`);
    }

    if (profile.predictions) {
      profile.predictions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return profile;
  }
}
