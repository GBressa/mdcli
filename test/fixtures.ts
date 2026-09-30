const editable = { visivel: true, acoes: { editar: true, excluir: true } };
const locked = { visivel: true, acoes: { editar: false, excluir: false } };

export const CHECKING_ACCOUNT = {
  id: 1001,
  nome: 'Nubank',
  tipo: 'CONTA CORRENTE',
  tipoNovo: 100,
  classificacaobp: 'ativo',
  status: true,
  encerrada: false,
  banco: { id: 'nubank', nome: 'Nubank', img: 'nubank2', tipo: ['CONTA CORRENTE'] },
  exibirBP: true,
  apenasTransferencia: false,
  dataUltimoExtrato: '2026-01-10',
  saldoUltimoExtrato: 250.5,
  liquidez: 1,
  saldoInicial: 0,
  moeda: 1,
  dataSaldoInicial: '2025-01-01',
  considerarCarteiraInvestimentos: 1,
  permissoes: editable,
  criptoGcap: 1,
};

export const CREDIT_CARD_ACCOUNT = {
  ...CHECKING_ACCOUNT,
  id: 1002,
  nome: 'Cartão Azul',
  tipo: 'CARTAOCREDITO',
  tipoNovo: 102,
  banco: undefined,
};

export const ACCOUNTS_RESPONSE = {
  meta: {
    tipos: [
      { id: 100, nome: 'Conta Corrente', liquidez: 1, basico: true },
      { id: 102, nome: 'Cartão de Crédito', grupobp: 50 },
      { id: 122, nome: 'Poupança', invest: true, liquidez: 2 },
    ],
    gruposbp: [],
    finalidades: [],
  },
  items: [CHECKING_ACCOUNT, CREDIT_CARD_ACCOUNT],
};

function category(id: number, nome: string, tipo: 'd' | 'r' | 't', extra: Record<string, unknown> = {}) {
  const nomeRel = nome.split('/').at(-1) ?? nome;
  return {
    id,
    nome,
    nomeRel,
    tipo,
    status: true,
    permissoes: editable,
    _ordenacao: nome.toUpperCase(),
    sistema: false,
    ...extra,
  };
}

export const CATEGORIES_RESPONSE = {
  meta: { dfc: [], dre: [] },
  items: [
    category(10, 'Alimentação', 'd'),
    category(11, 'Alimentação/Mercado', 'd', { pai: 10 }),
    category(20, 'Salário', 'r'),
    category(30, 'Transferência', 't', { sistema: true, permissoes: locked }),
    category(40, 'Outros', 'd'),
  ],
};

export const EMPTY_ENTRIES_RESPONSE = { list: [], meta: { total: 0, page: 1, pageSize: 200 } };
