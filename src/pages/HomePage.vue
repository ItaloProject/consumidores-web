<template>
  <q-page class="portal-dashboard">
    <div class="portal-dashboard__mesh" aria-hidden="true" />

    <div class="portal-dashboard__inner">
      <section class="portal-hero">
        <div class="portal-hero__copy">
          <div class="portal-hero__badge">
            <q-icon name="hub" size="15px" />
            Ambiente unificado
          </div>
          <h1 class="portal-hero__title">{{ PORTAL_NAME }}</h1>
          <p class="portal-hero__subtitle">
            Acesse, preencha e exporte todos os formulários operacionais da
            {{ PORTAL_TAGLINE }} em um único portal organizado, moderno e pronto para uso em campo.
          </p>

          <div class="portal-hero__actions">
            <q-btn
              unelevated
              color="primary"
              icon="play_arrow"
              label="Começar agora"
              no-caps
              class="portal-hero__cta"
              @click="scrollToForms"
            />
            <q-btn
              outline
              color="primary"
              icon="history"
              label="Ver histórico"
              no-caps
              @click="$router.push('/historico')"
            />
          </div>
        </div>

        <div class="portal-hero__panel">
          <div class="portal-hero__panel-glow" aria-hidden="true" />
          <div class="portal-hero__metrics">
            <div v-for="metric in heroMetrics" :key="metric.label" class="portal-metric">
              <div class="portal-metric__icon">
                <q-icon :name="metric.icon" size="20px" />
              </div>
              <div>
                <div class="portal-metric__value">{{ metric.value }}</div>
                <div class="portal-metric__label">{{ metric.label }}</div>
              </div>
            </div>
          </div>

          <div class="portal-hero__features">
            <div v-for="feature in heroFeatures" :key="feature" class="portal-feature-pill">
              <q-icon name="check_circle" size="16px" />
              {{ feature }}
            </div>
          </div>
        </div>
      </section>

      <section ref="formsSectionRef" class="portal-section">
        <div class="portal-section__header">
          <div>
            <div class="portal-section__eyebrow">Catálogo</div>
            <h2 class="portal-section__title">Formulários disponíveis</h2>
            <p class="portal-section__description">
              Organizados por tipo de operação para facilitar o acesso da equipe em obra.
            </p>
          </div>
          <div class="portal-section__count">{{ formCount }} ativos</div>
        </div>

        <div
          v-for="group in formGroups"
          :key="group.id"
          class="portal-category"
        >
          <div class="portal-category__head">
            <div>
              <h3 class="portal-category__title">{{ group.label }}</h3>
              <p class="portal-category__description">{{ group.description }}</p>
            </div>
            <span class="portal-category__badge">{{ group.items.length }}</span>
          </div>

          <div class="portal-form-grid">
            <article
              v-for="(item, index) in group.items"
              :key="item.route"
              class="portal-form-card"
              :style="{ animationDelay: `${index * 0.06}s` }"
              tabindex="0"
              role="button"
              @click="goTo(item.route!)"
              @keyup.enter="goTo(item.route!)"
            >
              <div class="portal-form-card__top">
                <div class="portal-form-card__icon">
                  <q-icon :name="item.icon" size="24px" />
                </div>
                <div class="portal-form-card__tags">
                  <span
                    v-for="tag in item.exports ?? []"
                    :key="tag"
                    class="portal-form-card__tag"
                  >
                    {{ tag.toUpperCase() }}
                  </span>
                </div>
              </div>

              <div class="portal-form-card__body">
                <h4 class="portal-form-card__title">{{ item.title }}</h4>
                <p v-if="item.caption" class="portal-form-card__caption">{{ item.caption }}</p>
              </div>

              <div class="portal-form-card__footer">
                <span>Abrir formulário</span>
                <q-icon name="arrow_forward" size="18px" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="portal-section portal-section--compact">
        <div class="portal-section__header">
          <div>
            <div class="portal-section__eyebrow">Fluxo</div>
            <h2 class="portal-section__title">Como funciona</h2>
          </div>
        </div>

        <div class="portal-steps">
          <div v-for="(step, index) in workflowSteps" :key="step.title" class="portal-step">
            <div class="portal-step__index">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="portal-step__icon">
              <q-icon :name="step.icon" size="22px" />
            </div>
            <h3 class="portal-step__title">{{ step.title }}</h3>
            <p class="portal-step__text">{{ step.text }}</p>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  getNavGroups,
  getPortalFormItems,
  PORTAL_NAME,
  PORTAL_TAGLINE,
} from 'src/config/navigation';

const router = useRouter();
const formsSectionRef = ref<HTMLElement | null>(null);

const formCount = getPortalFormItems().length;

const formGroups = computed(() =>
  getNavGroups().filter(
    (group) =>
      group.id !== 'overview' &&
      group.id !== 'integracao' &&
      group.items.some((item) => item.route && item.route !== '/'),
  ),
);

const heroMetrics = [
  { icon: 'description', value: String(formCount), label: 'Formulários ativos' },
  { icon: 'table_chart', value: 'Excel', label: 'Layout original preservado' },
  { icon: 'picture_as_pdf', value: 'PDF', label: 'Relatórios prontos para envio' },
];

const heroFeatures = [
  'Responsivo para tablets e celulares',
  'Exportação padronizada',
  'Histórico de preenchimentos',
];

const workflowSteps = [
  {
    icon: 'touch_app',
    title: 'Escolha o formulário',
    text: 'Selecione o módulo correspondente à operação em campo.',
  },
  {
    icon: 'edit_note',
    title: 'Preencha os dados',
    text: 'Informe os campos da obra e registre as informações operacionais.',
  },
  {
    icon: 'ios_share',
    title: 'Exporte e envie',
    text: 'Gere Excel ou PDF no padrão exigido e compartilhe com a equipe.',
  },
];

function goTo(route: string) {
  void router.push(route);
}

function scrollToForms() {
  formsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
