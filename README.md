# Conference Tracker

Личный трекер конференций, идущих исследований и научных работ.
Чистый статический фронтенд: **HTML + CSS + ванильный JS**, без сборки и сервера.
Открывается двойным кликом по `index.html` (работает с `file://`). Деплой — GitHub Pages.

## Возможности

- **5 вкладок:** Будущие, Сейчас идут, Прошедшие, Статьи, Календарь.
- **Три типа записей:** конференции, статьи (PubMed), идущие исследования (ClinicalTrials.gov).
- **Upsert-импорт:** при обновлении базы фактические поля карточки обновляются из источника,
  а личные поля пользователя (оценка, заметки, статус посещения, «в моём календаре») сохраняются.
- **Статус посещения** (`Не посетил / Посетил / Онлайн`) — переключается одним кликом на карточке.
- **Экспорт в календарь:** `.ics` (RFC 5545) и ссылка Google Calendar, плюс внутренняя отметка «моё».
- **Инлайн-правка** оценки (звёзды) и заметок прямо в карточке.
- **Короткое описание (RU)** — кнопка «Кратко».
- **Резервная синхронизация** через GitHub Gist (`js/sync.js`).
- **Тема** auto / light / dark, языки RU / EN.

## Структура

```
index.html              # разметка: 5 вкладок, модалка, панель синхронизации
css/styles.css          # тема auto light/dark, карточки, таблица, календарь
js/
  i18n.js               # словари RU/EN + переключение языка
  store.js              # модель, CRUD, localStorage, фазы, importItems() (upsert)
  render.js             # window.U + рендер карточек/таблицы
  modal.js              # форма добавления/редактирования
  calendar.js           # месячный календарь (только конференции)
  import-helpers.js     # билдеры CT.conf / CT.paper / CT.study
  import-data.js        # ДАННЫЕ window.CT_IMPORT (генерируется скриптом)
  import.js             # авто-слияние при загрузке (add/upsert, dedup)
  ics.js                # экспорт .ics + Google Calendar
  update.js             # кнопка «Обновить базу» (repository_dispatch + опрос)
  sync.js               # GitHub Gist push/pull + owner/repo
  app.js                # контроллер: вкладки, тема, язык, поиск, фильтры
scripts/
  build-import-data.mjs # сбор данных (Node 20, ESM, native fetch)
  conferences.seed.json # курируемый список конференций
.github/workflows/update-data.yml
```

## Авто-обновление

Файл `js/import-data.js` пересобирается воркфлоу `.github/workflows/update-data.yml`:

- **по кнопке** «⟳ Обновить базу» в шапке (через `repository_dispatch`),
- **вручную** — `workflow_dispatch` (вкладка Actions → Update data → Run workflow),
- **по расписанию** — cron каждый понедельник 06:00 UTC.

Скрипт собирает:

- **статьи** — PubMed E-utilities (без ключа),
- **исследования** — ClinicalTrials.gov API v2 (Recruiting / Active),
- **конференции** — курируемый `scripts/conferences.seed.json` (ближайшие будущие даты).

Тематика задаётся константой `TOPIC` в начале `scripts/build-import-data.mjs`
(микроваскулярная декомпрессия / нейроваскулярные конфликты).

### Секреты и токены

| Что | Где | Зачем |
|-----|-----|-------|
| `ANTHROPIC_API_KEY` | Settings → Secrets → Actions | RU-описания (`descRu`). Без ключа скрипт работает, описания пустые. |
| GitHub token (scope `gist`) | панель «Синхронизация» в UI | резервная копия в Gist. |
| GitHub token (scope `repo` или `actions:write`) | панель «Синхронизация» (поля Owner / Repo / Token) | кнопка «Обновить базу» — запуск воркфлоу через API. |

> Кнопка «Обновить базу» шлёт `POST /repos/{owner}/{repo}/dispatches` и опрашивает
> последний run. По завершении (`success`) страница перезагружается.

### Запуск сборки вручную (локально)

```bash
node scripts/build-import-data.mjs
# с RU-описаниями:
ANTHROPIC_API_KEY=sk-... node scripts/build-import-data.mjs
```

## Локальная разработка

Откройте `index.html` двойным кликом — никакой сборки не требуется.
Данные пользователя хранятся в `localStorage`.
