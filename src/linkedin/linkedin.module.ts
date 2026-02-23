import { Module } from '@nestjs/common';
import { LINKEDIN_PROVIDER } from './linkedin.interface.js';
import { MockLinkedInService } from './mock-linkedin.service.js';
import { LinkedInProfileNormalizer } from './linkedin-profile.normalizer.js';

@Module({
  providers: [
    {
      provide: LINKEDIN_PROVIDER,
      useClass: MockLinkedInService,
    },
    LinkedInProfileNormalizer,
  ],
  exports: [LINKEDIN_PROVIDER, LinkedInProfileNormalizer],
})
export class LinkedInModule {}
