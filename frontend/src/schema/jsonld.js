const SITE = import.meta.env.VITE_SITE_URL || 'https://hyrly.ai';
const DEFAULT_COUNTRY = 'US';
const DEFAULT_CURRENCY = 'USD';

const EMPLOYMENT_TYPES = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

export function employmentType(type) {
  return EMPLOYMENT_TYPES[type] || 'FULL_TIME';
}

export function validThrough(createdAt) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 60);
  return d.toISOString();
}

export function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'Hyrly',
    url: `${SITE}/`,
    logo: `${SITE}/logo.png`,
    description: 'The AI career coach for engineers in their first 90 days after a tech layoff.',
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: `${SITE}/`,
    name: 'Hyrly',
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/jobs?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbList(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function jobPosting(job) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || '',
    datePosted: job.created_at,
    validThrough: validThrough(job.created_at),
    employmentType: employmentType(job.type),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name || 'a hiring company',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Remote',
        addressCountry: DEFAULT_COUNTRY,
      },
    },
    directApply: true,
  };
  if (job.remote) {
    ld.jobLocationType = 'TELECOMMUTE';
  }
  if (job.salary_min != null || job.salary_max != null) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: DEFAULT_CURRENCY,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary_min ?? job.salary_max,
        maxValue: job.salary_max ?? job.salary_min,
        unitText: 'YEAR',
      },
    };
  }
  return ld;
}

export function itemList(jobs) {
  return {
    '@type': 'ItemList',
    itemListElement: jobs.map((job, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: jobPosting(job),
    })),
  };
}

export function faqPage(qa) {
  return {
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
