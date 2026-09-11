import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { getProtectedDefault } from '../utils/protected-defaults';

export type ProtocolarOpcao = 'SIM' | 'NAO' | '';

export interface DesligamentoObra {
  nota: string;
  contrato: string;
  pep: string;
  fornecedor: string;
  descricaoObra: string;
  cidade: string;
  data: string;
  siMes: string;
  protocolar: ProtocolarOpcao;
}

export interface DesligamentoSI {
  inicioDesligamento: string;
  fimDesligamento: string;
  numeroOperacional: string;
  numeroBarramento: string;
  valorUnitarioSemProtocolo: string;
  valorUnitarioComProtocolo: string;
}

export interface DesligamentoConsumidor {
  id: number;
  contaContrato: string;
  numeroMedidor: string;
  nomeCompleto: string;
  protocolar: ProtocolarOpcao;
}

const STORAGE_KEY = 'formularios-web:desligamento';

interface DesligamentoPersistedState {
  obra: DesligamentoObra;
  solicitacao: DesligamentoSI;
  consumidores: DesligamentoConsumidor[];
  evidencias: (string | null)[];
}

function createDefaultObra(): DesligamentoObra {
  return {
    nota: '',
    contrato: '4600026661',
    pep: '',
    fornecedor: 'CGB ENERGIA',
    descricaoObra: '',
    cidade: '',
    data: '',
    siMes: '',
    protocolar: '',
  };
}

function createDefaultSolicitacao(): DesligamentoSI {
  return {
    inicioDesligamento: '',
    fimDesligamento: '',
    numeroOperacional: '',
    numeroBarramento: '',
    valorUnitarioSemProtocolo: getProtectedDefault(
      'desligamento',
      'valorUnitarioSemProtocolo',
      '7,04',
    ),
    valorUnitarioComProtocolo: getProtectedDefault(
      'desligamento',
      'valorUnitarioComProtocolo',
      '8,24',
    ),
  };
}

function mergeSolicitacao(parsed?: Partial<DesligamentoSI>): DesligamentoSI {
  const defaults = createDefaultSolicitacao();
  if (!parsed) return defaults;

  return {
    ...defaults,
    ...parsed,
    valorUnitarioSemProtocolo: defaults.valorUnitarioSemProtocolo,
    valorUnitarioComProtocolo: defaults.valorUnitarioComProtocolo,
  };
}

function createEmptyConsumidor(id: number): DesligamentoConsumidor {
  return {
    id,
    contaContrato: '',
    numeroMedidor: '',
    nomeCompleto: '',
    protocolar: '',
  };
}

function loadPersistedState(): DesligamentoPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DesligamentoPersistedState>;
    if (!parsed || typeof parsed !== 'object') return null;

    const consumidores = Array.isArray(parsed.consumidores) && parsed.consumidores.length > 0
      ? parsed.consumidores.map((c, i) => ({
          id: i + 1,
          contaContrato: c?.contaContrato ?? '',
          numeroMedidor: c?.numeroMedidor ?? '',
          nomeCompleto: c?.nomeCompleto ?? '',
          protocolar: c?.protocolar ?? '',
        }))
      : Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1));

    return {
      obra: { ...createDefaultObra(), ...parsed.obra },
      solicitacao: mergeSolicitacao(parsed.solicitacao),
      consumidores,
      evidencias: Array.isArray(parsed.evidencias)
        ? Array.from({ length: 8 }, (_, index) => parsed.evidencias?.[index] ?? null)
        : Array(8).fill(null),
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: DesligamentoPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useDesligamentoStore = defineStore('desligamento', () => {
  const persisted = loadPersistedState();

  const obra = ref<DesligamentoObra>(persisted?.obra ?? createDefaultObra());
  const solicitacao = ref<DesligamentoSI>(persisted?.solicitacao ?? createDefaultSolicitacao());
  const consumidores = ref<DesligamentoConsumidor[]>(
    persisted?.consumidores ?? Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1)),
  );
  const evidencias = ref<(string | null)[]>(persisted?.evidencias ?? Array(8).fill(null));

  watch(
    [obra, solicitacao, consumidores, evidencias],
    () => {
      savePersistedState({
        obra: obra.value,
        solicitacao: solicitacao.value,
        consumidores: consumidores.value,
        evidencias: evidencias.value,
      });
    },
    { deep: true },
  );

  function addConsumidor() {
    consumidores.value.push(createEmptyConsumidor(consumidores.value.length + 1));
  }

  function removeConsumidor(index: number) {
    if (consumidores.value.length <= 1) return;
    consumidores.value.splice(index, 1);
    consumidores.value.forEach((consumidor, idx) => {
      consumidor.id = idx + 1;
    });
  }

  function resetForm() {
    obra.value = createDefaultObra();
    solicitacao.value = createDefaultSolicitacao();
    consumidores.value = Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1));
    evidencias.value = Array(8).fill(null);
    clearPersistedState();
  }

  return {
    obra,
    solicitacao,
    consumidores,
    evidencias,
    addConsumidor,
    removeConsumidor,
    resetForm,
  };
});
