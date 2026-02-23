'use client';

import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

const vercelEnv = process.env.VERCEL_ENV || 'development';
const datadogEnv = vercelEnv === 'production' ? 'production' :
  vercelEnv === 'preview' ? 'preview' :
    'development';

export function initDatadogRUM() {
  if (typeof window === 'undefined' || window.__DATADOG_RUM_INITIALIZED__) return;
  window.__DATADOG_RUM_INITIALIZED__ = true;

  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_RUM_APP_ID!,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'beauty-social-commerce-frontend',
    env: datadogEnv,
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    allowedTracingUrls: [
      /^https:\/\/your-vercel-app-domain\.com/,
      /^https:\/\/.*\.vercel\.app/,
      'localhost',
      /api\.your-domain\.com/,
    ],
  });

  datadogRum.setGlobalContext({
    vercel_env: vercelEnv,
    vercel_url: process.env.VERCEL_URL || 'n/a',
    vercel_branch: process.env.VERCEL_GIT_COMMIT_REF || 'n/a',
  });

  datadogLogs.init({
    clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'beauty-social-commerce-frontend',
    env: datadogEnv,
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}
