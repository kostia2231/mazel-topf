const deployUrl = process.env.URL;

export const isCanonicalHost = (site: URL | undefined): boolean => {
  if (!site || !deployUrl) return false;

  try {
    return new URL(deployUrl).host === site.host;
  } catch {
    return false;
  }
};
