# HERMITAGE DECOR — Документация по деплою

## Содержание

1. [Что нужно перед началом](#1-что-нужно-перед-началом)
2. [Структура проекта](#2-структура-проекта)
3. [Настройка сервера](#3-настройка-сервера)
4. [Загрузка проекта на сервер](#4-загрузка-проекта-на-сервер)
5. [Настройка переменных окружения](#5-настройка-переменных-окружения)
6. [Создание первого админа](#6-создание-первого-админа)
7. [Первый запуск (деплой)](#7-первый-запуск-деплой)
8. [Проверка работоспособности](#8-проверка-работоспособности)
9. [Настройка SSL-сертификата (HTTPS)](#9-настройка-ssl-сертификата-https)
10. [Настройка SMTP для email-уведомлений](#10-настройка-smtp-для-email-уведомлений)
11. [Обновление проекта после изменений в коде](#11-обновление-проекта-после-изменений-в-коде)
12. [Полезные команды](#12-полезные-команды)
13. [Решение проблем](#13-решение-проблем)
14. [Безопасность](#14-безопасность)

---

## 1. Что нужно перед началом

### Сервер

- **ОС**: Ubuntu 22.04 или 24.04 (другие дистрибутивы Linux тоже работают, но инструкция для Ubuntu)
- **RAM**: минимум 2 ГБ (рекомендуется 4 ГБ)
- **Диск**: минимум 10 ГБ свободного места
- **Доступ**: SSH-доступ к серверу от root-пользователя или пользователя с `sudo`

### На вашем компьютере

- **Terminal** (на Windows — PowerShell, Git Bash или WSL; на Mac/Linux — стандартный терминал)
- **Доступ к интернету** для загрузки файлов на сервер

### Что вы должны знать

- **IP-адрес сервера** — Numbers и точки, например `95.163.12.45`
- **Пароль SSH** от сервера (или SSH-ключ)
- **Доменное имя** (если есть) — например `hermitage-decor.ru`

---

## 2. Структура проекта

```
hermitage/
├── .env.production          ← Шаблон переменных окружения (НЕ содержит реальных паролей)
├── docker-compose.yml       ← Конфигурация Docker (все 4 сервиса)
├── deploy.sh                ← Скрипт деплоя
├── setup-server.sh          ← Скрипт первоначальной настройки сервера
├── nginx/
│   ├── nginx.conf           ← Конфигурация веб-сервера nginx (HTTPS включён по умолчанию)
│   └── ssl/                 ← SSL-сертификаты (СОЗДАТЬ ВРУЧНУЮ)
├── hermitage-backend/       ← Backend (Express + Prisma + PostgreSQL)
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/schema.prisma ← Схема базы данных
│   ├── prisma/seed.js       ← Очистка БД (development only)
│   ├── scripts/create-admin.js ← Создание первого админа (CLI)
│   └── src/                 ← Исходный код backend
└── NextProject/             ← Frontend (Next.js)
    ├── Dockerfile
    ├── package.json
    └── app/                 ← Страницы сайта
```

Проект состоит из **4 сервисов** (контейнеров Docker):
| Сервис | Описание | Порт |
|---|---|---|
| `postgres` | База данных PostgreSQL | 5432 (только внутри) |
| `backend` | API-сервер Express | 5000 (только внутри) |
| `frontend` | Веб-сайт Next.js | 3000 (только внутри) |
| `nginx` | Веб-сервер (принимает запросы снаружи) | **80** (редирект на HTTPS) и **443** (HTTPS) |

Все сервисы доступны снаружи **только через nginx**. Порт 80 автоматически перенаправляет на HTTPS (порт 443).

---

## 3. Настройка сервера

> Эта процедура выполняется **один раз** при первой настройке нового сервера.

### 3.1. Подключитесь к серверу по SSH

Откройте терминал на своём компьютере и выполните:

```bash
ssh root@ВАШ_IP
```

Например:
```bash
ssh root@95.163.12.45
```

Введите пароль, когда будет предложено.

### 3.2. Обновите систему

```bash
apt update && apt upgrade -y
```

### 3.3. Установите Docker

Docker — это программа, которая запускает приложения в изолированных контейнерах.

```bash
curl -fsSL https://get.docker.com | sh
```

### 3.4. Установите Docker Compose

Docker Compose управляет несколькими контейнерами одновременно.

```bash
apt install -y docker-compose-plugin
```

### 3.5. Включите автозапуск Docker

```bash
systemctl enable docker
systemctl start docker
```

### 3.6. Настройте файрвол (UFW)

```bash
apt install -y ufw
ufw allow 22/tcp    # SSH (чтобы не заблокировать себя)
ufw allow 80/tcp    # HTTP (редирект на HTTPS)
ufw allow 443/tcp   # HTTPS (сайт)
ufw --force enable
```

### 3.7. Проверьте, что всё работает

```bash
docker --version
docker compose version
ufw status
```

Должны увидеть версии Docker и статус файрвола.

---

## 4. Загрузка проекта на сервер

### Способ A: Через SCP (рекомендуется для первого раза)

На **вашем компьютере** (не на сервере!) выполните:

**Windows (PowerShell):**
```powershell
scp -r "C:\Users\ВАШЕ_ИМЯ\Desktop\hermitage" root@ВАШ_IP:/opt/hermitage
```

**Mac / Linux:**
```bash
scp -r ~/Desktop/hermitage root@ВАШ_IP:/opt/hermitage
```

Введите пароль SSH. Загрузка займёт несколько минут.

### Способ B: Через Git (если проект в репозитории)

На сервере:
```bash
cd /opt
git clone ВАШ_РЕПОЗИТОРИЙ hermitage
```

### Способ C: Через SFTP

Используйте программу FileZilla или WinSCP:
1. Подключитесь к серверу (хост: `ВАШ_IP`, пользователь: `root`, пароль: `ваш пароль`)
2. Перетащите папку `hermitage` на сервер в `/opt/hermitage`

### Проверьте загрузку

```bash
ls -la /opt/hermitage
```

Должны увидеть файлы: `docker-compose.yml`, `deploy.sh`, `hermitage-backend/`, `NextProject/` и другие.

---

## 5. Настройка переменных окружения

### 5.1. Скопируйте шаблон

```bash
cd /opt/hermitage
cp .env.production .env
```

### 5.2. Откройте файл для редактирования

```bash
nano .env
```

Откроется текстовый редактор. Используйте стрелки для перемещения.

### 5.3. Заполните значения

Файл должен выглядеть так (замените `XXX` на ваши данные):

```bash
# === Docker Compose Environment ===

# IP-адрес или домен сервера (БЕЗ http://)
HOST_IP=95.163.12.45

# URL сайта (С http://) — для карты сайта и SEO
NEXT_PUBLIC_SITE_URL=http://95.163.12.45

# PostgreSQL — ОБЯЗАТЕЛЬНО заполнить
POSTGRES_DB=hermitage_db
POSTGRES_USER=myuser
POSTGRES_PASSWORD=МойНадёжныйПароль123

# Backend — JWT_SECRET (минимум 32 символа)
JWT_SECRET=a3Kx9mB2pQ7wR4tY8nF6jL1dS5gH0vC3eU7iO2kA4xZ8bN6mW1rT9yQ3

# SMTP (email-уведомления) — пока можно оставить как есть
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HERMITAGE DECOR <noreply@hermitage-decor.ru>"
```

**Все параметры обязательны для заполнения.** Дефолтных значений нет — если оставить `CHANGE_ME`, деплой остановится с ошибкой.

| Параметр | Как заполнить | Пример |
|---|---|---|
| `HOST_IP` | IP-адрес сервера или домен | `95.163.12.45` |
| `NEXT_PUBLIC_SITE_URL` | `http://` + IP или домен | `http://95.163.12.45` |
| `POSTGRES_USER` | Произвольный логин PostgreSQL | `myuser` |
| `POSTGRES_PASSWORD` | Надёжный пароль (8+ символов) | `MySecurePass2026!` |
| `JWT_SECRET` | Сгенерируйте командой ниже | `a3Kx9mB2pQ7...` |

**Как сгенерировать JWT_SECRET:**

Откройте второй терминал (или выполните в новой вкладке SSH):

```bash
openssl rand -base64 48
```

Скопируйте результат и вставьте в `JWT_SECRET`.

### 5.4. Сохраните файл

Нажмите:
1. `Ctrl + O` (сохранить)
2. `Enter` (подтвердить имя файла)
3. `Ctrl + X` (выйти из редактора)

---

## 6. Создание первого админа

> **Важно:** Seed-скрипт (`seed.js`) **не создаёт пользователей** — он только очищает БД и предназначен для development. Для создания первого админа на продакшене используйте CLI-команду `create-admin`.

### 6.1. Создайте админа через CLI

Подключитесь к серверу и выполните:

```bash
cd /opt/hermitage
docker compose exec backend npm run create-admin
```

Скрипт попросит ввести email и автоматически сгенерирует надёжный пароль:

```
Admin email: admin@hermitage-decor.ru

========================================
  Admin account created successfully!
========================================
  Email:    admin@hermitage-decor.ru
  Password: xK9#mB2$pL5wR8nQ
========================================
  Save this password! It will not be shown again.
========================================
```

> **Скопируйте пароль и сохраните в надёжное место!** Он больше не будет показан.

### 6.2. Создание админа с заданным паролем

Если нужно задать пароль вручную:

```bash
docker compose exec backend npm run create-admin -- --email=admin@hermitage-decor.ru
```

Скрипт предложит ввести пароль интерактивно.

### 6.3. Создание менеджера

Менеджеров создаёт **админ** через админ-панель:

1. Войдите в админку с данными админа
2. Перейдите в **Пользователи** → **Создать**
3. Укажите email, пароль и роль **MANAGER**

### 6.4. Если админ уже существует

Скрипт `create-admin` проверяет, есть ли уже админ в базе. Если админ уже создан, он выведет:

```
Admin already exists: admin@hermitage-decor.ru
To create another admin, do it from the admin panel.
```

Чтобы создать нового админа, удалите старого через SQL:

```bash
docker compose exec postgres psql -U postgres -d hermitage_db
```

```sql
DELETE FROM "User" WHERE email = 'старый-email@example.com';
\q
```

Затем запустите `create-admin` заново.

---

## 7. Первый запуск (деплой)

### 7.1. Запустите скрипт деплоя

```bash
cd /opt/hermitage
bash deploy.sh
```

### 7.2. Что будет происходить

Скрипт выполнит следующие шаги автоматически:

1. **Проверит** наличие и правильность файла `.env`
2. **Проверит**, что вы изменили пароли и IP (не оставили значения по умолчанию)
3. **Остановит** старые контейнеры (если были)
4. **Соберёт Docker-образы** — это займёт **5-15 минут**第一次 (скачивание зависимостей, компиляция)
5. **Запустит** 4 контейнера: PostgreSQL, backend, frontend, nginx
6. **Подождёт** 10 секунд, пока база данных запустится
7. **Применит миграции** базы данных (создаст таблицы)

### 7.3. Создайте первого админа

После успешного деплоя создайте первого админа:

```bash
cd /opt/hermitage
docker compose exec backend npm run create-admin
```

Введите email и сохраните сгенерированный пароль (подробнее в разделе 6).

### 7.4. Если всё прошло успешно

Вы увидите сообщение:

```
=== Deployment complete ===
Frontend: https://95.163.12.45
Backend API: https://95.163.12.45/api

Useful commands:
  docker compose logs -f          # View logs
  docker compose down              # Stop all
  docker compose restart backend   # Restart backend
```

Затем создайте первого админа (см. раздел 6).

### 7.5. Если есть ошибки

Если скрипт выдал ошибку, см. раздел [13. Решение проблем](#13-решение-проблем).

---

## 8. Проверка работоспособности

### 8.1. Откройте сайт в браузере

Перейдите по адресу:
```
https://ВАШ_IP
```

Например: `https://95.163.12.45`

Вы должны увидеть главную страницу магазина HERMITAGE DECOR.

> **Примечание:** Если SSL-сертификаты ещё не настроены, браузер покажет предупреждение о небезопасном соединении. Это нормально до настройки SSL (см. раздел 9).

### 8.2. Откройте админ-панель

Перейдите по адресу:
```
https://ВАШ_IP/admin/login
```

Войдите с данными, которые вы создали через `npm run create-admin` (раздел 6):
- **Email**: email, который вы указали при создании админа
- **Пароль**: сгенерированный пароль

### 8.3. Проверьте здоровье backend

```bash
curl -k https://localhost/api/../health
```

Или через внутренний доступ:
```bash
curl http://localhost:5000/health
```

Должны получить:
```json
{"status":"ok","timestamp":"2026-07-24T..."}
```

### 8.4. Проверьте статус контейнеров

```bash
docker compose ps
```

Все 4 сервиса должны быть в статусе `running` или `Up`.

### 8.5. Проверьте SSL-сертификаты

```bash
ls -la /opt/hermitage/nginx/ssl/
```

Должны увидеть файлы `fullchain.pem` и `privkey.pem`. Если их нет — выполните раздел 9.

---

## 9. Настройка SSL-сертификата (HTTPS)

> **Обязательно.** nginx настроен на HTTPS по умолчанию. Без сертификатов сайт не будет открываться в браузере.

### 9.1. Если есть доменное имя

Если у вас есть домен (например `hermitage-decor.ru`), настройте его DNS:

В настройках домена (у регистратора) добавьте:
- **A-запись**: `@` → `ВАШ_IP`
- **A-запись**: `www` → `ВАШ_IP`

Подождите 5-30 минут, пока DNS обновится. Проверьте:
```bash
ping hermitage-decor.ru
```

### 9.2. Установите Certbot

На сервере:
```bash
apt install -y certbot
```

### 9.3. Получите сертификат

**Важно:** На время получения сертификата нужно временно остановить nginx:

```bash
cd /opt/hermitage
docker compose stop nginx
```

Получите сертификат:
```bash
certbot certonly --standalone -d hermitage-decor.ru -d www.hermitage-decor.ru
```

Следуйте инструкциям (введите email, согласитесь с условиями).

После получения сертификата скопируйте его в папку nginx:

```bash
mkdir -p /opt/hermitage/nginx/ssl
cp /etc/letsencrypt/live/hermitage-decor.ru/fullchain.pem /opt/hermitage/nginx/ssl/
cp /etc/letsencrypt/live/hermitage-decor.ru/privkey.pem /opt/hermitage/nginx/ssl/
chmod 600 /opt/hermitage/nginx/ssl/privkey.pem
```

Запустите nginx:
```bash
docker compose start nginx
```

### 9.4. Если нет домена (тестовый сервер)

Для тестового сервера без домена создайте самоподписанный сертификат:

```bash
mkdir -p /opt/hermitage/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/hermitage/nginx/ssl/privkey.pem \
  -out /opt/hermitage/nginx/ssl/fullchain.pem \
  -subj "/C=RU/ST=Local/L=Local/O=Hermitage/CN=localhost"
```

> **Примечание:** Браузер будет показать предупреждение о самоподписанном сертификате. Это нормально для тестового сервера.

### 9.5. Настройте автопродление сертификата

Certbot-сертификаты действуют 90 дней. Настройте автопродление:

```bash
echo "0 0 1 * * root certbot renew --quiet && cp /etc/letsencrypt/live/hermitage-decor.ru/fullchain.pem /opt/hermitage/nginx/ssl/ && cp /etc/letsencrypt/live/hermitage-decor.ru/privkey.pem /opt/hermitage/nginx/ssl/ && cd /opt/hermitage && docker compose restart nginx" | crontab -
```

### 9.6. Проверьте HTTPS

Откройте в браузере:
```
https://hermitage-decor.ru
```

Должна открыться сайт с иконкой замка в адресной строке.

---

## 10. Настройка SMTP для email-уведомлений

SMTP нужен для отправки email-уведомлений клиентке о новых заказах.

### Вариант A: Яндекс Почта (рекомендуется для России)

1. В настройках Яндекс-почты включите **imap/smtp** и создайте **пароль приложения**
2. Откройте `.env` на сервере:
   ```bash
   nano /opt/hermitage/.env
   ```
3. Замените SMTP-секции:
   ```bash
   SMTP_HOST=smtp.yandex.ru
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=ваша_почта@yandex.ru
   SMTP_PASS=пароль_приложения
   SMTP_FROM="HERMITAGE DECOR <ваша_почта@yandex.ru>"
   ```
4. Перезапустите backend:
   ```bash
   cd /opt/hermitage
   docker compose restart backend
   ```

### Вариант B: Gmail

1. В настройках Google-аккаунта создайте **пароль приложения**
2. В `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=ваша_почта@gmail.com
   SMTP_PASS=пароль_приложения
   SMTP_FROM="HERMITAGE DECOR <ваша_почта@gmail.com>"
   ```

### Вариант C: Без SMTP (пока пропустить)

Оставьте значения по умолчанию. Уведомления не будут отправляться, но сайт будет работать.

---

## 11. Обновление проекта после изменений в коде

Когда вы внесёте изменения в код на своём компьютере, нужно обновить проект на сервере.

### Шаг 1: Загрузите изменения на сервер

**SCP (на вашем компьютере):**
```bash
scp -r "C:\Users\ВАШЕ_ИМЯ\Desktop\hermitage" root@ВАШ_IP:/opt/hermitage
```

**Git (на сервере):**
```bash
cd /opt/hermitage
git pull
```

> **Важно:** Не копируйте `.env` файл — он содержит пароли. На сервере уже есть свой `.env` с реальными данными.

### Шаг 2: Запустите деплой на сервере

```bash
cd /opt/hermitage
bash deploy.sh
```

Скрипт пересоберёт только измёненные контейнеры и перезапустит их.

---

## 12. Полезные команды

Все команды выполняются на сервере в папке `/opt/hermitage`.

### Просмотр логов (что происходит внутри контейнеров)

```bash
# Все сервисы
docker compose logs -f

# Только backend (API)
docker compose logs -f backend

# Только frontend (сайт)
docker compose logs -f frontend

# Только nginx (веб-сервер)
docker compose logs -f nginx

# Только база данных
docker compose logs -f postgres
```

Нажмите `Ctrl + C` чтобы выйти из просмотра логов.

### Перезапуск сервисов

```bash
# Перезапустить всё
docker compose restart

# Перезапустить только backend
docker compose restart backend

# Перезапустить только nginx
docker compose restart nginx
```

### Остановка и запуск

```bash
# Остановить всё
docker compose down

# Запустить всё
docker compose up -d

# Остановить и удалить данные БЕЗОПАСНО (данные в volume сохранятся)
docker compose down
docker compose up -d
```

### Проверка статуса

```bash
docker compose ps
```

### Подключение к базе данных

```bash
docker compose exec postgres psql -U postgres -d hermitage_db
```

После входа:
```sql
-- Посмотреть всех пользователей
SELECT id, email, "firstName", "lastName", role FROM "User";

-- Выйти
\q
```

### Просмотр используемого места

```bash
docker system df
```

---

## 13. Решение проблем

### Проблема: `deploy.sh` выдаёт "ERROR: HOST_IP is not set"

**Причина:** Вы не изменили `HOST_IP` в файле `.env`.

**Решение:**
```bash
nano /opt/hermitage/.env
```
Замените `YOUR_SERVER_IP` на ваш реальный IP-адрес.

---

### Проблема: `deploy.sh` выдаёт "ERROR: JWT_SECRET must be changed"

**Причина:** Вы не изменили `JWT_SECRET` в файле `.env`.

**Решение:**
```bash
# Сгенерируйте новый секрет
openssl rand -base64 48
```
Скопируйте результат в `JWT_SECRET` в файле `.env`.

---

### Проблема: `deploy.sh` выдаёт "ERROR: POSTGRES_PASSWORD must be changed"

**Причина:** Вы не изменили `POSTGRES_PASSWORD` в файле `.env`.

**Решение:**
```bash
nano /opt/hermitage/.env
```
Придумайте надёжный пароль и вставьте в `POSTGRES_PASSWORD`.

---

### Проблема: `deploy.sh` выдаёт "ERROR: POSTGRES_USER must be changed"

**Причина:** Вы не изменили `POSTGRES_USER` в файле `.env`.

**Решение:**
```bash
nano /opt/hermitage/.env
```
Замените `CHANGE_ME` на произвольное имя пользователя PostgreSQL.

---

### Проблема: Сайт не открывается / браузер показывает ошибку SSL

**Причина:** SSL-сертификаты не настроены.

**Решение:** Выполните раздел 9 (Настройка SSL-сертификата).

---

### Проблема: Ошибка 502 Bad Gateway

**Причина:** Backend или frontend не запустились.

**Решение:**
```bash
# Посмотрите логи backend
docker compose logs backend

# Если видите ошибку базы данных, перезапустите всё
docker compose down
docker compose up -d
```

> **Примечание:** Сайт доступен через HTTPS (порт 443), а не HTTP. Убедитесь, что вы открываете `https://`, а не `http://`.

---

### Проблема: `Cannot connect to Docker daemon`

**Причина:** Docker не запущен.

**Решение:**
```bash
systemctl start docker
```

---

### Проблема: Нет аккаунта админа / забыли пароль

Создайте нового админа через CLI:

```bash
cd /opt/hermitage
docker compose exec backend npm run create-admin
```

Или удалите старого админа и создайте заново:

```bash
docker compose exec postgres psql -U postgres -d hermitage_db
```

```sql
DELETE FROM "User" WHERE email = 'старый-email@example.com';
\q
```

```bash
docker compose exec backend npm run create-admin
```

---

### Проблема: Диск закончился

```bash
# Проверить место
df -h

# Очистить неиспользуемые Docker-образы
docker system prune -a
```

---

### Проблема: SSH подключение не работает

1. Проверьте, что IP-адрес верный
2. Проверьте, что порт 22 открыт: `ufw status`
3. Попробуйте подключиться с другого компьютера
4. Перезапустите сервер через панель провайдера

---

## 14. Безопасность

### Что уже настроено

**Сеть и сервер:**
- PostgreSQL доступен только изнутри (не снаружи) — привязка к `127.0.0.1`
- Backend доступен только через nginx
- HTTPS включён по умолчанию (TLS 1.2/1.3)
- HTTP автоматически перенаправляет на HTTPS (301 редирект)
- Rate limiting на API (1000 запросов в час)
- Строгий rate limiting на login/register (20 попыток / 15 минут)

**Заголовки безопасности (nginx):**
- `Strict-Transport-Security` (HSTS) — браузер запоминает HTTPS на 1 год
- `X-Frame-Options: SAMEORIGIN` — защита от clickjacking
- `X-Content-Type-Options: nosniff` — защита от MIME-сниффинга
- `X-XSS-Protection: 1; mode=block` — встроенная XSS-защита браузера
- `Content-Security-Policy` — ограничение источников скриптов, стилей, фреймов
- `Permissions-Policy` — отключены камера, микрофон, геолокация
- `Referrer-Policy` — контроль передачи информации об источнике

**Backend (Express):**
- **Helmet** — автоматические security-заголовки
- **CORS** — ограничение доменов (настроено через CLIENT_URL)
- **sanitize-html** — валидация и очистка всех входных данных (body, query, params)
- **joi** — валидация структуры входных данных (email, пароли, ID, числа)
- **bcrypt** — хеширование паролей (salt rounds: 12)
- **JWT** — токены с ограничением по времени (7 дней)
- **Prisma ORM** — защита от SQL-инъекций
- **Загрузка файлов** — ограничение типов (только изображения) и размера (5 МБ)
- **Лимит JSON** — ограничение размера запроса (10 КБ)
- **Экранирование HTML** в email-шаблонах — защита от XSS в уведомлениях

### Что нужно сделать дополнительно

1. **Создайте первого админа** через `npm run create-admin` (не используйте seed для этого)
2. **Настройте SSL** (раздел 9) — сертификаты положите в `nginx/ssl/`
3. **На SSH-сервере** рекомендуется:
   - Использовать SSH-ключи вместо паролей
   - Отключить вход root-пользователя по паролю
4. **Не коммитьте** `.env` файл в git — он содержит пароли и секреты
5. **Регулярно обновляйте** Docker-образы: `docker compose pull && docker compose up -d`

---

## Краткая шпаргалка

| Действие | Команда |
|---|---|
| Первый деплой | `bash deploy.sh` |
| Создать админа | `docker compose exec backend npm run create-admin` |
| Обновить код | загрузить файлы → `bash deploy.sh` |
| Посмотреть логи | `docker compose logs -f` |
| Перезапустить всё | `docker compose restart` |
| Остановить всё | `docker compose down` |
| Запустить всё | `docker compose up -d` |
| Статус контейнеров | `docker compose ps` |
| Подключиться к БД | `docker compose exec postgres psql -U postgres -d hermitage_db` |
| Проверить SSL | `openssl s_client -connect localhost:443` |
