import { Injectable } from '@nestjs/common';
import { LinkedInProfile } from './linkedin.interface.js';
import { Prospect } from '../prospects/entities/prospect.entity.js';

export type NormalizedProspect = Pick<
  Prospect,
  | 'linkedinUrl'
  | 'fullName'
  | 'headline'
  | 'summary'
  | 'currentCompany'
  | 'currentTitle'
  | 'location'
  | 'profileData'
>;

@Injectable()
export class LinkedInProfileNormalizer {
  normalize(url: string, profile: LinkedInProfile): NormalizedProspect {
    return {
      linkedinUrl: this.normalizeUrl(url),
      fullName: profile.fullName.trim(),
      headline: profile.headline?.trim() ?? null,
      summary: profile.summary?.trim() ?? null,
      currentCompany: profile.currentCompany?.trim() ?? null,
      currentTitle: profile.currentTitle?.trim() ?? null,
      location: profile.location?.trim() ?? null,
      profileData: {
        industry: profile.industry,
        connections: profile.connections,
        experience: profile.experience,
        skills: profile.skills,
        educations: profile.educations,
      },
    };
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.replace(/\/+$/, '').trim();
    if (!trimmed.startsWith('http')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
}
