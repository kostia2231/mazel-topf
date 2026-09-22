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

Шаги ниже можно не кликать руками: после создания бакета и `aws configure`
всё поднимает скрипт, он же запишет `DISTRIBUTION` в `.env.deploy`.

```sh
bash scripts/setup-cloudfront.sh
```

Скрипт создаёт OAC, публикует функцию маршрутизации, создаёт дистрибуцию со
страницами ошибок и вешает на бакет политику, разрешающую чтение только этой
дистрибуции. Повторный запуск ничего не ломает: готовые части переиспользуются.
Ручной порядок для справки:


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

## 4. Права и CLI для деплоя

Деплой идёт с рабочей машины через AWS CLI. Установка на Linux arm64
(распаковывать не в корне проекта — там уже есть каталог `aws/`):

```sh
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install
aws configure
```

Прав нужно двое разных. Чтобы **один раз** поднять инфраструктуру
(`setup-cloudfront.sh` создаёт OAC, функцию, дистрибуцию и меняет политику
бакета), пользователю нужны `AmazonS3FullAccess` и `CloudFrontFullAccess` —
или временный доступ администратора.

Когда всё создано, эти политики стоит снять и оставить только права на
деплой — этот бакет и эта дистрибуция, ничего больше:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::<бакет>"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<бакет>/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:GetDistribution", "cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::<account-id>:distribution/<id>"
    }
  ]
}
```

## 5. Формы

```sh
bash scripts/setup-forms.sh
```

Создаёт SES-идентичность домена с DKIM-записями в Route 53, роль и лямбду,
Function URL с авторизацией `AWS_IAM` и поведение `/api/*` на дистрибуции.
Лямбда не выставлена наружу: CloudFront ходит к ней через origin access
control и подписывает запросы, публичный вызов Function URL запрещён.

Два следствия этой схемы, о которых легко забыть:

- Подписанный Lambda-origin не принимает запросы с телом без хеша, поэтому
  браузер шлёт `x-amz-content-sha256` — это делает код форм в `Layout.astro`.
- Каждой новой дистрибуции нужны свои разрешения и своё поведение `/api/*`:
  при переезде на боевой домен скрипт запускается повторно с новым
  `DISTRIBUTION` в `.env.deploy`.

Пока аккаунт SES в песочнице, письма уходят только на подтверждённые адреса.
Скрипт отправляет запрос подтверждения на `MAIL_TO`; по ссылке из письма
надо перейти один раз. Состояние:

```sh
aws sesv2 get-email-identity --region eu-central-1 --email-identity <адрес> \
    --query VerifiedForSendingStatus
```

## 6. Тестовый адрес вне поиска

```sh
bash scripts/set-noindex.sh
```

Вешает на дистрибуцию заголовок `X-Robots-Tag: noindex, nofollow`. Сборка без
`SITE_URL` и так уходит с `noindex` в разметке и `Disallow: /` в robots.txt,
это третий рубеж на случай чужих ссылок. На боевой домен не запускать.

## 7. Страница /admin

Меню правится на сайте, по адресу `/admin`, без git и терминала: разделы,
блюда, названия, описания, цены, порядок. Страница закрыта ключом, скрыта из
sitemap и robots.txt и отдаётся с `noindex`.

Что происходит при сохранении: страница отправляет правку в лямбду, лямбда
проверяет ключ, приводит данные к схеме из `src/content.config.ts` и кладёт
изменённые файлы одним коммитом в репозиторий. Коммит запускает GitHub
Actions, тот собирает сайт и выкладывает его в S3. От нажатия до живого
сайта — около двух минут.

Разрешённые пути жёстко ограничены `src/content/menu/{de,en}/*.md`, так что
через эту форму нельзя дотянуться до остального репозитория.

Настройка:

1. Создать в GitHub fine-grained токен на репозиторий сайта с правом
   **Contents: read and write**, вписать его в `.env.deploy` как
   `GITHUB_TOKEN`.
2. Разрешить GitHub Actions выкладывать сайт:

   ```sh
   bash scripts/setup-github-oidc.sh
   ```

   Скрипт создаёт роль, которой доверяет только этот репозиторий, и печатает
   список переменных для **Settings → Secrets and variables → Actions → Variables**.
   Долгоживущие ключи AWS в GitHub не попадают.
3. Поднять обработчик и получить ключ от страницы:

   ```sh
   bash scripts/setup-admin.sh
   ```

   Ключ печатается один раз и в AWS не хранится — только его хеш. Свой ключ
   вместо сгенерированного задаётся переменной `ADMIN_KEY` в `.env.deploy`.

## 8. Деплой

Скопировать `.env.deploy.example` в `.env.deploy` и вписать свои значения
(файл в `.gitignore`, в репозиторий не попадёт):

```sh
cp .env.deploy.example .env.deploy
```

| Переменная | Что это |
|---|---|
| `BUCKET` | имя бакета без `s3://` |
| `DISTRIBUTION` | ID дистрибуции CloudFront, вида `E1234567890ABC` |
| `FORM_ENDPOINT` | попадает в статику как `PUBLIC_FORM_ENDPOINT` |
| `AWS_PROFILE` | необязательно, если профиль не по умолчанию |
| `AWS_REGION` | необязательно |

Дальше:

```sh
npm run deploy -- --dry-run   # показать, что изменится, ничего не трогая
npm run deploy                # собрать, залить, сбросить кэш
npm run deploy -- --yes       # то же без вопроса-подтверждения
```

Скрипт проверяет доступ к бакету и дистрибуции, показывает, под каким
аккаунтом работает, и ждёт подтверждения. Затем собирает сайт, убеждается,
что адрес форм действительно попал в статику, и заливает в три прохода с
разными заголовками кэша:

- `_astro/` — имена с хешем содержимого, поэтому `max-age=31536000, immutable`
- остальная статика (иконки, видео, `og.jpg`) — сутки
- страницы, `sitemap`, `robots.txt` — `no-cache`, чтобы правки выходили сразу

Последним проходом удаляются файлы, которых больше нет в сборке, и создаётся
инвалидация `/*`.

`PUBLIC_FORM_ENDPOINT` нужен на этапе сборки: Astro подставляет его в статику,
менять адрес после деплоя без пересборки нельзя.

### Первый выезд на боевой домен

Перед первым деплоем поверх работающего сайта стоит сохранить его содержимое:

```sh
aws s3 sync s3://<бакет>/ ./backup-old-site/
```

И прогнать `npm run deploy -- --dry-run`: в списке `delete:` не должно быть
файлов, которых нет в репозитории — PDF с меню, старых фотографий,
подтверждений домена в `.well-known`. Всё такое нужно положить в `public/`,
иначе оно исчезнет.

## Проверка

```sh
curl -i https://restaurant-maseltopf.de/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"form":"contact","name":"Test","email":"test@example.com","message":"Hallo"}'
```

Ожидаемо `200 {"ok":true}` и письмо в ящике. Ошибки SES видно в CloudWatch
Logs группы функции.
