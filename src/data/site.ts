// Site-wide constants. Each flag/string here is a one-line change.
export const SITE = {
  name: 'Keshav Sethi',
  oneLiner:
    'Designer. Splitting my time between Atlanta & the SF Bay Area. I also take pictures.',
  location: 'Atlanta / SF Bay Area',
  email: 'ksethi38@gatech.edu',
  resumeHref: '/resume.pdf', // public/resume.pdf; /resume/ mirrors it and offers it as a download

  title: 'Keshav Sethi',
  description:
    'Keshav Sethi, designer splitting time between Atlanta and the SF Bay Area. Selected work and photography.',
  ogImage: '/og.png', // TBD: placeholder until final renders; replace with a hero screenshot

  underConstruction: true,
  bannerText: 'Site under construction: process books are being added.',
  showAbout: true, // TBD: About links to a stub page; set false to hide it until written
  grain: true,

  baseBg: '#141414', // dark stage; hover shifts to a deep tint of each accent
} as const;
