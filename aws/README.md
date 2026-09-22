# Инфраструктура на AWS

Сайт статический и лежит в S3, формы принимает отдельная Lambda и отправляет
письма через SES. Ключи отправителя остаются в лямбде, в браузер попадает
только адрес эндпоинта.

```
браузер ──POST /api/forms──> CloudFront ──> Lambda Function URL ──> SES ──> ящик ресторана
         ──GET  /*────────>  CloudFront ──> S3 (dist/)
```

Всё делается один раз руками в консоли, регион везде **eu-central-1**
(Франкфурт) — ближе к гостям и чище по DSGVO.

## 1. SES

1. **Verified identities → Create identity → Domain**: `restaurant-maseltopf.de`,
   включить Easy DKIM. Добавить выданные CNAME-записи в DNS домена, дождаться
   статуса `Verified` (обычно до часа).
2. Там же **Create identity → Email address**: `masel-topf@hotmail.com`,
   подтвердить по ссылке из письма.

Про песочницу: новый аккаунт SES может писать только на подтверждённые адреса.
Получатель у нас один и он подтверждён на шаге 2, так что выходить из песочницы
не нужно. Понадобится только если захотите слать письма самим гостям
(подтверждение подписки на рассылку) — тогда **Account dashboard → Request
production access**, обычно сутки.

Для доставляемости стоит добавить в DNS ещё две записи:

```
TXT  @        "v=spf1 include:amazonses.com ~all"
TXT  _dmarc   "v=DMARC1; p=none; rua=mailto:masel-topf@hotmail.com"
```

## 2. Lambda

**Create function**, runtime **Node.js 22**, архитектура arm64 (дешевле).
Содержимое `forms/index.mjs` вставить в редактор кода — зависимостей нет,
AWS SDK v3 уже есть в рантайме, собирать и паковать нечего.

Настройки функции:

| Параметр | Значение |
|---|---|
| Handler | `index.handler` |
| Timeout | 10 сек |
| Reserved concurrency | `5` — потолок на случай, если эндпоинт начнут долбить |

Переменные окружения:

| Переменная | Значение |
|---|---|
| `MAIL_FROM` | `noreply@restaurant-maseltopf.de` |
| `MAIL_TO` | `masel-topf@hotmail.com` |
| `ALLOWED_ORIGINS` | пусто, если лямбда за CloudFront (см. ниже) |

В роль функции добавить inline-политику:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "ses:SendEmail",
    "Resource": "*"
  }]
}
```

**Configuration → Function URL → Create**, auth type `NONE`, CORS в консоли
**не включать** — заголовки ставит сам код по `ALLOWED_ORIGINS`.

## 3. S3 + CloudFront

Бакет приватный, публичный доступ выключен, website hosting не нужен — раздаёт
CloudFront через Origin Access Control.

1. **S3**: создать бакет, `Block all public access` оставить включённым.
2. **CloudFront → Create distribution**, origin — бакет, Origin access →
   Origin access control, дальше кнопка скопирует готовую политику бакета.
3. Default root object: `index.html`.
4. **Functions → Create function**, вставить `cloudfront/rewrite.js`,
   опубликовать и привязать к default behavior на **Viewer request**.
   Без неё из бакета откроется только главная: у Astro `trailingSlash: 'never'`,
   а страницы лежат как `speisekarte/index.html`.
5. **Error pages**: `403` и `404` → отдавать `/404.html` с кодом `404`
   (S3 на отсутствующий ключ отвечает 403, поэтому нужны оба).
6. Свой домен: сертификат в ACM обязательно в **us-east-1**, затем
   Alternate domain names + Alias-запись в DNS.

### Эндпоинт форм на том же домене

В дистрибуции добавить **второй origin** — домен Function URL лямбды (протокол
HTTPS only) — и **behavior** на path pattern `/api/*`:

- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache policy: `CachingDisabled`
- Origin request policy: `AllViewerExceptHostHeader` (иначе лямбда отвергнет
  подпись запроса)

Тогда форма шлёт на свой же домен: CORS не нужен, preflight-запроса нет, адрес
лямбды наружу не торчит. `ALLOWED_ORIGINS` оставить пустым.

Лямбда ждёт запрос по пути `/api/forms`, но path в неё приходит как есть —
если хотите другой путь, просто поменяйте `PUBLIC_FORM_ENDPOINT`, обработчик
на путь не смотрит.

### Если CloudFront не будет

Function URL можно дать форме напрямую: в `ALLOWED_ORIGINS` записать
`https://restaurant-maseltopf.de`, а в `PUBLIC_FORM_ENDPOINT` — полный адрес
Function URL. Работает, но адрес лямбды виден в исходниках страницы, поэтому
Reserved concurrency из шага 2 тогда обязателен.

## 4. Сборка сайта

```sh
PUBLIC_FORM_ENDPOINT="/api/forms" npm run build
aws s3 sync dist/ s3://<бакет>/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths '/*'
```

`PUBLIC_FORM_ENDPOINT` нужен на этапе сборки: Astro подставляет его в статику,
менять адрес после деплоя без пересборки нельзя.

## Проверка

```sh
curl -i https://restaurant-maseltopf.de/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"form":"contact","name":"Test","email":"test@example.com","message":"Hallo"}'
```

Ожидаемо `200 {"ok":true}` и письмо в ящике. Ошибки SES видно в CloudWatch
Logs группы функции.
