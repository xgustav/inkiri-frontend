import * as globalCfg from '@app/configs/global';
import { createDfuseClient, DfuseClient } from "@dfuse/client";
import * as txsHelper from './transactionHelper';
import * as jwtHelper from './jwtHelper';

// Item format:
// {
//   "token": "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTA2OTIxNzIsImp0aSI6IjQ0Y2UzMDVlLWMyN2QtNGIzZS1iN2ExLWVlM2NlNGUyMDE1MyIsImlhdCI6MTU1MDYwNTc3MiwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJ1aWQ6bWRmdXNlMmY0YzU3OTFiOWE3MzE1IiwidGllciI6ImVvc3EtdjEiLCJvcmlnaW4iOiJlb3NxLmFwcCIsInN0YmxrIjotMzYwMCwidiI6MX0.k1Y66nqBS7S6aSt-zyt24lPFiNfWiLPbICc89kxoDvTdyDnLuUK7JxuGru9_PbPf89QBipdldRZ_ajTwlbT-KQ",
//   "expires_at": 1550692172 // An UNIX timestamp (UTC) indicating when the JWT will expire.
// }  							

export const isAuth = () => {
  return jwtHelper.getTokenIfNotExpired(jwtHelper.DFUSE_AUTH_TOKEN_KEY)!==null;
}

export const auth = () =>   new Promise((res,rej)=> {
	
	// Check if already have a valid token at localstorage
	const token = jwtHelper.getTokenIfNotExpired(jwtHelper.DFUSE_AUTH_TOKEN_KEY);

  // console.log(' >> dfuse::auth >> is TOKEN at local storage? >> ')  
  console.log(' >> dfuse::auth >> TOKEN? >> ', token);  
  if(!token)
	{
		// console.log('dfuse::auth >> NO >>', 'About to post dfuse auth api')	
		// Retrieve dfuse token
		const opts = {"api_key":globalCfg.dfuse.api_key}
		fetch(globalCfg.dfuse.auth_url, {
	    method: 'POST',
	    body: JSON.stringify(opts)
		  }).then((response) => response.json(), (err) => {rej(err);})
      .then((data) => {
		  	// console.log('dfuse::auth >> ', 'About to set local storage', JSON.stringify(data))	
		  	// localStorage.setItem(jwtHelper.DFUSE_AUTH_TOKEN_KEY, JSON.stringify(data))
        jwtHelper.setTokenToStorage(jwtHelper.DFUSE_AUTH_TOKEN_KEY, JSON.stringify(data));
				res(jwtHelper.buildResponse(data.token));
        return;
		  }, (ex) => {
        rej(ex);
        return;
      });
	  return;
	}
  else{
    // console.log('dfuse::auth >> YES >>', 'About to retrieve from local storage', token)  
    // res({data:JSON.parse(dfuse_auth)})
    res(jwtHelper.buildResponse(token));
  }
	
})



// GET /v0/state/key_accounts
// In replace of -> /v1/history/get_key_accounts
// Source -> https://docs.dfuse.io/#rest-get-v0-state-key-accounts
export const getKeyAccounts = (public_key) => new Promise((res,rej)=> {
  auth()
    .then((token) => {
      // console.log( ' >>>>>> dfuse::getKeyAccounts >> token ->' , token)
      const path = globalCfg.dfuse.base_url + '/v0/state/key_accounts';
      const method = 'GET';
      const query = '?public_key='+public_key;
      
      jwtHelper.apiCall(path+query, method)
        .then((data) => {
          console.log( ' >> dfuse::getKeyAccounts OK >>', data)
            res(data.account_names)
          }, (ex) => {
            console.log( ' >> dfuse::getKeyAccounts ERROR#2 >>', ex)
            rej(ex);
          });
    }, (ex) => {
      console.log( ' >> dfuse::getKeyAccounts ERROR#1 >>', ex)
      rej(ex);
    });
})

export function createClient(){
	let client = createDfuseClient({
    apiKey: globalCfg.dfuse.api_key,
    network: globalCfg.dfuse.network
  })
  return client;
} 

// https://jungle.eos.dfuse.io/v0/state/tables/scopes?account=inkiritoken1&scopes=inkiritoken1|inkpersonal1|inkpersonal3&table=accounts&json=true

export const getAccountsBalances = (account_names_array) => new Promise((res,rej)=> {
  auth()
    .then((token) => {
      // console.log( ' >>>>>> dfuse::getKeyAccounts >> token ->' , token)
      const path           = globalCfg.dfuse.base_url + '/v0/state/tables/scopes';
      const method         = 'GET';
      const currency_token = globalCfg.currency.token;
      const scopes         = account_names_array.join('|');

      const query = `?account=${currency_token}&scopes=${scopes}&table=accounts&json=true`;
      
      jwtHelper.apiCall(path+query, method)
        .then((data) => {
            res(data.tables.map(row=>{return{account:row.scope, balance:((row.rows&&row.rows.length>0)?txsHelper.getEOSQuantityToNumber(row.rows[0].json.balance):0)}} ) )
          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
      // console.log( ' >> dfuse::getKeyAccounts ERROR >>', ex)
      rej(ex);
    });
})


export const getAccountBalance = (account) => new Promise((res,rej)=> {
	
	// console.log('dfuse::getAccountBalance >> ', 'About to retrieve balance for account:', account)	
	
	let client = createClient();
	client.stateTable(
      globalCfg.currency.token,
      account,
      "accounts",
      { blockNum: undefined }
    )
    .then((data) => {
      // console.log(' dfuse::getAccountBalance >> receive balance for account:', account, JSON.stringify(data));
      const _res = {
          data:{
            balance:       data.rows.length?txsHelper.getEOSQuantityToNumber(data.rows[0].json.balance):0,
            balanceText:   data.rows.length?data.rows[0].json.balance:0
          }
        };
      // console.log(' dfuse::getAccountBalance >> about to dispatch balance for account:', account, JSON.stringify(_res));
      res (_res);
      client.release();
    }, (ex)=>{
      // console.log('dfuse::getAccountBalance >> ERROR ', JSON.stringify(ex));
      rej(ex);
      client.release();
    });
    

})	

/**
 * Function that retrieves all blockchain transactions that includes
 * the account that was given authority over a permission.
 *
 * @param {string} account_name – Description.
 */
export const searchPermissioningAccounts = (account_name) => new Promise( (res, rej) => {

  /*
  {
    "query" : "{searchTransactionsForward(query: \"data.auth.accounts.permission.actor:inkpersonal3\") {cursor results { undo trace { id matchingActions { json }}}}}"
  }
  */
  // ToDo: Improve GraphQL query! Filter duplicates and find latest.
  auth()
    .then((token) => {
      
      const path   = globalCfg.dfuse.base_url + '/graphql';
      const method = 'POST';
      const data   = {"query" : '{searchTransactionsForward(query: "data.auth.accounts.permission.actor:'+account_name+'") {cursor results { undo trace { id matchingActions { json }}}}}'};
      
      jwtHelper.apiCall(path, method, data)
        .then((data) => {
            // Filter transactions to get unique permissioners account names.
            const accounts = data.data.searchTransactionsForward.results
              .map(txs => txs.trace.matchingActions[0].json.account)
              .filter(account=>account!=account_name);
            const _res = [...new Set(accounts)];
            console.log(' dfuse::searchPermissioningAccounts() account_name:', account_name, ' | result: ', JSON.stringify(_res))
            res(_res);

            // const ret = data.data.searchTransactionsForward.results
            //   .filter((obj, index) => obj)
            //   .map(txs => ({ 
            //     permissioner:txs.trace.matchingActions[0].json.account, 
            //     permission:txs.trace.matchingActions[0].json.permission, 
            //     permissioned:txs.trace.matchingActions[0].json.auth.accounts.filter(perm => perm.permission.actor==account_name)[0].permission }))
            // res(ret)

          }, (ex) => {
            rej(ex);
          });
    }, (ex) => {
      // console.log( ' >> dfuse::getKeyAccounts ERROR >>', ex)
      rej(ex);
    });
  
})

export const transformTransactions = (txs, account_name, is_search_result) => transformTransactionsImpl(txs, account_name, is_search_result);
const transformTransactionsImpl = (txs, account_name, is_search_result) => {
  
  if (!txs || txs.length <= 0) {
    return [];
  }
  if(!Array.isArray(txs)) 
    txs = [txs];

  // TX info structure:
  //   id
  //   block_time
  //   block_time_number
  //   transaction_id
  //   block_num
  // ACTION info structure:
  //   {
  //     "account": "inkiritoken1",
  //     "name": "any",
  //     "authorization": [
  //     {
  //         "actor": "xxx",
  //         "permission": "active"
  //     }],
  //     "data": { ... }
  //   }
  // TX structure from SEARCH:
  // - info:     -> transaction.lifecycle.execution_trace
  // - action:   -> transaction.lifecycle.execution_trace.action_traces[0].act
  // TX structure from EVENT:
  // - info:     -> transaction.data
  // - action:   -> transaction.data.trace.act.data
  


  const my_txs = txs.map(
     (transaction) => {
      const tx_info    =  (is_search_result)
                          ?transaction.lifecycle.execution_trace
                          :transaction.data;
      const tx_data    = (is_search_result)
                          ?transaction.lifecycle.execution_trace.action_traces[0].act
                          :transaction.data.trace.act;
      const expandedTx = txsHelper.getTxMetadata(account_name, tx_data);      
      return {  
          ...tx_data
          , ...expandedTx
          ,'id' :               (is_search_result)?tx_info.id:tx_info.trx_id
          ,'block_time' :       tx_info.block_time.split('.')[0]
          ,'block_time_number': Number(tx_info.block_time.split('.')[0].replace(/-/g,'').replace(/T/g,'').replace(/:/g,'') )
          ,'transaction_id' :   (is_search_result)?tx_info.id:tx_info.trx_id
          ,'block_num' :        tx_info.block_num 
      };
    })
  
  return my_txs;
}

/*
*  Retrieves TXs from DFUSE for a given account.
* account_name
* cursor
* received_or_sent undefined (both) | true (received) | sent (false) 
*/
export const listTransactions = (account_name, cursor, received_or_sent) => new Promise((res,rej)=> {
	
	
  // const query = 'account:' + globalCfg.currency.token + ' (data.from:'+account_name+' OR data.to:'+account_name+')'
  const query = (account_name)
    ?(
      received_or_sent===undefined
      ?`account: ${globalCfg.currency.token} (data.from:${account_name} OR data.to:${account_name})`
      :
        (received_or_sent===true)
        ?`account: ${globalCfg.currency.token} (data.to:${account_name})`
        :`account: ${globalCfg.currency.token} (data.from:${account_name})`
      )
    :`account: ${globalCfg.currency.token} `;

	console.log('dfuse::listTransactions >> ', 'About to retrieve listTransactions >>', query);	

  let options = { limit: globalCfg.dfuse.default_page_size , sort: 'desc'}
  if(cursor!==undefined)
    options['cursor'] = cursor;

	let client = createClient();
	
  client.searchTransactions(
      query,
      options
    )
    .then( (data) => {
    	// var txs = data.transactions.map(transaction => transaction.lifecycle.execution_trace.action_traces[0].act);

      const txs = transformTransactionsImpl(data.transactions, account_name, true);
        
      console.log(' dfuse::listTransactions >> RAW data >>', JSON.stringify(data));
      // console.log(' dfuse::listTransactions >> ', JSON.stringify(txs));
      console.log(' dfuse::listTransactions cursor>> ', JSON.stringify(data.cursor));
      // res ({data:{txs:txs, cursor:data.cursor}})
      res ({data:{txs:txs, cursor:data.cursor}})
      client.release();
    }, (ex) => {
      console.log('dfuse::listTransactions >> ERROR#1 ', JSON.stringify(ex));
      rej(ex);
      client.release();
    });
  
})	

// Extract tx_id from push transaction result
/*
{"transaction_id":"0229d296bd4bb7fc0e049b30d460e80c2c7c24e5f16bb15f2691c0f7f848ab46","processed":{"id":"0229d296bd4bb7fc0e049b30d460e80c2c7c24e5f16bb15f2691c0f7f848ab46","block_num":43312771,"block_time":"2019-08-08T16:29:01.000","producer_block_id":null,"receipt":{"status":"executed","cpu_usage_us":2382,"net_usage_words":16},"elapsed":2382,"net_usage":128,"scheduled":false,"action_traces":[{"action_ordinal":1,"creator_action_ordinal":0,"closest_unnotified_ancestor_action_ordinal":0,"receipt":{"receiver":"inkiritoken1","act_digest":"869b3e03441b82e3f5f775be71d10c07b8e872e91077ad3a92f0d62feea2280a","global_sequence":462147232,"recv_sequence":18,"auth_sequence":[["inkpersonal1",10]],"code_sequence":1,"abi_sequence":1},"receiver":"inkiritoken1","act":{"account":"inkiritoken1","name":"transfer","authorization":[{"actor":"inkpersonal1","permission":"active"}],"data":{"from":"inkpersonal1","to":"ikadminoooo1","quantity":"1.1000 INK","memo":"snd"},"hex_data":"10a299145f55e1741028a5743a990c74f82a00000000000004494e4b0000000003736e64"},"context_free":false,"elapsed":1850,"console":"","trx_id":"0229d296bd4bb7fc0e049b30d460e80c2c7c24e5f16bb15f2691c0f7f848ab46","block_num":43312771,"block_time":"2019-08-08T16:29:01.000","producer_block_id":null,"account_ram_deltas":[],"except":null,"error_code":null,"inline_traces":[{"action_ordinal":2,"creator_action_ordinal":1,"closest_unnotified_ancestor_action_ordinal":1,"receipt":{"receiver":"inkpersonal1","act_digest":"869b3e03441b82e3f5f775be71d10c07b8e872e91077ad3a92f0d62feea2280a","global_sequence":462147233,"recv_sequence":8,"auth_sequence":[["inkpersonal1",11]],"code_sequence":1,"abi_sequence":1},"receiver":"inkpersonal1","act":{"account":"inkiritoken1","name":"transfer","authorization":[{"actor":"inkpersonal1","permission":"active"}],"data":{"from":"inkpersonal1","to":"ikadminoooo1","quantity":"1.1000 INK","memo":"snd"},"hex_data":"10a299145f55e1741028a5743a990c74f82a00000000000004494e4b0000000003736e64"},"context_free":false,"elapsed":7,"console":"","trx_id":"0229d296bd4bb7fc0e049b30d460e80c2c7c24e5f16bb15f2691c0f7f848ab46","block_num":43312771,"block_time":"2019-08-08T16:29:01.000","producer_block_id":null,"account_ram_deltas":[],"except":null,"error_code":null,"inline_traces":[]},{"action_ordinal":3,"creator_action_ordinal":1,"closest_unnotified_ancestor_action_ordinal":1,"receipt":{"receiver":"ikadminoooo1","act_digest":"869b3e03441b82e3f5f775be71d10c07b8e872e91077ad3a92f0d62feea2280a","global_sequence":462147234,"recv_sequence":25,"auth_sequence":[["inkpersonal1",12]],"code_sequence":1,"abi_sequence":1},"receiver":"ikadminoooo1","act":{"account":"inkiritoken1","name":"transfer","authorization":[{"actor":"inkpersonal1","permission":"active"}],"data":{"from":"inkpersonal1","to":"ikadminoooo1","quantity":"1.1000 INK","memo":"snd"},"hex_data":"10a299145f55e1741028a5743a990c74f82a00000000000004494e4b0000000003736e64"},"context_free":false,"elapsed":34,"console":"","trx_id":"0229d296bd4bb7fc0e049b30d460e80c2c7c24e5f16bb15f2691c0f7f848ab46","block_num":43312771,"block_time":"2019-08-08T16:29:01.000","producer_block_id":null,"account_ram_deltas":[],"except":null,"error_code":null,"inline_traces":[]}]}],"account_ram_delta":null,"except":null,"error_code":null}}
*/
export const getBlockExplorerTxLink = (tx_id) => {

  return globalCfg.dfuse.getBlockExplorerTxLink( tx_id);
}

export const getTxId = (result_tx) => {

  return result_tx.transaction_id;
}

export const getBlockExplorerAccountLink = (account_name) => {

  return globalCfg.dfuse.account_url + account_name;
}