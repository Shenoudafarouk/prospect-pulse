export interface LinkedInProfile {
  fullName: string;
  headline: string | null;
  summary: string | null;
  currentCompany: string | null;
  currentTitle: string | null;
  location: string | null;
  industry: string | null;
  connections: number | null;
  experience: LinkedInExperience[];
  skills: string[];
  educations: LinkedInEducation[];
}

export interface LinkedInExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface LinkedInEducation {
  school: string;
  degree: string | null;
  field: string | null;
}

export const LINKEDIN_PROVIDER = Symbol('LINKEDIN_PROVIDER');

export interface LinkedInProvider {
  fetchProfile(url: string): Promise<LinkedInProfile>;
}
