import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TovConfig } from './entities/tov-config.entity.js';
import { CreateTovConfigDto } from './dto/create-tov-config.dto.js';

@Injectable()
export class TovService {
  constructor(
    @InjectRepository(TovConfig)
    private readonly tovConfigRepo: Repository<TovConfig>,
  ) {}

  async create(dto: CreateTovConfigDto): Promise<TovConfig> {
    const config = this.tovConfigRepo.create(dto);
    return this.tovConfigRepo.save(config);
  }

  async findAll(): Promise<TovConfig[]> {
    return this.tovConfigRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<TovConfig> {
    const config = await this.tovConfigRepo.findOneBy({ id });
    if (!config) {
      throw new NotFoundException(`TovConfig with id "${id}" not found`);
    }
    return config;
  }
}
