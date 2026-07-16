(() => {
  'use strict';

  const APP_VERSION = Object.freeze({
    number: '1.2.0',
    releasedAt: '2026-07-17',
    scheme: 'a.b.c'
  });

  window.MEAL_PICKER_VERSION = APP_VERSION;
  document.documentElement.dataset.appVersionNumber = APP_VERSION.number;

  const versionMeta = document.querySelector('meta[name="application-version"]');
  if (versionMeta) versionMeta.content = APP_VERSION.number;

  document.querySelectorAll('[data-app-version]').forEach(element => {
    element.textContent = `v${APP_VERSION.number}`;
    element.title = `版本 ${APP_VERSION.number} · 发布于 ${APP_VERSION.releasedAt}`;
  });
})();
