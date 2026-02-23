import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospect } from './entities/prospect.entity.js';
import { NormalizedProspect } from '../linkedin/linkedin-profile.normalizer.js';

@Injectable()
export class ProspectsService {
  constructor(
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
  ) {}

  async upsertByLinkedinUrl(data: NormalizedProspect): Promise<Prospect> {
    const existing = await this.prospectRepo.findOneBy({
      linkedinUrl: data.linkedinUrl,
    });

    if (existing) {
      Object.assign(existing, data);
      return this.prospectRepo.save(existing);
    }

    const prospect = this.prospectRepo.create(data);
    return this.prospectRepo.save(prospect);
  }
}
