<template>
  <q-layout view="lHh Lpr lFf" class="portal-layout">
    <q-header class="portal-header">
      <q-toolbar class="portal-toolbar">
        <q-btn
          ref="menuBtnRef"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="portal-menu-btn"
          @click.stop="leftDrawerOpen = !leftDrawerOpen"
        />

        <div class="portal-toolbar__context">
          <div class="portal-toolbar__eyebrow">{{ PORTAL_TAGLINE }}</div>
          <q-toolbar-title class="portal-toolbar__title">
            <span class="portal-toolbar__page">{{ pageTitle || PORTAL_NAME }}</span>
          </q-toolbar-title>
        </div>

        <q-space />

        <div class="portal-toolbar__actions">
          <router-link to="/historico" class="portal-toolbar__history">
            <q-icon name="history" size="18px" />
            <span>Histórico</span>
          </router-link>
          <ThemeToggle />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="292"
      :breakpoint="1100"
      no-mini-animation
      class="portal-drawer"
    >
      <div class="portal-drawer__shell">
        <div class="portal-drawer__backdrop" aria-hidden="true" />

        <header class="portal-drawer__brand">
          <div class="portal-drawer__logo">
            <img :src="cgbLogoUrl" alt="CGB Engenharia" />
          </div>
          <div class="portal-drawer__brand-copy">
            <div class="portal-drawer__brand-title">{{ PORTAL_NAME }}</div>
            <div class="portal-drawer__brand-caption">{{ PORTAL_TAGLINE }}</div>
          </div>
        </header>

        <div class="portal-drawer__summary">
          <div class="portal-drawer__summary-item">
            <span class="portal-drawer__summary-value">{{ formCount }}</span>
            <span class="portal-drawer__summary-label">Formulários</span>
          </div>
          <div class="portal-drawer__summary-divider" />
          <div class="portal-drawer__summary-item">
            <span class="portal-drawer__summary-value">24/7</span>
            <span class="portal-drawer__summary-label">Disponível</span>
          </div>
        </div>

        <nav class="portal-drawer__nav">
          <section
            v-for="group in navGroups"
            :key="group.id"
            class="portal-drawer__group"
          >
            <div class="portal-drawer__group-label">{{ group.label }}</div>

            <template v-for="item in group.items" :key="getNavItemKey(item)">
              <div
                v-if="isExternalNavItem(item) && item.locked"
                class="portal-nav-link portal-nav-link--locked"
                aria-disabled="true"
                title="Acesso indisponível"
              >
                <div class="portal-nav-link__icon">
                  <q-icon :name="item.icon" size="18px" />
                </div>
                <div class="portal-nav-link__copy">
                  <span class="portal-nav-link__title">
                    {{ item.title }}
                    <q-icon name="lock" size="13px" />
                  </span>
                  <span v-if="item.caption" class="portal-nav-link__caption">{{ item.caption }}</span>
                </div>
              </div>

              <a
                v-else-if="isExternalNavItem(item)"
                href="#"
                class="portal-nav-link portal-nav-link--external"
                @click.prevent="handleExternalNav(item)"
              >
                <div class="portal-nav-link__icon">
                  <q-icon :name="item.icon" size="18px" />
                </div>
                <div class="portal-nav-link__copy">
                  <span class="portal-nav-link__title">{{ item.title }}</span>
                  <span v-if="item.caption" class="portal-nav-link__caption">{{ item.caption }}</span>
                </div>
                <q-icon name="north_east" size="15px" class="portal-nav-link__arrow" />
              </a>

              <router-link
                v-else
                :to="item.route!"
                class="portal-nav-link"
                :class="{ 'portal-nav-link--active': isNavActive(item.route!) }"
              >
                <div class="portal-nav-link__icon">
                  <q-icon :name="item.icon" size="18px" />
                </div>
                <div class="portal-nav-link__copy">
                  <span class="portal-nav-link__title">{{ item.title }}</span>
                  <span v-if="item.caption" class="portal-nav-link__caption">{{ item.caption }}</span>
                </div>
                <q-icon name="chevron_right" size="18px" class="portal-nav-link__arrow" />
              </router-link>
            </template>
          </section>
        </nav>

        <footer class="portal-drawer__footer">
          <div class="portal-drawer__status">
            <span class="portal-drawer__status-dot" />
            Plataforma operacional ativa
          </div>
          <div class="portal-drawer__footer-meta">Uso interno · {{ currentYear }}</div>
        </footer>
      </div>
    </q-drawer>

    <q-page-container class="portal-page-container">
      <router-view v-slot="{ Component }">
        <transition name="portal-page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import ThemeToggle from 'src/components/ThemeToggle.vue';
import {
  getNavGroups,
  getNavItemKey,
  getPortalFormItems,
  isExternalNavItem,
  PORTAL_NAME,
  PORTAL_TAGLINE,
  type NavItem,
} from 'src/config/navigation';
import { publicAsset } from 'src/utils/assets';

const $q = useQuasar();
const route = useRoute();
const menuBtnRef = ref<{ $el: HTMLElement } | null>(null);
const leftDrawerOpen = ref(false);

const currentYear = new Date().getFullYear();
const cgbLogoUrl = publicAsset('template/cgb-logo.png');
const navGroups = getNavGroups();
const formCount = getPortalFormItems().length;

const pageTitle = computed(() => {
  const metaTitle = route.meta.title;
  return typeof metaTitle === 'string' ? metaTitle : '';
});

function isNavActive(navRoute: string) {
  if (navRoute === '/') return route.path === '/';
  return route.path === navRoute || route.path.startsWith(`${navRoute}/`);
}

function handleExternalNav(item: NavItem) {
  if (item.locked) return;

  const url = item.externalUrl?.trim();
  if (!url) {
    $q.notify({
      type: 'info',
      message: 'Link do projeto externo em breve.',
    });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  closeDrawer();
}

function isClickInsideMenuButton(target: EventTarget | null) {
  if (!(target instanceof Node)) return false;
  return Boolean(menuBtnRef.value?.$el.contains(target));
}

function isClickInsideDrawer(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.q-drawer'));
}

function closeDrawer() {
  if (leftDrawerOpen.value) {
    leftDrawerOpen.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!leftDrawerOpen.value) return;
  if (isClickInsideDrawer(event.target) || isClickInsideMenuButton(event.target)) return;

  closeDrawer();
}

onMounted(() => {
  document.body.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.body.removeEventListener('click', handleDocumentClick);
});

watch(
  () => route.path,
  () => {
    closeDrawer();
  },
);
</script>
