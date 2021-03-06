import { takeEvery, put, call } from '@redux-saga/core/effects';
import { store } from '../configureStore'
import * as api from '@app/services/inkiriApi'
import * as core from './core';

import * as balance from './balance';

// Constantes
const LOAD_ACCOUNTS      = 'accounts/LOAD_ACCOUNTS'
const END_LOAD_ACCOUNTS  = 'accounts/END_LOAD_ACCOUNTS'
const SET_ACCOUNTS       = 'accounts/SET_ACCOUNTS'
const LOAD_BANK_ACCOUNT  = 'accounts/LOAD_BANK_ACCOUNT'
const SET_BANK_ACCOUNT   = 'accounts/SET_BANK_ACCOUNT'
const LOAD_EOS_ACCOUNT   = 'accounts/LOAD_EOS_ACCOUNT'
const SET_EOS_ACCOUNT    = 'accounts/SET_EOS_ACCOUNT'

// Creadores de acciones (se pueden usar desde los compoenentes)
export const loadAccounts    = () =>({ type: LOAD_ACCOUNTS });
export const setAccounts     = (accounts = []) =>({ type: SET_ACCOUNTS, payload: {accounts}});

export const loadBankAccount = (account_name) =>({ type: LOAD_BANK_ACCOUNT, payload: {account_name} });
export const setBankAccount  = (bank_account) =>({ type: SET_BANK_ACCOUNT, payload: {bank_account:bank_account}});

export const loadEosAccount = (account_name) =>({ type: LOAD_EOS_ACCOUNT , payload: {account_name}});
export const setEosAccount  = (eos_account) =>({ type: SET_EOS_ACCOUNT, payload: {eos_account:eos_account}});

//Eventos que requieren del async
function* loadAccountsSaga() {
  try
  {
    const {data} = yield api.listBankAccounts();
    if(data) {
      yield put(setAccounts(data.accounts))
      return;
    }

    yield put({ type: END_LOAD_ACCOUNTS })
  }
  catch(e){
    yield put({ type: END_LOAD_ACCOUNTS })
    // TODO -> throw global error!
  }
}

function* loadBankAccountSaga({ type, payload }){
  const { account_name } = payload
  const data = yield api.getBankAccount(account_name);
  // console.log(' * loadBankAccountSaga:', data)
  if(data) {
    yield put(setBankAccount(data))
    yield put(balance.loadBalance(account_name))
  } 
}
function* loadEOSAccountSaga({ type, payload }){
  const { account_name } = payload
  const {data} = yield api.getAccount(account_name);
  // console.log(' * loadEOSAccountSaga:', data)
  if(data) {
    yield put(setEosAccount(data))
  }
}

function* initLoadAccounts () {
  console.log( ' # core.INIT@accounts-saga ' )
  yield put({type: core.ACTION_START, payload: { loadAccounts: 'Loading accounts'}})
  yield call(loadAccountsSaga)
  yield put({type: core.ACTION_END, payload: 'loadAccounts'})
}

//Se envan las sagas a redux estableciendo que y cuantas veces dispara la funcià¸£à¸“n
store.injectSaga('accounts', [
  // takeEvery(core.INIT_READY_TO_START, initLoadAccounts),
  takeEvery(core.INIT, initLoadAccounts),
  takeEvery(LOAD_ACCOUNTS,     loadAccountsSaga),
  takeEvery(LOAD_BANK_ACCOUNT, loadBankAccountSaga),
  takeEvery(LOAD_EOS_ACCOUNT,  loadEOSAccountSaga),
]);

// Selectores - Conocen el stado y retornan la info que es necesaria
export const accounts     = (state) => state.accounts.accounts || [] ;
export const bank_account = (state) => state.accounts.bank_account ;
export const eos_account  = (state) => state.accounts.eos_account ;
export const isLoading    = (state) => state.accounts.is_loading

// El reducer del modelo
const defaultState = {
    accounts:         [],
    bank_account:     null,
    eos_account:      null,
    is_loading:       false
};

function reducer(state = defaultState, action = {}) {
  switch (action.type) {
    case LOAD_ACCOUNTS: 
      return { ...state
              , is_loading: true}
    case END_LOAD_ACCOUNTS: 
      return { ...state
              , is_loading: false}
    case SET_ACCOUNTS: 
      return  { ...state
                , accounts: action.payload.accounts
                , is_loading: false}
    case SET_BANK_ACCOUNT:
      return  {...state
                , bank_account: action.payload.bank_account}
    case SET_EOS_ACCOUNT:
      return  {...state
                , eos_account: action.payload.eos_account}
    default: return state;
  }
}

store.injectReducer('accounts', reducer)