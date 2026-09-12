/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_APP_VERSION?: string;
  readonly PUBLIC_GIT_SHA?: string;
  readonly PUBLIC_GIT_BRANCH?: string;
  readonly PUBLIC_WEB3FORMS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
