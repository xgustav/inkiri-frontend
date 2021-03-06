import * as globalCfg from '@app/configs/global';
import * as eosHelper from './eos-helper.js';
import * as jwtHelper from './jwt-helper';

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
  // console.log(' ******* BANK PRIV BEARER TOKEN >> ', token);
  if(!token)
  {
    const challenge_endpoint = globalCfg.api.endpoint+'/eos/challenge/'+account_name;
    
    fetch(challenge_endpoint, {method: 'GET'})
    .then((response) => {
        if (valid_http_codes.indexOf(parseInt(response.status))<0) {
          console.log(' CHALLENGE ********************************** ERROR#1', response.status, ' | response:', JSON.stringify(response))
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
      
      // console.log(' bank::auth >> ', JSON.stringify(data));
      const challenge = data.to_sign;

      eosHelper.signString(private_key, challenge).then((signed) => {  
        
        const auth_params = {
          'account_name': account_name
          , 'signature' : signed.data.signed_data
          , 'challenge':  challenge
        };
        
        const auth_endpoint      = globalCfg.api.endpoint+'/eos/auth';    
        
        // console.log(' AUTH PARAMS:', auth_endpoint, JSON.stringify(auth_params))

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
              // console.log(' ********************************** !OK#3')
              rej(response2.statusText);
              throw new Error(response2.statusText);
            }
            return response2.json()
          }, (err) => {
            // console.log(' ********************************** !OK#4')
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
        console.log('---- ERROR:', JSON.stringify(error));
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


export const setPushInfo = (account_name, token) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + `/notifications/${account_name}/${token}`;
  const method  = 'POST';
  console.log('INKIRIAPI::setPushInfo:', path)
  jwtHelper.apiCall(path, method)
    .then((data) => {
        console.log(' inkiriApi::setPushInfo >> RESPONSE', JSON.stringify(data))
        console.log('INKIRIAPI::setPushInfo: OK', data )
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::setPushInfo >> ERROR ', JSON.stringify(ex))
        console.log('INKIRIAPI::setPushInfo: ERROR', ex)
        res({error:ex});
      });
});


export const createDeposit = (account_name, amount, currency) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/requests';
  const method  = 'POST';
  const post_params = {
          // 'account_name':       account_name
          'from':               account_name
          , 'requested_type':   globalCfg.api.TYPE_DEPOSIT
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

export const setDepositOk   = (sender, request_id)              => updateRequest(sender, request_id, globalCfg.api.STATE_PROCESSING, undefined , undefined, false, REQUEST_ADMIN);
export const rejectService  = (sender, c2c_player, request_id)  => updateRequest(sender, request_id, globalCfg.api.STATE_REJECTED, undefined, undefined, true, c2c_player);
export const cancelService  = (sender, c2c_player, request_id)  => updateRequest(sender, request_id, globalCfg.api.STATE_CANCELED, undefined, undefined, true, c2c_player);
export const acceptServiceRequest = (sender, request_id, c2c_player, tx_id) => updateRequest(sender, request_id, globalCfg.api.STATE_ACCEPTED, tx_id, undefined, true, c2c_player);
export const failedWithdraw = (sender, request_id)              => updateRequest(sender, request_id, globalCfg.api.STATE_CANCELED, undefined, undefined, false);
export const failedProviderPay = (sender, request_id)           => updateRequest(sender, request_id, globalCfg.api.STATE_CANCELED, undefined, undefined, false);

export const updatePaymentRequest = (sender, request_id, c2c_player, tx_id) => updateRequest(sender, request_id, globalCfg.api.STATE_ACCEPTED, undefined, undefined, true, c2c_player);
export const rejectPaymentRequest = (sender, request_id, c2c_player)        => updateRequest(sender, request_id, globalCfg.api.STATE_REJECTED, undefined, undefined, true, c2c_player);

export const REQUEST_SENDER   = 'request_sender';
export const REQUEST_RECEIVER = 'request_receiver';
export const REQUEST_ADMIN    = 'request_admin';

export const updateRequest = (sender, request_id, state, tx_id, refund_tx_id, is_C2C, c2c_player, cancel_reason) => new Promise((res,rej)=> {
 
  let module  = 'requests';
  if(is_C2C && c2c_player)
  {
    // 'requests_c2c'
    const endpoint_options = {
        [REQUEST_SENDER]:     'requests_c2c_by_sender'
        , [REQUEST_RECEIVER]: 'requests_c2c_by_receiver'
        , [REQUEST_ADMIN]:    'requests_c2c_by_admin'};
    module = endpoint_options[c2c_player]    
  }
  else{
    if(!is_C2C && c2c_player==REQUEST_ADMIN){
      module = 'requests_admin';    
    }
  }

  const path    = globalCfg.api.endpoint + `/${module}/${request_id}`;
  const method  = 'PATCH';
  let post_params = {
    _id:      request_id,
    sender:   sender
  };
  console.log(' bank_api.updateRequest -> ', request_id, ' | STATE:', state);
  if(state)
    post_params['state'] = state;
  if(tx_id)
    post_params['tx_id'] = tx_id;
  if(refund_tx_id)
    post_params['refund_tx_id'] = refund_tx_id;
  if(cancel_reason)
    post_params['cancel_reason'] = cancel_reason;

  console.log(' inkiriApi::updateRequest >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(path, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::updateRequest >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::updateRequest >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });  
})

/*
* User functions
*
*/

export const listProfiles = (page, limit, filter) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/users';
  const method  = 'GET';
  let qs = {
      page       : (page||0)
      , limit    : (limit||10),
    };
  if(filter)
    qs = { ...qs , ...filter};

  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, qs)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});


export const getProfile = (account_name) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + `/users_by_account/${account_name}`;
  const method  = 'GET';
  jwtHelper.apiCall(path, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

// export const createUser = (account_name, account_type) =>   new Promise((res,rej)=> {
  
//   const path    = globalCfg.api.endpoint + '/users';
//   const method  = 'POST';
//   const post_params = {
//           'account_name':  account_name
//           , 'account_type': account_type
//           , 'email':       `${account_name}@inkiri.com`
//         };
//   jwtHelper.apiCall(path, method, post_params)
//     .then((data) => {
//         // console.log(' inkiriApi::createUser >> RESPONSE', JSON.stringify(data))
//         res(data)
//       }, (ex) => {
//         // console.log(' inkiriApi::createUser >> ERROR ', JSON.stringify(ex))
//         rej(ex);
//       });
// });

export const createOrUpdateUser = (id, account_type, account_name, first_name, last_name, email, legal_id, birthday, phone, address, business_name, alias, bank_accounts) =>   new Promise((res,rej)=> {  

  const domain              = globalCfg.api.endpoint + '/users';
  const path                = id?`/${id}`:'';
  const method              = id?'PATCH':'POST';
  
  let post_params = {
          account_type:    globalCfg.bank.getAccountType(account_type)
          , account_name:  account_name
          , first_name:    first_name
          , last_name:     last_name
          , email:         email
          , legal_id:      legal_id
          , birthday:    birthday
          , phone:         phone
          , address:       address
          , business_name: business_name
          , alias:         alias
        };
  if(bank_accounts)
    post_params.bank_accounts = bank_accounts;

  console.log(' inkiriApi::createUser >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(domain+path, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::createUser >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::createUser >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });
});

export const updateUserBankAccounts = (id,  bank_accounts) =>   new Promise((res,rej)=> {  

  const path     = globalCfg.api.endpoint + `/users/${id}`;
  const method   = 'PATCH';
  
  let post_params = {
    bank_accounts : bank_accounts
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

/*
* Services section
*/
export const getServices = (page, limit, filter) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/services';
  const method  = 'GET';
  
  let qs = {
      page         : (page||0)
      , limit      : (limit||10)
    };
  if(filter)
    qs = { ...qs , ...filter};

  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, qs)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});


export const getServicesStates = () =>   new Promise((res,rej)=> {  
  const path    = globalCfg.api.endpoint + '/services_states';
  const method  = 'GET';
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method)
        .then((data) => {
            console.log(' inkiriApi::getServicesStates >> RESPONSE', JSON.stringify(data))
            res(data)
          }, (ex) => {
            console.log(' inkiriApi::getServicesStates >> ERROR ', JSON.stringify(ex))
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });
});

export const createOrUpdateService = (serviceId, account_name, title, description, amount, state) =>   new Promise((res,rej)=> {  

  const postfix = serviceId ? `/services/${serviceId}` : '/services';
  const path    = globalCfg.api.endpoint + postfix;
  const method  = serviceId?'PATCH':'POST';
  const post_params = {
          account_name  : account_name
          , title       : title
          , description : description
          , amount      : amount
          , state       : state
        };
  console.log(' inkiriApi::createOrUpdateService >> ABOUT TO POST', JSON.stringify(post_params));
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, post_params)
        .then((data) => {
            console.log(' inkiriApi::createOrUpdateService >> RESPONSE', JSON.stringify(data))
            res(data)
          }, (ex) => {
            console.log(' inkiriApi::createOrUpdateService >> ERROR ', JSON.stringify(ex))
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});



/*
* Teams section
*/
export const getTeam = (account_name) =>   new Promise((res,rej)=> {
  
  // console.log(' BANKAPI::LIST MY REQUESTS>> account_name:', account_name, '| page: ', page, ' | limit:', limit, ' | request_type: ', request_type );
  const path    = globalCfg.api.endpoint + `/teams_by_account/${account_name}`;
  const method  = 'GET';
  
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});

// export const getJobPositions = () =>   new Promise((res,rej)=> {  
//   const path    = globalCfg.api.endpoint + '/teams_positions';
//   const method  = 'GET';
//   auth()
//     .then((token) => {
//       jwtHelper.apiCall(path, method)
//         .then((data) => {
//             console.log(' inkiriApi::getJobPositions >> RESPONSE', JSON.stringify(data))
//             res(data)
//           }, (ex) => {
//             console.log(' inkiriApi::getJobPositions >> ERROR ', JSON.stringify(ex))
//             rej(ex);
//           });
//     }, (ex) => {
//         rej(ex);
//     });
// });

export const createOrUpdateTeam = (teamId, account_name, members) =>   new Promise((res,rej)=> {  

  const postfix = teamId ? `/teams/${teamId}` : '/teams';
  const path    = globalCfg.api.endpoint + postfix;
  const method  = teamId?'PATCH':'POST';
  const post_params = {
          account_name: account_name
          , members: members
        };
  console.log(' inkiriApi::createOrUpdateTeam >> ABOUT TO POST', JSON.stringify(post_params));
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, post_params)
        .then((data) => {
            console.log(' inkiriApi::createOrUpdateTeam >> RESPONSE', JSON.stringify(data))
            res(data)
          }, (ex) => {
            console.log(' inkiriApi::createOrUpdateTeam >> ERROR ', JSON.stringify(ex))
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});

/*
* Providers section
*/
export const listProviders = (name, cnpj, page, limit) =>   new Promise((res,rej)=> {
  
  // console.log(' BANKAPI::LIST MY REQUESTS>> account_name:', account_name, '| page: ', page, ' | limit:', limit, ' | request_type: ', request_type );
  const path    = globalCfg.api.endpoint + '/providers';
  const method  = 'GET';
  let query     = '?page='+(page||0); 
  query=query+'&limit='+(limit||10);
  if(name!== undefined)
    query=query+'&name='+name;
  if(cnpj!== undefined)
    query=query+'&cnpj='+cnpj;

  auth()
    .then((token) => {
      jwtHelper.apiCall(path+query, method)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});

export const createOrUpdateProvider = (providerId, name, cnpj, email, phone, address, category, products_services, bank_accounts, account_name) =>   new Promise((res,rej)=> {  

  const postfix = providerId ? `/providers/${providerId}` : '/providers';
  const path    = globalCfg.api.endpoint + postfix;
  const method  = providerId?'PATCH':'POST';
  const post_params = {
          name:                 name
          , cnpj:               cnpj
          , email:              email
          , phone:              phone
          , address:            address
          , category:           category
          , products_services:  products_services
          , bank_accounts:      bank_accounts
          , account_name:       account_name
        };
  console.log(' inkiriApi::createProvider >> ABOUT TO POST', JSON.stringify(post_params));
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, post_params)
        .then((data) => {
            console.log(' inkiriApi::createProvider >> RESPONSE', JSON.stringify(data))
            res(data)
          }, (ex) => {
            console.log(' inkiriApi::createProvider >> ERROR ', JSON.stringify(ex))
            rej(ex);
          });
    }, (ex) => {
        rej(ex);
    });

});

export const listRequestsForProvider = (page, limit, provider_id) =>   new Promise((res,rej)=> {
  
  console.log(' BANKAPI::LIST REQUESTS FOR PROVIDER >> provider_id:', provider_id
    , '| page: ', page
    , ' | limit:', limit,);
  const path    = globalCfg.api.endpoint + '/requests';
  const method  = 'GET';
  let query     = '?page='+(page||0); 
  query=query+'&limit='+(limit||10);
  // query=query+'&requested_type=type_exchange';
  if(provider_id!== undefined)
    query=query+'&provider_id='+provider_id;
  
  auth()
    .then((token) => {
      jwtHelper.apiCall(path+query, method)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
  }, (ex) => {
      rej(ex);
  });
});

export const refundRequest          = (sender, request_id, state, tx_id) => updateRequest(sender, request_id, globalCfg.api.STATE_REJECTED, undefined, tx_id, false, REQUEST_ADMIN);
export const acceptWithdrawRequest  = (sender, request_id)               => updateRequest(sender, request_id, globalCfg.api.STATE_ACCEPTED, undefined, undefined, false, REQUEST_ADMIN);
export const updateWithdraw         = (sender, request_id, tx_id)        => updateRequest(sender, request_id, undefined, tx_id);

export const createWithdraw = (account_name, amount) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/requests';
  const method  = 'POST';
  const post_params = {
          'from':               account_name
          , 'requested_type':   globalCfg.api.TYPE_WITHDRAW
          , 'amount':           Number(amount).toFixed(2)
          
        };

  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, post_params)
        .then((data) => {
            res(data)
          }, (ex) => {
            rej(ex);
          });
  }, (ex) => {
      rej(ex);
  });
  
});

export const createProviderPaymentEx = (account_name, amount, provider_id, provider_extra, attachments) =>   new Promise((res,rej)=> {
  
  // delete values_array['provider']; // Hack :(
  const path    = globalCfg.api.endpoint + '/requests_files';
  const method  = 'POST';
  const post_params = {
          // ...values_array
          'from':             account_name
          , 'requested_type':   globalCfg.api.TYPE_PROVIDER
          , 'amount':           Number(amount).toFixed(2)
          , 'provider':         provider_id
          , 'provider_extra':   provider_extra
        };

  let formData = new FormData();
  formData.append('request', JSON.stringify(post_params));
  formData.append('from', account_name); // The folder name for GDrive!
  formData.append('requested_type', globalCfg.api.TYPE_PROVIDER); 
  Object.keys(attachments).forEach(function (key) {
    formData.append(key, attachments[key]);
  });    

  const bearer_token = jwtHelper.getBearerTokenByKey();
      
  fetch(path, { // Your POST endpoint
      method: method,
      headers: {
        Authorization: bearer_token
      },
      body: formData 
    }).then(
        (response) => response.json() // if the response is a JSON object
      , (ex) => { rej(ex) }
    ).then(
      (success) => {
        if(!success)
        {
          rej('UNKNOWN ERROR!'); return;
        }
        else
        if(success && success.error)
        {
          rej (success.error); return;
        }
        else
        if(success && success.errors)
        {
          rej (success.errors[0]); return;
        }
        console.log(success);
        res(success);
      }
    ).catch(
      (error) => {
        console.log(JSON.stringify(error));
        rej(error);
        
      }
    );
});

export const rejectExternal             = (sender, request_id, cancel_reason)      => updateRequest(sender, request_id, globalCfg.api.STATE_REJECTED, undefined, undefined, false, REQUEST_ADMIN, cancel_reason);
export const refundExternal             = (sender, request_id, state, tx_id, cancel_reason)       => updateRequest(sender, request_id, state, undefined, tx_id, false, REQUEST_ADMIN, cancel_reason);
export const updateProviderPayment      = (sender, request_id, tx_id)              => updateRequest(sender, request_id, undefined, tx_id);
export const cancelExternal             = (sender, request_id)                     => updateRequest(sender, request_id, globalCfg.api.STATE_CANCELED, undefined);
export const getRefundExternal          = (sender, request_id)                     => updateRequest(sender, request_id, globalCfg.api.STATE_REFUNDED, undefined);

export const processExternal            = (sender, request_id)                     => updateRequest(sender, request_id, globalCfg.api.STATE_PROCESSING, undefined, undefined, false, REQUEST_ADMIN);
export const acceptExternal             = (sender, request_id, attachments)        => updateExternal(sender, request_id, globalCfg.api.STATE_ACCEPTED, attachments, true);

export const updateExternalFiles        = (sender, request_id, state, attachments) => updateExternal(sender, request_id, state, attachments);
export const updateExternalFilesAdmin   = (sender, request_id, state, attachments) => updateExternal(sender, request_id, state, attachments, true);
//export const updateExternal             = (sender, request_id, request_type, state, attachments) =>   new Promise((res,rej)=> {
export const updateExternal             = (sender, request_id, state, attachments, is_admin) =>   new Promise((res,rej)=> {  

  const module  = (is_admin===true)?'requests_files_admin':'requests_files';
  const path    = globalCfg.api.endpoint + `/${module}/${request_id}`;
  const method  = 'POST';
  let post_params = {
    state:            state,
    // requested_type:   request_type,
    sender:           sender
  };

  console.log(' -- PROCESS EXTERNAL:', path)
  let formData = new FormData();

  formData.append('request', JSON.stringify(post_params));
  Object.keys(attachments).forEach(function (key) {
    formData.append(key, attachments[key]);
  });
  console.log(' *********** ACCEPT REQUEST')
  console.log(' formData: ', JSON.stringify(formData))
  console.log(' post_params: ', JSON.stringify(post_params))
  
  const bearer_token = jwtHelper.getBearerTokenByKey();
  
  fetch(path, { 
      method: method,
      headers: {
        Authorization: bearer_token
      },
      body: formData 
    }).then(
        (response) => response.json() // if the response is a JSON object
      , (ex) => { rej(ex) }
    ).then(
      (success) => {
        if(!success)
        {
          rej('UNKNOWN ERROR!'); return;
        }
        else
        if(success && success.error)
        {
          rej (success.error); return;
        }
        else
        if(success && success.errors)
        {
          rej (success.errors[0]); return;
        }
        console.log(success);
        res(success);
      }
    ).catch(
      (error) => {
        console.log(JSON.stringify(error));
        rej(error);
        
      }
    );
  
});

export const createExchangeRequest      = (account_name, amount, bank_account, attachments) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/requests_files';
  const method  = 'POST';
  const post_params = {
          'from':             account_name
          , 'requested_type':   globalCfg.api.TYPE_EXCHANGE
          , 'amount':           Number(amount).toFixed(2)
          , 'bank_account':     bank_account
          
        };

  let formData = new FormData();

  formData.append('request', JSON.stringify(post_params));
  formData.append('from', account_name); // The folder name for GDrive!
  formData.append('requested_type', globalCfg.api.TYPE_PROVIDER); 

  Object.keys(attachments).forEach(function (key) {
    formData.append(key, attachments[key]);
  });    

  const bearer_token = jwtHelper.getBearerTokenByKey();
      
  fetch(path, { // Your POST endpoint
      method: method,
      headers: {
        Authorization: bearer_token
      },
      body: formData 
    }).then(
        (response) => response.json() // if the response is a JSON object
      , (ex) => { rej(ex) }
    ).then(
      (success) => {
        if(!success)
        {
          rej('UNKNOWN ERROR!'); return;
        }
        else
        if(success && success.error)
        {
          rej (success.error); return;
        }
        else
        if(success && success.errors)
        {
          rej (success.errors[0]); return;
        }
        console.log(success);
        res(success);
      }
    ).catch(
      (error) => {
        console.log(JSON.stringify(error));
        rej(error);
        
      }
    );
    /*
    , (error) => {
        console.log(JSON.stringify(error));
        rej(error);
        
      });
      */
});

export const updateExchangeRequest      = (sender, request_id, tx_id) => updateRequest(sender, request_id, undefined, tx_id);

export const createMoneyRequest = (sender, request_type, requested, amount, memo) =>   new Promise((res,rej)=> {
    
  const path    = globalCfg.api.endpoint + '/requests';
  const method  = 'POST';
  const post_params = {
          // 'from':               sender
          // , 'to':               requested
          'from':               requested
          , 'to':               sender
          , 'requested_type':   globalCfg.api.TYPE_PAYMENT
          // , 'requested_type':   request_type
          , 'amount':           Number(amount).toFixed(2)
          , 'description':      memo
          
          
        };
  // console.log(' ============================== createMoneyRequest', post_params)
  auth()
    .then((token) => {
      jwtHelper.apiCall(path, method, post_params)
        .then((data) => {
            // console.log(' ============================== OK:', data)
            res(data)
          }, (ex) => {
            // console.log(' ============================== ERROR:', ex)
            rej(ex);
          });
  }, (ex) => {
      rej(ex);
  });
  
});

export const processIuguInvoiceById = (iugu_invoice_id) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + `/iugu_process/${iugu_invoice_id}`;
  const method  = 'GET';
  
  jwtHelper.apiCall(path, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

export const updateIuguAlias = (iugu_invoice_id, account_name) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + `/iugu_alias/${iugu_invoice_id}/${account_name}`;
  const method  = 'POST';
  
  jwtHelper.apiCall(path, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

export const getIuguInvoiceById = (iugu_invoice_id) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + `/iugu/${iugu_invoice_id}`;
  const method  = 'GET';
  
  jwtHelper.apiCall(path, method)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

export const listIuguInvoices = (page, limit, filter) =>   new Promise((res,rej)=> {
  
  // alias
  // account_name
  // iugu_id
  // state

  console.log(' BANKAPI::LIST IUGU >> filter:', filter, '| page: ', page, ' | limit:', limit);
  const path    = globalCfg.api.endpoint + '/iugu';
  const method  = 'GET';
  let qs = {
      page       : (page||0)
      , limit    : (limit||10),
    };
  if(filter)
    qs = { ...qs , ...filter};

  jwtHelper.apiCall(path, method, qs)
    .then((data) => {
        res(data)
      }, (ex) => {
        rej(ex);
      });
});

/* ***************************************************************** */
/* SERVICES ******************************************************** */

export const sendServiceRequest = (provider, customer_name, service, begins_at, expires_at) =>   new Promise((res,rej)=> {
  
  const path    = globalCfg.api.endpoint + '/requests';
  const method  = 'POST';
  const post_params = {
          'requested_type':     globalCfg.api.TYPE_SERVICE
          , 'from':             provider.account_name
          // , 'requested_by':     provider._id
          , 'to':               customer_name
          , 'service_id':       service._id
          , 'service_extra':   {
                                  'begins_at':         begins_at
                                  , 'expires_at':       expires_at
                                }
          // , 'to':               customer.account_name
          // , 'requested_to':     customer._id
          
        };
  console.log(' inkiriApi::sendServiceRequest >> ABOUT TO POST', JSON.stringify(post_params))
  jwtHelper.apiCall(path, method, post_params)
    .then((data) => {
        console.log(' inkiriApi::sendServiceRequest >> RESPONSE', JSON.stringify(data))
        res(data)
      }, (ex) => {
        console.log(' inkiriApi::sendServiceRequest >> ERROR ', JSON.stringify(ex))
        rej(ex);
      });
});


