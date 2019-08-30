import * as globalCfg from '@app/configs/global';
import * as eosHelper from './eosHelper.js';
import * as jwtHelper from './jwtHelper';

export const isAuth = () => {
  return jwtHelper.getTokenIfNotExpired(jwtHelper.BANK_AUTH_TOKEN_KEY)!==null;
}

const valid_http_codes = [200, 201, 202, 203, 204]

/*
* Authenticate user against private bank server.
* 
* @param   {string}   account_name   EOS account name. 12 chars length.
* @param   {string}   private_key   EOS account wif (private key).
* @return  {string}   Bearer Token.
*/
export const auth = (account_name, private_key) =>   new Promise((res,rej)=> {
  
  const token = jwtHelper.getTokenIfNotExpired(jwtHelper.BANK_AUTH_TOKEN_KEY);
  console.log(' ******* BANK PRIV BEARER TOKEN >> ', token);
  if(!token)
  {
    const challenge_endpoint = globalCfg.api.end_point+'/eos/challenge/'+account_name;
    
    fetch(challenge_endpoint, {method: 'GET' })
    .then((response) => {
        if (valid_http_codes.indexOf(parseInt(response.status))<0) {
          console.log(' CHALLENGE ********************************** ERROR#1', response.status)
          const _err = {'error':response.status}
          rej(_err);
          throw new Error(_err);
        }
        else
          return response.json()
      }, (err) => {
        console.log(' CHALLENGE  ********************************** !OK#2', err)
        rej(err.message);
        throw err;
      })
    .then((data) => {
      
      console.log(' bank::auth >> ', JSON.stringify(data));
      const challenge = data.to_sign;

      eosHelper.signString(private_key, challenge).then((signed) => {  
        
        const auth_params = {
          'account_name': account_name
          , 'signature' : signed.data.signed_data
          , 'challenge':  challenge
        };
        
        const auth_endpoint      = globalCfg.api.end_point+'/eos/auth';    
        
        console.log(' AUTH PARAMS:', auth_endpoint, JSON.stringify(auth_params))

        fetch(auth_endpoint, {
          method: 'POST',
          body: JSON.stringify(auth_params),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          }
        })
          .then((response2) => {
            if (!response2.ok) {
              console.log(' ********************************** !OK#3')
              rej(response2.statusText);
              throw new Error(response2.statusText);
            }
            return response2.json()
          }, (err) => {
            console.log(' ********************************** !OK#4')
            rej(err); 
            throw err;
          })
          .then((auth_data) => {
            jwtHelper.setTokenToStorage  (jwtHelper.BANK_AUTH_TOKEN_KEY, JSON.stringify(auth_data));
            // res({data:auth_data});
            // res(buildResponse(auth_data.token));
            res(jwtHelper.buildResponse(auth_data.token));
          }, (ex) => {
            rej(ex);
          });  


      } , (error) => {
        console.log('---- RES:', JSON.stringify(error));
        rej({error:error})
      });
    }, (ex) => {
      console.log(' CHALLENGE  ********************************** !OK#5', JSON.stringify(ex))
      rej({error:ex});
    });
    
  }
  else{
    // res(buildResponse(token));
    res(jwtHelper.buildResponse(token));
  }
})

/*
* Requests functions
*
*/
export const listMyRequests = (account_name, page, limit, request_type) =>   new Promise((res,rej)=> {
  
  console.log(' BANKAPI::LIST MY REQUESTS>> account_name:', account_name
  , '| page: ', page, ' | limit:', limit, ' | request_type: ', request_type );
  const path    = globalCfg.api.end_point + '/requests';
  const method  = 'GET';
  let query     = '?page='+(page|0); 
  query=query+'&limit='+(limit|10);
  if(account_name)
    query=query+'&from='+account_name;
  if(request_type!== undefined)
    query=query+'&requested_type='+request_type;

  jwtHelper.apiCall(path+query, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

export const listRequests = (page, limit, request_type, account_name) =>   new Promise((res,rej)=> {
  
  console.log(' BANKAPI::LIST MY REQUESTS>> account_name:', account_name
  , '| page: ', page, ' | limit:', limit, ' | request_type: ', request_type );
  const path    = globalCfg.api.end_point + '/requests';
  const method  = 'GET';
  let query     = '?page='+(page|0); 
  query=query+'&limit='+(limit|10);
  if(account_name!== undefined)
    query=query+'&from='+account_name;
  if(request_type!== undefined)
    query=query+'&requested_type='+request_type;

  jwtHelper.apiCall(path+query, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

export const createDeposit = (account_name, amount, currency) =>   new Promise((res,rej)=> {
  
  // "from": "inkiritoken1",
  // "requested_type": "type_deposit",
  // "amount": "500",
  // "envelope_id": "500",  

  const path    = globalCfg.api.end_point + '/requests';
  const method  = 'POST';
  const post_params = {
          'account_name':       account_name
          , 'requested_type':   'type_deposit'
          , 'amount':           Number(amount).toFixed(2)
          , 'deposit_currency': currency
        };
  console.log(' inkiriApi::createDeposit >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(path, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::createDeposit >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::createDeposit >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });
});

export const setDepositOk = (request_id, tx_id) =>  updateDeposit(request_id, globalCfg.api.STATE_CONCLUDED , tx_id);

export const updateDeposit = (request_id, state, tx_id) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.end_point + '/requests';
  const method  = 'PATCH';
  const query   = `/${request_id}`;
  const post_params = {
          _id:         request_id
          , state:     state
          , tx_id:     tx_id
        };
  console.log(' inkiriApi::createDeposit >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(path+query, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::createDeposit >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::createDeposit >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });  
})


/*
* Envelope functions -> Requests derivated functions
*
*/
export const envelopeIdFromRequest = (request, user_id, req_id) =>   {
  if(request!==undefined)
    return pad(request.requested_by.userCounterId, 5)+pad(request.requestCounterId, 5);
  return pad(user_id, 5)+pad(req_id, 5);
}

export const nextEnvelopeId = (account_name) =>   new Promise((res,rej)=> {

  var promise1 = nextRequestId(account_name);
  var promise2 = getMyUser(account_name);
  
  Promise.all([promise1, promise2]).then((values) => {
    console.log(' ************ inkiriApi::nextEnvelopeId >> ', JSON.stringify(values));
      let next_id = values[0];
      let user_id = values[1].userCounterId;
      // let envId   = pad(user_id, 5)+pad(next_id, 5);
      let envId   = envelopeIdFromRequest(undefined, user_id, next_id)
      res(envId)
  }, (err)=>{
    console.log(' ************ inkiriApi::nextEnvelopeId ERROR >> ', JSON.stringify(err));
    rej(err);
  });

  
});

function pad(num, size) {
    var s = "00000" + num;
    return s.substr(s.length-size);
}

export const nextRequestId = (account_name) =>   new Promise((res,rej)=> {
  listMyRequests(account_name, 0, 1)
    .then(
      (responseJson) => {
        if(!responseJson || responseJson.length==0)
        {
          res(1)
        }
        else{
          res(responseJson[0].requestCounterId+1)
        }
      },
      (err) => {
        console.log(' ************ inkiriApi::nextRequestId ERROR >> ', JSON.stringify(err));
        rej(err);
      })
});



/*
* User functions
*
*/
export const getMyUser = (account_name) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.end_point + '/users';
  const method  = 'GET';
  let query     = '?page=0&limit=1&account_name='+account_name;
  jwtHelper.apiCall(path+query, method)
    .then((data) => {
        res(data[0])
      }, (ex) => {
        rej(ex);
      });
});

export const createUser = (account_name) =>   new Promise((res,rej)=> {
  
  // "from": "inkiritoken1",
  // "requested_type": "type_deposit",
  // "amount": "500",
  // "envelope_id": "500",  

  const path    = globalCfg.api.end_point + '/users';
  const method  = 'POST';
  const post_params = {
          'account_name':  account_name
          , 'email':       `${account_name}@inkiri.com`
        };
  console.log(' inkiriApi::createUser >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(path, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::createUser >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::createUser >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });
});