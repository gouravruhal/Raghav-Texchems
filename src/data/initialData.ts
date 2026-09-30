import type { Product, Inquiry, CompanySettings, StatItem, Collaboration, AboutContent } from '../types';

export const CATEGORIES: string[] = [
  'All Products',
  'Dyestuff & Colorants',
  'Polymer & Emulsions',
  'Paper Coating Chemicals',
  'Textile Auxiliaries',
  'Packaging & Resins',
  'Specialty Solvents'
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_INQUIRIES: Inquiry[] = [];

export const INITIAL_STATS: StatItem[] = [];

export const INITIAL_COLLABORATIONS: Collaboration[] = [];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Raghav Texchems Chemical Private Limited',
  shortName: 'Raghav Texchems',
  tagline: 'chemistry that connects',
  subTagline: 'Chemistry for a Brighter Tomorrow',
  heroHeadline: 'Advancing Science. Transforming Chemical Connectivity.',
  heroHighlightText: 'Transforming',
  heroDescription: 'Raghav Texchems Chemical Private Limited is at the forefront of chemical manufacturing—developing high-performance Dyestuffs, Polymer Emulsions, Textile Auxiliaries, and Paper Coating innovations.',
  heroPrimaryCtaText: 'Our Story',
  heroPrimaryCtaLink: '/about',
  heroSecondaryCtaText: 'Contact Us',
  heroSecondaryCtaLink: '/contact',
  heroActive: true,
  contact1Name: 'Mr. Ravinder Kaushik',
  contact1Phone: '9050670509',
  contact2Name: 'Mr. Sandeep',
  contact2Phone: '6283054442',
  email: 'raghavtexchems1706@gmail.com',
  address: '',
  cin: 'U24100HR2020PTC086742',
  gstin: '',
  contacts: [
    {
      id: 'c1',
      name: 'Mr. Ravinder Kaushik',
      phone: '9050670509',
      title: 'Director / Technical Sales',
      active: true,
    },
    {
      id: 'c2',
      name: 'Mr. Sandeep',
      phone: '6283054442',
      title: 'Operations & Support',
      active: true,
    }
  ]
};

export const INITIAL_ABOUT_CONTENT: AboutContent = {
  videoUrl: 'https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dna_video.mp4',
  videoType: 'direct',
  storyTitle: 'Pioneering Chemical Solutions With Purpose & Precision',
  storyParagraphs: [
    'Founded with a bold vision to bridge cutting-edge polymer research with heavy industrial utility, Raghav Texchems Chemical Private Limited has grown into an international manufacturer of specialty dyestuffs, polymer emulsions, and surface coatings.',
    'Our manufacturing units operate with strict quality parameters, ensuring batch-to-batch consistency and high environmental compliance for domestic and global export markets.'
  ],
  missionTitle: 'Our Mission',
  missionText: 'To engineer sustainable, high-yield chemical formulations that empower global textile, paper, and polymer industries while preserving ecological harmony.',
  visionTitle: 'Our Vision',
  visionText: 'To be the most trusted international partner in specialty chemical connectivity, recognized for technical excellence and uncompromising reliability.',
  milestones: [],
  coreValues: [
    {
      id: 'v1',
      title: 'Precision Chemistry',
      description: 'Meticulous laboratory synthesis and stringent batch testing standards.',
      iconType: 'flask'
    },
    {
      id: 'v2',
      title: 'Sustainable Innovation',
      description: 'Formulations engineered with eco-conscious, biodegradable chemistries.',
      iconType: 'shield'
    },
    {
      id: 'v3',
      title: 'Customer Centricity',
      description: 'Tailored technical data sheets, custom viscosity, and dedicated application support.',
      iconType: 'users'
    },
    {
      id: 'v4',
      title: 'Global Compliance',
      description: 'Adhering to international safety, REACH, and environmental standards.',
      iconType: 'award'
    }
  ]
};

