import moment from 'moment';
import * as globalCfg from '@app/configs/global';

const REQUIRED_PERIOD_DURATION   = 30 ; // 30*24*60*60;    // 30 days in second

export const getChargeInfo = (pap) =>{
  const MONTH_FORMAT     = 'YYYY/MM';
  const price_amount     = globalCfg.currency.toNumber(pap.price) 
  const _next            = moment(pap.begins_at).add((pap.last_charged+1)*REQUIRED_PERIOD_DURATION, 'days');
  const last             = moment(pap.begins_at).add((pap.last_charged-1), 'months').format(MONTH_FORMAT)
  const now              = moment();
  const days_to_charge   = _next.diff(now, 'days'); 
  const _canChargeNext   = canChargeNext(pap);
  
  const ret = {
    last_charged:       pap.last_charged>0?(last):'-'
    , total_charged:    globalCfg.currency.toCurrencyString( pap.last_charged * price_amount)
    , total_amount:     globalCfg.currency.toCurrencyString( pap.periods * price_amount)
    , next:             (_canChargeNext)?_next:null
    , days_to_charge:   days_to_charge 
  }
  console.log(pap, ret)
  return ret;
}



export const getServicePeriods = (dict) =>{
  return getServicePeriodsEx(dict.begins_at, dict.expires_at);
}

export const getServicePeriodsEx = (begins_at, expires_at) =>{
  let my_begins_at  = getMoment(begins_at);
  let my_expires_at = getMoment(expires_at);
  return my_expires_at.diff(my_begins_at, 'months')+1;
}

export const getServiceBegin = (begins_at) =>{
  let my_begins_at = getMoment(begins_at);
  return my_begins_at.startOf('month');
}

export const getServiceBeginTimestamp = (begins_at) =>{
  return getServiceBegin(begins_at).unix();
}

const getMoment = (value) => {
  let moment_value = value;
  if(typeof value === 'number' || typeof value === 'string')
    moment_value = moment(value);
  return moment_value;
}

const canChargeNext = (pap) =>{
  return pap.last_charged<pap.periods;
}
