<template>
  <div class="user-general-page">
    <header>
      <h1>{{ $t('user.settings.general.general') }}</h1>
      <p>{{ $t('user.settings.surface.account_description') }}</p>
    </header>

    <SettingsSection
      :title="$t('user.settings.surface.identity_title')"
      :description="$t('user.settings.surface.identity_description')"
    >
      <div class="identity-card">
        <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.login" />
        <span v-else class="identity-fallback">{{ user.login.slice(0, 2).toUpperCase() }}</span>
        <dl>
          <div>
            <dt>{{ $t('username') }}</dt>
            <dd>{{ user.login }}</dd>
          </div>
          <div>
            <dt>{{ $t('user.settings.surface.email') }}</dt>
            <dd>{{ user.email || $t('user.settings.surface.not_provided') }}</dd>
          </div>
          <div>
            <dt>{{ $t('user.settings.surface.forge_id') }}</dt>
            <dd>{{ user.forge_id }}</dd>
          </div>
        </dl>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="$t('user.settings.surface.preferences_title')"
      :description="$t('user.settings.surface.preferences_description')"
    >
      <SettingsActionRow
        :title="$t('user.settings.general.language')"
        :description="$t('user.settings.surface.language_description')"
      >
        <SelectField v-model="selectedLocale" class="min-w-44" :options="localeOptions" />
      </SettingsActionRow>

      <SettingsActionRow
        :title="$t('user.settings.general.theme.theme')"
        :description="$t('user.settings.surface.theme_description')"
      >
        <SelectField
          v-model="storeTheme"
          class="min-w-36"
          :options="[
            { value: 'auto', text: $t('user.settings.general.theme.auto') },
            { value: 'light', text: $t('user.settings.general.theme.light') },
            { value: 'dark', text: $t('user.settings.general.theme.dark') },
          ]"
        />
      </SettingsActionRow>

      <SettingsActionRow
        :title="$t('user.settings.general.pipeline_logs.pipeline_logs')"
        :description="$t('user.settings.general.pipeline_logs.collapse_groups.desc')"
      >
        <Checkbox
          v-model="collapseLogGroupsByDefault"
          :label="$t('user.settings.general.pipeline_logs.collapse_groups.collapse')"
        />
      </SettingsActionRow>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { SUPPORTED_LOCALES } from 'virtual:vue-i18n-supported-locales';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Checkbox from '~/components/form/Checkbox.vue';
import SelectField from '~/components/form/SelectField.vue';
import SettingsActionRow from '~/components/settings/SettingsActionRow.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import useAuthentication from '~/compositions/useAuthentication';
import { setI18nLanguage } from '~/compositions/useI18n';
import { useTheme } from '~/compositions/useTheme';
import useUserConfig from '~/compositions/useUserConfig';
import { useWPTitle } from '~/compositions/useWPTitle';

const { locale, t } = useI18n();
const { storeTheme } = useTheme();
const { userConfig, setUserConfig } = useUserConfig();
const { user } = useAuthentication();

if (!user) {
  throw new Error('Unexpected: User should be authenticated');
}

const collapseLogGroupsByDefault = computed<boolean>({
  get() {
    return userConfig.value.collapseLogGroupsByDefault;
  },
  set(value) {
    setUserConfig('collapseLogGroupsByDefault', value);
  },
});

const localeOptions = computed(() =>
  SUPPORTED_LOCALES.map((supportedLocale) => ({
    value: supportedLocale,
    text: new Intl.DisplayNames(supportedLocale, { type: 'language' }).of(supportedLocale) || supportedLocale,
  })),
);

const storedLocale = useStorage('woodpecker:locale', locale.value);
const selectedLocale = computed<string>({
  async set(_selectedLocale) {
    await setI18nLanguage(_selectedLocale);
    storedLocale.value = _selectedLocale;
  },
  get() {
    return storedLocale.value;
  },
});

useWPTitle(computed(() => [t('user.settings.general.general'), t('user.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.user-general-page {
  @apply flex min-w-0 flex-col gap-4;
}

.user-general-page > header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.user-general-page > header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.identity-card {
  @apply flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center;
}

.identity-card img,
.identity-fallback {
  @apply bg-wp-control-neutral-100 h-16 w-16 shrink-0 rounded-2xl object-cover;
}

.identity-fallback {
  @apply text-wp-primary-100 flex items-center justify-center text-lg font-bold;
}

.identity-card dl {
  @apply grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3;
}

.identity-card dt {
  @apply text-wp-text-alt-100 text-[11px] font-semibold tracking-wide uppercase;
}

.identity-card dd {
  @apply text-wp-text-100 mt-1 min-w-0 truncate text-sm font-semibold;
}
</style>
