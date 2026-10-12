// Resume content for /resume/, transcribed from public/resume.pdf in the same section order.
// Edit here when the PDF changes. Phase 1 mirrors the PDF; a storytelling rebuild is in FEATURES.md.
import { SITE } from './site';

export interface ResumeEntry {
  org: string; // bold in the PDF
  logo?: string; // file id in public/logos/ (.svg or .png); shown once the file exists
  role?: string; // italic in the PDF
  roleFirst?: boolean; // Leadership lists the role before the org
  location?: string;
  dates?: string;
  subtitle?: string; // italic line under the heading (degree, paper title)
  bullets?: string[];
}

export type ResumeSection =
  | { heading: string; entries: ResumeEntry[] }
  | { heading: string; rows: { label: string; text: string }[] };

export interface ContactItem {
  label: string;
  href?: string;
}

export const RESUME: { name: string; contact: ContactItem[]; sections: ResumeSection[] } = {
  name: 'Keshav Sethi',
  // keshavsethi.com (in the PDF) is left off: visitors are already on the site.
  contact: [
    { label: SITE.email, href: `mailto:${SITE.email}` },
    { label: 'linkedin.com/in/keshavs3thi', href: 'https://www.linkedin.com/in/keshavs3thi' },
  ],
  sections: [
    {
      heading: 'Education',
      entries: [
        {
          org: 'Georgia Institute of Technology (GT)',
          logo: 'gatech',
          location: 'Atlanta, GA',
          dates: 'Expected Graduation: May 2028',
          subtitle: 'Bachelor of Science in Industrial Design',
        },
        {
          org: 'Technische Universiteit Eindhoven (TU/e)',
          logo: 'tue',
          location: 'Eindhoven, Netherlands',
          dates: 'January – July 2026',
          subtitle: 'Industrial Design Exchange Program',
        },
        {
          org: 'Waterford Kamhlaba United World College of Southern Africa (WKUWCSA)',
          logo: 'waterford',
          location: 'Mbabane, eSwatini',
          dates: 'November 2023',
          subtitle: 'International Baccalaureate Diploma',
        },
      ],
    },
    {
      heading: 'Experience',
      entries: [
        {
          org: 'T-Systems',
          logo: 't-systems',
          role: 'InnoLab Intern',
          location: 'Stuttgart, Germany',
          dates: 'June 2025 – July 2025',
          bullets: [
            'Built and maintained exhibits and design cases showcasing state-of-the-art technology under the T-Systems portfolio.',
            'Bridged engineers and stakeholders to enhance Teleoperated Driving, RobCo Precision Manufacturing Robot, and Digital Twin showcases.',
            'Strategically rebuilt InnoLab visual identity and merchandise, distinguishing the team while remaining identifiably Telekom.',
          ],
        },
        {
          org: 'Method',
          logo: 'method',
          role: 'User Experience Designer',
          location: 'Santa Clara, CA',
          dates: 'June 2024 – August 2024',
          bullets: [
            'Conducted UX research, synthesized findings, and prototyped features as part of a team of 7 product/experience designers.',
            'Collaborated with a team comprised of 30 product strategists and engineers over 8 weeks to deliver a completed MVP.',
            'Provided stakeholders with additional designs and features for future consideration.',
            'Built experience in industry tools such as Figma and Jira, and learned meaningful lessons about product delivery within a design consultancy.',
          ],
        },
        {
          org: 'Freelance Photographer & Media Professional',
          logo: 'freelance',
          dates: 'January 2024 – Present',
          bullets: [
            'Leveraged personal artistic photography passion to establish a freelance entity, specializing in capturing human emotions through portraits.',
            'Provided unique headshot services for college students, enhancing their professional identity.',
            'Collaborated with small businesses to elevate their online marketing presence through compelling visual content.',
          ],
        },
      ],
    },
    {
      heading: 'Relevant Projects',
      entries: [
        {
          org: 'Secondary Research Paper',
          logo: 'research-paper',
          dates: '2023',
          subtitle: 'The ubiquitization of Electric Vehicles in North America: a blessing or a curse?',
          bullets: [
            'A 4000-word research paper I wrote during my time as an IB Diploma student',
            'Addresses the research question: “In what ways does the advancement of Electric Vehicle technology and infrastructure perpetuate existing economic and environmental injustices?”',
          ],
        },
      ],
    },
    {
      heading: 'Leadership',
      entries: [
        {
          org: 'UWC Africa Week',
          logo: 'uwc-africa-week',
          role: 'Media & Marketing Executive',
          roleFirst: true,
          dates: 'May 2022 – August 2023',
          bullets: [
            'UWC Africa Week is an annual student-led event that has grown to be the largest student-led event at Waterford Kamhlaba UWCSA, arguably eSwatini and one of the largest on the African continent.',
            'Contributed as the Media and Marketing Executive to UWC Africa Week, a week-long celebration highlighting African culture, history, and future through expert panels, interactive activities, and cultural festivities, enriching the international school experience.',
            'Introduced a fresh design language and collaborated with a media team to enhance social media engagement, resulting in increased foot traffic at events.',
          ],
        },
        {
          org: 'First Robotics',
          logo: 'first',
          role: 'Team Lead',
          roleFirst: true,
          dates: 'Seasonal: 2016 – 2021',
          bullets: [
            'Have led and been involved in various robotics teams and projects, climbing from a junior team member to a project lead.',
            'Experience with: Lego Mindstorms NXT & EV3, and competition in First Robotics: FLL, FTC, FRC. Was part of national-qualifying FLL and national champion FRC teams.',
          ],
        },
      ],
    },
    {
      heading: 'Skills',
      rows: [
        { label: 'Technical', text: 'Figma, Adobe Suite, AUTODESK Fusion 360, Keyshot, FDM Printing' },
        { label: 'Languages', text: 'Hindi (native), English (native), Spanish (intermediate)' },
        {
          label: 'Concepts',
          text: 'Design for Manufacturing (DFM), User-Centered Design, UX Research, Rapid Prototyping, 3D Modeling',
        },
      ],
    },
  ],
};
