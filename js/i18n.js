/* i18n.js — RU/EN dictionaries + language switching.
   Exposes window.I18N { t, setLang, getLang } and fires 'i18n:change'. */
(function () {
  'use strict';

  var DICT = {
    ru: {
      'app.title': 'Трекер конференций',
      'app.subtitle': 'Конференции и научные работы',

      'tab.future': 'Будущие',
      'tab.now': 'Сейчас идут',
      'tab.past': 'Прошедшие',
      'tab.papers': 'Статьи',
      'tab.calendar': 'Календарь',

      'btn.add': '+ Добавить',
      'btn.sync': '☁ Синхронизация',
      'btn.update': '⟳ Обновить базу',
      'btn.theme': 'Тема',
      'btn.lang': 'EN',
      'btn.save': 'Сохранить',
      'btn.cancel': 'Отмена',
      'btn.delete': 'Удалить',
      'btn.close': 'Закрыть',

      'search.placeholder': 'Поиск…',

      'now.studies': 'Идущие исследования',

      'empty.future': 'Нет будущих конференций.',
      'empty.now': 'Сейчас ничего не идёт.',
      'empty.past': 'Нет прошедших конференций.',
      'empty.papers': 'Нет статей.',

      'badge.conference': 'КОНФЕРЕНЦИЯ',
      'badge.paper': 'СТАТЬЯ',
      'badge.study': 'ИССЛЕДОВАНИЕ',

      'phase.future': 'Скоро',
      'phase.now': 'Идёт',
      'phase.past': 'Прошло',

      'field.title': 'Название',
      'field.dateStart': 'Дата начала',
      'field.dateEnd': 'Дата окончания',
      'field.city': 'Город',
      'field.country': 'Страна',
      'field.format': 'Формат',
      'field.language': 'Язык',
      'field.site': 'Сайт',
      'field.reg': 'Регистрация',
      'field.stream': 'Трансляция',
      'field.rec': 'Запись',
      'field.program': 'Программа',
      'field.notes': 'Заметки',
      'field.rating': 'Оценка',
      'field.status': 'Статус',
      'field.tags': 'Теги (через запятую)',
      'field.attendance': 'Посещение',
      'field.descRu': 'Короткое описание (RU)',
      'field.authors': 'Авторы',
      'field.journal': 'Журнал',
      'field.year': 'Год',
      'field.doi': 'DOI',
      'field.abstract': 'Аннотация',
      'field.sponsor': 'Спонсор',
      'field.phase': 'Фаза',
      'field.nct': 'NCT',
      'field.studyStatus': 'Статус исследования',
      'field.dateCompletion': 'Дата завершения',

      'format.online': 'Онлайн',
      'format.offline': 'Офлайн',
      'format.hybrid': 'Гибрид',

      'attendance.not_visited': 'Не посетил',
      'attendance.visited': 'Посетил',
      'attendance.online': 'Онлайн',
      'attendance.all': 'Все посещения',

      'action.brief': 'Кратко',
      'action.details': 'Подробнее',
      'action.edit': 'Изменить',
      'action.calendar': 'В календарь',
      'action.ics': '📅 Скачать .ics',
      'action.google': 'Google Calendar',
      'action.addMyCalendar': '➕ В мой календарь',
      'action.inMyCalendar': '✓ В моём календаре',

      'modal.addTitle': 'Новая запись',
      'modal.editTitle': 'Редактирование',

      'filter.allFormats': 'Все форматы',
      'filter.allTags': 'Все теги',
      'filter.sortDate': 'По дате',
      'filter.sortRating': 'По оценке',
      'filter.sortTitle': 'По названию',

      'cal.onlyMine': 'Только мои',
      'cal.prev': '‹',
      'cal.next': '›',
      'cal.today': 'Сегодня',

      'sync.title': 'Синхронизация (GitHub Gist)',
      'sync.token': 'GitHub токен',
      'sync.tokenHint': 'Для Gist нужен scope «gist». Для кнопки «Обновить базу» — scope «repo» или «actions:write».',
      'sync.gistId': 'Gist ID',
      'sync.owner': 'Owner (репозиторий)',
      'sync.repo': 'Repo (имя)',
      'sync.push': 'Выгрузить ↑',
      'sync.pull': 'Загрузить ↓',
      'sync.auto': 'Автосинхронизация',

      'toast.saved': 'Сохранено',
      'toast.deleted': 'Удалено',
      'toast.imported': 'База обновлена',
      'toast.syncPush': 'Данные выгружены в Gist',
      'toast.syncPull': 'Данные загружены из Gist',
      'toast.syncErr': 'Ошибка синхронизации',
      'toast.updateStart': 'Обновление запущено…',
      'toast.updateProgress': 'Сборка базы выполняется…',
      'toast.updateDone': 'База обновлена, перезагружаю…',
      'toast.updateFail': 'Не удалось обновить базу',
      'toast.updateNeedCfg': 'Укажите owner, repo и токен в настройках синхронизации',
      'toast.updateTimeout': 'Обновление не завершилось вовремя'
    },

    en: {
      'app.title': 'Conference Tracker',
      'app.subtitle': 'Conferences & research papers',

      'tab.future': 'Upcoming',
      'tab.now': 'Happening now',
      'tab.past': 'Past',
      'tab.papers': 'Papers',
      'tab.calendar': 'Calendar',

      'btn.add': '+ Add',
      'btn.sync': '☁ Sync',
      'btn.update': '⟳ Update data',
      'btn.theme': 'Theme',
      'btn.lang': 'RU',
      'btn.save': 'Save',
      'btn.cancel': 'Cancel',
      'btn.delete': 'Delete',
      'btn.close': 'Close',

      'search.placeholder': 'Search…',

      'now.studies': 'Ongoing studies',

      'empty.future': 'No upcoming conferences.',
      'empty.now': 'Nothing is happening now.',
      'empty.past': 'No past conferences.',
      'empty.papers': 'No papers.',

      'badge.conference': 'CONFERENCE',
      'badge.paper': 'PAPER',
      'badge.study': 'STUDY',

      'phase.future': 'Soon',
      'phase.now': 'Live',
      'phase.past': 'Past',

      'field.title': 'Title',
      'field.dateStart': 'Start date',
      'field.dateEnd': 'End date',
      'field.city': 'City',
      'field.country': 'Country',
      'field.format': 'Format',
      'field.language': 'Language',
      'field.site': 'Website',
      'field.reg': 'Registration',
      'field.stream': 'Stream',
      'field.rec': 'Recording',
      'field.program': 'Program',
      'field.notes': 'Notes',
      'field.rating': 'Rating',
      'field.status': 'Status',
      'field.tags': 'Tags (comma separated)',
      'field.attendance': 'Attendance',
      'field.descRu': 'Short description (RU)',
      'field.authors': 'Authors',
      'field.journal': 'Journal',
      'field.year': 'Year',
      'field.doi': 'DOI',
      'field.abstract': 'Abstract',
      'field.sponsor': 'Sponsor',
      'field.phase': 'Phase',
      'field.nct': 'NCT',
      'field.studyStatus': 'Study status',
      'field.dateCompletion': 'Completion date',

      'format.online': 'Online',
      'format.offline': 'Offline',
      'format.hybrid': 'Hybrid',

      'attendance.not_visited': 'Not attended',
      'attendance.visited': 'Attended',
      'attendance.online': 'Online',
      'attendance.all': 'All attendance',

      'action.brief': 'Brief',
      'action.details': 'Details',
      'action.edit': 'Edit',
      'action.calendar': 'Add to calendar',
      'action.ics': '📅 Download .ics',
      'action.google': 'Google Calendar',
      'action.addMyCalendar': '➕ Add to my calendar',
      'action.inMyCalendar': '✓ In my calendar',

      'modal.addTitle': 'New entry',
      'modal.editTitle': 'Edit entry',

      'filter.allFormats': 'All formats',
      'filter.allTags': 'All tags',
      'filter.sortDate': 'By date',
      'filter.sortRating': 'By rating',
      'filter.sortTitle': 'By title',

      'cal.onlyMine': 'Only mine',
      'cal.prev': '‹',
      'cal.next': '›',
      'cal.today': 'Today',

      'sync.title': 'Sync (GitHub Gist)',
      'sync.token': 'GitHub token',
      'sync.tokenHint': 'Gist needs the "gist" scope. The "Update data" button needs "repo" or "actions:write".',
      'sync.gistId': 'Gist ID',
      'sync.owner': 'Owner (repository)',
      'sync.repo': 'Repo (name)',
      'sync.push': 'Push ↑',
      'sync.pull': 'Pull ↓',
      'sync.auto': 'Auto-sync',

      'toast.saved': 'Saved',
      'toast.deleted': 'Deleted',
      'toast.imported': 'Data updated',
      'toast.syncPush': 'Pushed to Gist',
      'toast.syncPull': 'Pulled from Gist',
      'toast.syncErr': 'Sync error',
      'toast.updateStart': 'Update started…',
      'toast.updateProgress': 'Building data…',
      'toast.updateDone': 'Data updated, reloading…',
      'toast.updateFail': 'Failed to update data',
      'toast.updateNeedCfg': 'Set owner, repo and token in sync settings',
      'toast.updateTimeout': 'Update did not finish in time'
    }
  };

  var MONTHS = {
    ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };
  var WEEKDAYS = {
    ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
    en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  };

  var lang = localStorage.getItem('ct_lang') || 'ru';

  function t(key) {
    var d = DICT[lang] || DICT.en;
    if (d[key] != null) return d[key];
    if (DICT.en[key] != null) return DICT.en[key];
    return key;
  }
  function getLang() { return lang; }
  function months() { return MONTHS[lang] || MONTHS.en; }
  function weekdays() { return WEEKDAYS[lang] || WEEKDAYS.en; }
  function setLang(l) {
    lang = (l === 'en') ? 'en' : 'ru';
    localStorage.setItem('ct_lang', lang);
    try { document.documentElement.lang = lang; } catch (e) {}
    window.dispatchEvent(new CustomEvent('i18n:change', { detail: lang }));
  }
  function toggle() { setLang(lang === 'ru' ? 'en' : 'ru'); }

  window.I18N = { t: t, getLang: getLang, setLang: setLang, toggle: toggle, months: months, weekdays: weekdays, DICT: DICT };
})();
