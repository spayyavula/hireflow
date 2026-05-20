export default (pageContext) => {
  const job = pageContext.data?.job;
  return job
    ? `${job.title} at ${job.company_name} | Hyrly`
    : 'Job not found | Hyrly';
};
