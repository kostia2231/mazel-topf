/**
 * CloudFront Function (viewer request) для раздачи сайта из S3.
 *
 * У Astro trailingSlash: 'never', поэтому страница /speisekarte лежит в бакете
 * как speisekarte/index.html. S3 сам такой адрес не разворачивает — дописываем
 * index.html здесь. Заодно убираем хвостовой слеш, чтобы у страницы был один
 * канонический адрес и не плодились дубли в выдаче.
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // /speisekarte/ -> редирект на /speisekarte
  if (uri.length > 1 && uri.endsWith('/')) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri.slice(0, -1) } },
    };
  }

  if (uri === '/') {
    request.uri = '/index.html';
    return request;
  }

  // Адреса без расширения — это страницы, всё остальное отдаём как есть.
  var last = uri.slice(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') === -1) request.uri = uri + '/index.html';

  return request;
}
