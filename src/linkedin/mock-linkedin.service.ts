import { Injectable } from '@nestjs/common';
import {
  LinkedInProvider,
  LinkedInProfile,
  LinkedInExperience,
  LinkedInEducation,
} from './linkedin.interface.js';

const FIRST_NAMES = [
  'Sarah',
  'James',
  'Emily',
  'Michael',
  'Olivia',
  'Daniel',
  'Sophia',
  'David',
];
const LAST_NAMES = [
  'Chen',
  'Patel',
  'Johnson',
  'Williams',
  'Garcia',
  'Kim',
  'Taylor',
  'Anderson',
];
const TITLES = [
  'VP of Sales',
  'Head of Growth',
  'CTO',
  'Director of Engineering',
  'Chief Revenue Officer',
  'VP of Marketing',
  'Head of Product',
  'Director of Operations',
];
const COMPANIES = [
  'TechCorp',
  'SalesForward',
  'DataScale',
  'CloudNine',
  'GrowthLabs',
  'PipelineIO',
  'RevOps Inc',
  'ScaleUp HQ',
];
const INDUSTRIES = [
  'SaaS',
  'Enterprise Software',
  'FinTech',
  'HealthTech',
  'MarTech',
  'E-commerce',
  'Cybersecurity',
  'AI/ML',
];
const LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'London, UK',
  'Toronto, Canada',
  'Berlin, Germany',
  'Seattle, WA',
  'Chicago, IL',
];
const SKILLS = [
  'Sales Strategy',
  'Team Leadership',
  'Revenue Operations',
  'Pipeline Management',
  'SaaS Sales',
  'Account Management',
  'Business Development',
  'CRM',
  'Negotiation',
  'Data Analysis',
  'Product Management',
  'Go-to-Market Strategy',
  'Customer Success',
  'Strategic Partnerships',
  'Demand Generation',
  'Marketing Automation',
];
const SCHOOLS = [
  'Stanford University',
  'MIT',
  'University of Michigan',
  'UC Berkeley',
  'Columbia University',
  'University of Toronto',
  'Georgia Tech',
  'NYU Stern',
];

@Injectable()
export class MockLinkedInService implements LinkedInProvider {
  fetchProfile(url: string): Promise<LinkedInProfile> {
    const slug = this.extractSlug(url);
    const hash = this.hashSlug(slug);

    const firstName = this.pick(FIRST_NAMES, hash, 0);
    const lastName = this.pick(LAST_NAMES, hash, 1);
    const title = this.pick(TITLES, hash, 2);
    const company = this.pick(COMPANIES, hash, 3);
    const industry = this.pick(INDUSTRIES, hash, 4);
    const location = this.pick(LOCATIONS, hash, 5);

    const previousTitle =
      'Senior ' +
      this.pick(TITLES, hash, 6).replace(
        /^(VP of|Head of|Chief|Director of)\s/,
        '',
      );

    const experience: LinkedInExperience[] = [
      {
        title,
        company,
        startDate: '2021-03',
        endDate: null,
        description: `Leading ${industry.toLowerCase()} initiatives and driving revenue growth.`,
      },
      {
        title: previousTitle,
        company: this.pick(COMPANIES, hash, 7),
        startDate: '2018-01',
        endDate: '2021-02',
        description: null,
      },
    ];

    const skillCount = 4 + (hash % 5);
    const skills: string[] = [];
    for (let i = 0; i < skillCount; i++) {
      const skill = this.pick(SKILLS, hash, 8 + i);
      if (!skills.includes(skill)) skills.push(skill);
    }

    const educations: LinkedInEducation[] = [
      {
        school: this.pick(SCHOOLS, hash, 20),
        degree: 'MBA',
        field: 'Business Administration',
      },
    ];

    return Promise.resolve({
      fullName: `${firstName} ${lastName}`,
      headline: `${title} at ${company}`,
      summary: `Experienced ${industry.toLowerCase()} leader with a track record in scaling revenue teams and driving go-to-market strategy. Passionate about building high-performance sales organizations.`,
      currentCompany: company,
      currentTitle: title,
      location,
      industry,
      connections: 500 + (hash % 4500),
      experience,
      skills,
      educations,
    });
  }

  private extractSlug(url: string): string {
    const cleaned = url.replace(/\/+$/, '');
    const segments = cleaned.split('/');
    return segments.at(-1) ?? 'unknown';
  }

  /**
   * Simple deterministic hash so the same slug always produces the same profile.
   * Not cryptographic -- just needs to be consistent.
   */
  private hashSlug(slug: string): number {
    let h = 0;
    for (let i = 0; i < slug.length; i++) {
      h = Math.trunc(h * 31 + (slug.codePointAt(i) ?? 0));
    }
    return Math.abs(h);
  }

  private pick<T>(arr: T[], hash: number, offset: number): T {
    return arr[(hash + offset * 7) % arr.length];
  }
}
