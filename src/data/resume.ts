// Resume content for /resume/, transcribed from public/resume.pdf in the same section order.
// Edit here when the PDF changes. Phase 1 mirrors the PDF; a storytelling rebuild is in FEATURES.md.
import { SITE } from './site';

export interface ResumeEntry {
  org: string; // bold in the PDF
  logo?: string; // file id in public/logos/ (.svg or .png); shown once the file exists
  role?: string; // italic in the PDF
  location?: string;
  dates?: string;
  subtitle?: string; // italic line under the heading (degree)
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
  // Left off from the PDF's contact line: the phone number (kept out of page HTML) and
  // keshavsethi.com (visitors are already on the site).
  contact: [
    { label: 'Atlanta, GA & San Francisco, CA' },
    { label: SITE.email, href: `mailto:${SITE.email}` },
    { label: 'linkedin.com/in/keshavs3thi', href: 'https://www.linkedin.com/in/keshavs3thi' },
  ],
  sections: [
    {
      heading: 'Education',
      entries: [
        {
          org: 'Georgia Institute of Technology',
          logo: 'gatech',
          location: 'Atlanta, GA',
          dates: 'Expected May 2028',
          subtitle: 'Bachelor of Science in Industrial Design',
        },
        {
          org: 'Eindhoven University of Technology (TU/e)',
          logo: 'tue',
          location: 'Eindhoven, Netherlands',
          dates: 'January – July 2026',
          subtitle: 'Industrial Design Exchange Program',
        },
        {
          org: 'Waterford Kamhlaba United World College of Southern Africa',
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
          org: 'T-Systems (Deutsche Telekom)',
          logo: 't-systems',
          role: 'InnoLab Intern',
          location: 'Stuttgart, Germany',
          dates: 'June – July 2025',
          bullets: [
            'Built and maintained 4+ technology exhibits for visiting delegations from Volkswagen, Continental, and Mercedes-Benz, university groups, and Deutsche Telekom Group executives.',
            'Partnered with engineers and stakeholders to refine the Teleoperated Driving, RobCo robot, and Digital Twin demos for client presentations.',
            'Redesigned the InnoLab visual identity and merchandise, giving the team a distinct look within Deutsche Telekom brand guidelines.',
          ],
        },
        {
          org: 'Method',
          logo: 'method',
          role: 'UX Design Intern',
          location: 'Santa Clara, CA',
          dates: 'June – August 2024',
          bullets: [
            'Conducted foundational UX research for an internal learning management system (LMS), including user interviews and synthesis that shaped the MVP.',
            'Owned the quiz-taking experience, designing its flows and UI in Figma, and contributed UI components across the product.',
            'Collaborated with a 7-person design team and 30 product strategists and engineers, tracking work in Jira to deliver a complete Learning Management System MVP in 8 weeks.',
          ],
        },
        {
          org: 'Freelance Photographer',
          logo: 'fuji',
          dates: 'January 2024 – Present',
          bullets: [
            'Shoot portraits and headshots on digital and film for individual clients, and produce visual content for a local small business.',
          ],
        },
      ],
    },
    {
      heading: 'Leadership & Involvement',
      entries: [
        {
          org: 'Georgia Tech School of Industrial Design',
          logo: 'gatech',
          role: '3D Print Lab Assistant',
          location: 'Atlanta, GA',
          dates: 'August 2026 – Present',
          bullets: [
            'Maintain, calibrate, and troubleshoot a fleet of 16 FDM 3D printers serving 350+ Industrial Design students.',
            'Help students optimize their parts for FDM manufacturing, improving print strength and surface quality while minimizing material waste.',
          ],
        },
        {
          org: 'Georgia Tech Wreck Racing',
          logo: 'wreck',
          role: 'Interior & Controls Design Engineer',
          location: 'Atlanta, GA',
          dates: 'August 2024 – May 2025',
          bullets: [
            'Co-designed the sheet-metal transmission tunnel in CAD for the Conquest TS4’s driveline swap, fitting an Audi S4 4.2L V8, 6-speed manual, and AWD into a 1987 Chrysler Conquest.',
            'Adapted the stock Conquest gauges to work with the Audi ECU, and co-designed the bracket mounting the Audi steering wheel and shaft into the Conquest body.',
            'Car placed 1st in Concours, 3rd in class in Autocross, and 4th overall at the 2025 Grassroots Motorsports $2,000 Challenge.',
          ],
        },
        {
          org: 'UWC Africa Week',
          logo: 'waterford',
          role: 'Media & Marketing Executive',
          location: 'Mbabane, eSwatini',
          dates: 'May 2022 – August 2023',
          bullets: [
            'Led a 4-person media and marketing team for eSwatini’s largest student-run event, a week of panels, performances, and exhibitions celebrating Africa’s culture, history, and future.',
            'Drove the event’s first large-scale expansion of merchandise, social media, and website, growing a historically word-of-mouth event into a branded presence with a new visual design language.',
          ],
        },
      ],
    },
    {
      heading: 'Skills',
      rows: [
        {
          label: '3D & Physical Prototyping',
          text: 'Woodworking, Laser Cutting, FDM 3D Printing, Rapid Prototyping, Design for Manufacturing (DFM), Electronics Prototyping, Silicone Casting & Mold Making, Foam Modeling, CNC Milling',
        },
        { label: 'CAD & Rendering', text: 'Autodesk Fusion, Blender, KeyShot, Vizcom, Solidworks' },
        {
          label: 'UX & Visual',
          text: 'Figma, Jira, Adobe Photoshop, Illustrator, InDesign, Lightroom, Photography (Digital & Film)',
        },
        {
          label: 'Methods',
          text: 'User Research, User Interviews, Research Synthesis, UI Design, User-Centered Design, Visual Identity & Branding',
        },
        { label: 'Languages', text: 'Hindi (native), English (native), Spanish (intermediate)' },
      ],
    },
  ],
};
