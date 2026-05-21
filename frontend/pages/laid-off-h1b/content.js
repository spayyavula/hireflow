// Content for the /laid-off-h1b landing page. Single source of truth so
// the FAQ JSON-LD (in +Head.jsx) and the visible Q&A section (in +Page.jsx)
// always match — Google requires parity for FAQPage rich-result eligibility.

export const DECISION_POINTS = [
  {
    day: 'Day 1',
    title: 'Pull every immigration document into one folder',
    body: 'Your I-94, your most recent I-797 approval notice, any I-140 if filed, your last three pay stubs, and your termination letter. Most attorneys will ask for these on the first call. Having them ready compresses your timeline by a week.',
  },
  {
    day: 'Day 1-7',
    title: 'AC-21 portability is the most common path forward',
    body: 'A new employer files an H-1B transfer petition. The moment USCIS issues the receipt (not the approval — the receipt), you can start working under that employer. This is what 70%+ of post-layoff H-1B holders end up doing.',
  },
  {
    day: 'Day 1-14',
    title: 'Talk to an immigration attorney early',
    body: 'Most do 30-minute consultations for $0–$200. The cost-of-getting-it-wrong is your status in the US. Even if you end up doing AC-21 straightforwardly, an hour with a lawyer in week one is the cheapest insurance you\'ll buy this decade.',
  },
  {
    day: 'Day 15-30',
    title: 'Premium processing: $2,805 for a 15-business-day receipt',
    body: 'If your new sponsor is willing, premium processing gets your H-1B receipt in ~3 weeks instead of 3-6 months. Many candidates negotiate this with their new employer. Worth asking — the asymmetry is significant.',
  },
  {
    day: 'Day 30-45',
    title: 'I-539 for B-2 visitor status is the backstop',
    body: 'If you\'re not in active offer conversations by day 30, file an I-539 to change status to B-2 (tourist). It stops the 60-day clock while USCIS adjudicates (which takes months). Buys you legal time to keep searching. Last-resort, but a real one.',
  },
];

export const FAQS = [
  {
    q: 'How long do I have on H-1B after being laid off?',
    a: '60 calendar days from your last day of employment — not business days, not from when you were notified. This is the H-1B "grace period" set by federal regulation. On day 61 you\'re accruing unlawful presence, which has long-tail consequences for any future US visa or green card. The clock starts the day after your last paid day; check your termination letter for the exact date.',
  },
  {
    q: 'What is AC-21 portability?',
    a: 'AC-21 is the 2000 American Competitiveness in the Twenty-First Century Act provision that lets you start working for a new H-1B employer as soon as they file a petition on your behalf — you don\'t have to wait for approval. Specifically, you can start the moment USCIS issues the receipt notice (typically 1-3 weeks with regular processing, 15 business days with premium processing). This is the most common post-layoff path because it doesn\'t require leaving the country.',
  },
  {
    q: 'What happens if I can\'t find a new sponsor in 60 days?',
    a: 'You have three legal options: (1) file an I-539 to change to B-2 visitor status — this stops the clock while it adjudicates and lets you keep searching legally; (2) re-enroll in school on F-1 status if you\'re willing to study; (3) leave the US and continue searching from abroad. Each has real tradeoffs. Talk to an immigration attorney before day 45 if you\'re not in active offer conversations — the cheapest mistake to fix is one you anticipate.',
  },
  {
    q: 'Should I file for premium processing?',
    a: 'Almost always yes if you can. $2,805 buys you a USCIS receipt in 15 business days vs 3-6 months with regular processing. Under AC-21, you can\'t start working until the receipt is issued, so the receipt date is effectively your "start date" — premium processing is buying earlier income. Most new employers will cover the fee; some require you to split it. The math overwhelmingly favors paying it.',
  },
  {
    q: 'What should I tell recruiters about my visa status?',
    a: 'Be direct and specific in the first conversation: "I\'m on H-1B, my 60-day grace period started on [date], and I\'m looking for an employer who can file a transfer with premium processing." Don\'t hide it — recruiters who care about it will ask, and recruiters who don\'t care won\'t. Specificity ("60-day clock") signals you understand the timeline, which is reassuring to companies who\'ve sponsored before.',
  },
  {
    q: 'Should I hire an immigration attorney?',
    a: 'For a 30-minute consultation in week one, yes — almost always. ~$0-200 for the call, and they\'ll surface things you didn\'t know to ask about (your I-140 status, dependents, the difference between H-1B portability and H-4 EAD if you\'re married to another H-1B holder). For the actual transfer filing, your new employer\'s attorney typically handles it. The week-one consult is the high-value call.',
  },
];
