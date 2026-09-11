// Индексировать сайт можно только когда он отдаётся с канонического домена
// (того, что стоит в `site`). Netlify кладёт основной адрес сайта в
// переменную окружения URL, поэтому пока подключён только адрес вида
// *.netlify.app, страницы закрыты от поисковиков — и откроются сами,
// как только основным доменом станет канонический.
const deployUrl = process.env.URL;

export const isCanonicalHost = (site: URL | undefined): boolean => {
  if (!site || !deployUrl) return false;

  try {
    return new URL(deployUrl).host === site.host;
  } catch {
    return false;
  }
};
