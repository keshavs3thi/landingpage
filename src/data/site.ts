// Site-wide constants. Each flag/string here is a one-line change.
export const SITE = {
  name: 'Keshav Sethi',
  oneLiner:
    'Designer. Splitting my time between Atlanta & the SF Bay Area. I also take pictures.',
  location: 'Atlanta / SF Bay Area',
  email: 'me@keshavsethi.com',
  resumeHref: '/resume.pdf', // TBD: resume PDF to be supplied (place at public/resume.pdf)

  title: 'Keshav Sethi — Designer',
  description:
    'Keshav Sethi, designer splitting time between Atlanta and the SF Bay Area. Selected work and photography.',
  ogImage: '/og.png', // TBD: placeholder until final renders; replace with a hero screenshot

  underConstruction: true,
  bannerText: 'Site under construction: process books are being added.',
  showAbout: true, // TBD: About links to a stub page; set false to hide it until written
  grain: true,

  baseBg: '#E9E4DC',
} as const;
