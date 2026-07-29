export interface NavItem {
  title: string;
  caption?: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  locked?: boolean;
  category: NavCategory;
  exports?: Array<'excel' | 'pdf'>;
}

export type NavCategory = 'overview' | 'operacional' | 'evidencias' | 'integracao';

export interface NavCategoryGroup {
  id: NavCategory;
  label: string;
  description: string;
}

export const PORTAL_NAME = 'Portal de Formulários';
export const PORTAL_TAGLINE = 'CGB Engenharia';
export const APP_NAME = PORTAL_NAME;

/** URL do projeto externo — atualizar quando o link for definido. */
export const EXTERNAL_PROJECT_URL = 'https://eme-app.vercel.app/';

export const navCategories: NavCategoryGroup[] = [
  {
    id: 'overview',
    label: 'Visão geral',
    description: 'Painel e acesso rápido aos formulários',
  },
  {
    id: 'operacional',
    label: 'Operacional',
    description: 'Relações, cadastros e desligamentos em obra',
  },
  {
    id: 'evidencias',
    label: 'Evidências',
    description: 'Relatórios fotográficos e reparos',
  },
  {
    id: 'integracao',
    label: 'Integrações',
    description: 'Projetos externos conectados',
  },
];

export function isExternalNavItem(item: NavItem): boolean {
  return item.externalUrl !== undefined;
}

export function getNavItemKey(item: NavItem): string {
  return item.route ?? item.externalUrl ?? item.title;
}

export const navItems: NavItem[] = [
  {
    title: 'Início',
    caption: 'Dashboard do portal',
    icon: 'space_dashboard',
    route: '/',
    category: 'overview',
  },
  {
    title: 'CONSUMIDORES',
    caption: 'Relação na obra',
    icon: 'groups',
    route: '/consumidores',
    category: 'operacional',
    exports: ['excel', 'pdf'],
  },
  {
    title: 'DESLIGAMENTO',
    caption: 'Relação de desligamento',
    icon: 'power_off',
    route: '/desligamento',
    category: 'operacional',
    exports: ['excel', 'pdf'],
  },
  {
    title: 'ARRASTO',
    caption: 'Formulário de arrasto',
    icon: 'swap_horiz',
    route: '/arrasto',
    category: 'operacional',
    exports: ['excel', 'pdf'],
  },
  {
    title: 'CADASTRO',
    caption: 'Solicitação de serviço',
    icon: 'assignment_ind',
    route: '/cadastro',
    category: 'operacional',
    exports: ['excel'],
  },
  {
    title: 'PODA',
    caption: 'Relatório de evidências',
    icon: 'forest',
    route: '/poda',
    category: 'evidencias',
    exports: ['excel', 'pdf'],
  },
  {
    title: 'CALÇADA',
    caption: 'Reparo de calçadas',
    icon: 'dashboard',
    route: '/calcada',
    category: 'evidencias',
    exports: ['excel', 'pdf'],
  },
  {
    title: 'EMERGENCIAL',
    caption: 'Acessar outro projeto',
    icon: 'open_in_new',
    externalUrl: EXTERNAL_PROJECT_URL,
    locked: true,
    category: 'integracao',
  },
];

export function getNavGroups(): Array<NavCategoryGroup & { items: NavItem[] }> {
  return navCategories
    .map((category) => ({
      ...category,
      items: navItems.filter((item) => item.category === category.id),
    }))
    .filter((group) => group.items.length > 0);
}

export function getPortalFormItems(): NavItem[] {
  return navItems.filter(
    (item) => item.route && item.route !== '/' && !isExternalNavItem(item),
  );
}

export function getPortalFormItemsByCategory(category: NavCategory): NavItem[] {
  return getPortalFormItems().filter((item) => item.category === category);
}
