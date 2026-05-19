export default (pageContext) => {
  const job = pageContext.data?.job;
  return job
    ? `${job.title} at ${job.company_name} | JobsSearch`
    : 'Job not found | JobsSearch';
};
