import React from 'react'
import { Popconfirm, Alert, Button, Tag, Icon } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as request_helper from '@app/components/TransactionCard/helper';
import * as form_helper from '@app/components/Form/form_helper';
import moment from 'moment';

import * as utils from '@app/utils/utils';
import * as globalCfg from '@app/configs/global';
import * as api from '@app/services/inkiriApi';

export const events = {
    VIEW :        'event_view',
    EDIT :        'event_edit',
    REMOVE :      'event_remove',
    DISABLE :     'event_disable',
    CHILDREN :    'event_children',
    NEW_CHILD :   'event_new_child',
    CHARGE :      'event_charge'
}

export const columnsForPDA           = (callback) => getColumns(callback);
export const columnsForExternal      = (callback) => getColumns(callback);
export const getColumns              = (callback) => {
    // return columns(this.props.actualRoleId, this.onProcessRequestClick)
    return [
      {
        title: 'Description',
        dataIndex: 'sub_header',
        key: 'sub_header',
        render: (value, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.getTypeIcon(record)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">{record.sub_header_admin}</span> 
                 <br/>{request_helper.getStateLabel(record, true)} 
              </div>   
            </span>)
        }
      },
      {
        title: 'Tags',
        key: 'tx_type',
        dataIndex: 'tx_type',
        render: (tx_type, record) => {
          
          return (
            <span key={'tags'+record.id}>
               
               {request_helper.getExternalRequestDesc(record)}
               Op.&nbsp;#<Tag key={'request_id_'+record.id}>
                  { request_helper.getRequestId(record)}
               </Tag>
               {request_helper.getGoogleDocLinkOrNothing(record.attach_nota_fiscal_id, true, 'Nota fiscal')}
               {request_helper.getGoogleDocLinkOrNothing(record.attach_boleto_pagamento_id, true, 'Boleto Pagamento')}
               {request_helper.getGoogleDocLinkOrNothing(record.attach_comprobante_id, true, 'Comprobante Bancario')}
            </span>
            )}
      },
      //
      {
        title: 'Action',
        key: 'action',
        width: 100,
        render: (text, record) => {
          return request_helper.getProcessButton(record, callback);
        }
      },

      {
        title: 'Amount and date',
        
        dataIndex: 'block_time',
        key: 'block_time',
        sortDirections: ['descend'],
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.block_time_number - b.block_time_number,
        align: 'right',
        render: (block_time, record) => (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledAmount(record, false, false)}
            {request_helper.getStyledDate(record)}
          </div>
          )
      }
    ];
}

//
export const getColumnsForPDV = (callback) => {
  return [
  {
    title: '#',
    dataIndex: 'sub_header',
    key: 'sub_header',
    /*
            {request_helper.getTypeIcon(record.request)} 
    */
    render: (value, record) => {
      return(
        <span className="name_value_row">
          <div className="row_name centered" >
            <div className="ui-row__col ui-row__col--heading">
                <div className="ui-avatar">
                  {request_helper.getCircledTypeIcon(record.request)} 
                </div>
            </div>
          </div>
          <div className="row_value wider">
            <span className="row_tx_description">{record.sub_header}</span> 
             <div className="" style={{maxWidth:400, overflowWrap:'normal'}}>
               <ul>
                 <li className="hidden">{utils.objectToString(record.data)}</li>
                 <li className="hidden">{utils.objectToString(record.request)}</li>
                 <li><Tag color="volcano" key={'warning_'+Math.random()}>Open to view details</Tag></li>
               </ul>
             </div>
          </div>   
        </span>)
    }
  },
  {
    title: 'Action',
    key: 'action',
    render: (text, record) => {
      const process     = request_helper.getProcessButton(record, callback, 'Details');
      const blockchain  = request_helper.getBlockchainLink(record.transaction_id, true);
      return (<>{process}&nbsp;{blockchain}</>)
    },
  },
  //
  {
    title: 'Amount and date',
    // fixed: 'right',    
    dataIndex: 'block_time',
    key: 'block_time',
    sortDirections: ['descend'],
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.block_time_number - b.block_time_number,
    align: 'right',
    render: (block_time, record) => {
      return (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledAmount(record, false, false)}
            {request_helper.getStyledDate(record)}
          </div>
          )
      }
  }
]};
//
export const getColumnsForPersonalExtrato = (callback, account_type) => {
  return [
  {
    title: '#',
    dataIndex: 'sub_header',
    key: 'sub_header',
    render: (value, record) => {
      //<li className="hidden">{utils.objectToString(record.data)}</li>
      return(
        <span className="name_value_row">
          <div className="row_name centered" >
            {request_helper.getTypeIcon(record.request)} 
          </div>
          <div className="row_value wider">
            <span className="row_tx_description">{record.sub_header}</span> 
             <div className="" style={{maxWidth:400, overflowWrap:'normal'}}>
               <ul>
                 <li className="hidden">{utils.objectToString(record.request)}</li>
                 <li><Tag color="volcano" key={'warning_'+Math.random()}>Open to view details</Tag></li>
               </ul>
             </div>
          </div>   
        </span>)
    }
  },
  //
  // {
  //   title: 'Tags',
  //   key: 'tx_type',
  //   dataIndex: 'tx_type',
  //   render: (tx_type, record) => {
  //     let extras = null;
  //     if(globalCfg.api.isDeposit(record.request))
  //     {
  //       const envelope_id = api.bank.envelopeIdFromRequest(record);
  //       extras = (< ><br/><span key={'envelope_'+record.id}>ENVELOPE ID: <b>{envelope_id}</b></span></>);
  //     }
  //     //
  //     return (
  //         <span key={'tags'+record.id}>
  //          {extras}
  //         </span>
  //         )}
  // },
  //
  {
    title: 'Action',
    key: 'action',
    render: (text, record) => {
      const process     = request_helper.getProcessButton(record, callback, 'Details');
      const blockchain  = request_helper.getBlockchainLink(record.transaction_id, true);
      return (<>{process}&nbsp;{blockchain}</>)
    },
  },
  //
  {
    title: 'Amount and date',
    // fixed: 'right',    
    dataIndex: 'block_time',
    key: 'block_time',
    sortDirections: ['descend'],
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.block_time_number - b.block_time_number,
    align: 'right',
    render: (block_time, record) => {
      const negative = request_helper.blockchain.isNegativeTransaction(record)
      return (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledAmount(record, false, negative)}
            {request_helper.getStyledDate(record)}
          </div>
          )
      }
  }
]};

//

export const getDefaultColumns = (account_type, callback) => {

  return [
    {
      title: 'Description',
      dataIndex: 'sub_header',
      key: 'sub_header',
      width: '45%',
      render: (value, record) => {
        const text = (globalCfg.bank.isAdminAccount(account_type))
          ?record.sub_header_admin
          :(globalCfg.api.isService(record)
              ?record.sub_header_ex
              :record.sub_header);
        return(
          <span className="name_value_row">
            <div className="row_name centered" >
              {request_helper.getTypeIcon(record)} 
            </div>
            <div className="row_value wider">
              <span className="row_tx_description">{text}</span> 
               <br/>{request_helper.getStateLabel(record, true)} 
            </div>   
          </span>)
      }
    },

    {
      title: 'Tags',
      key: 'tx_type',
      dataIndex: 'tx_type',
      render: (tx_type, record) => {
        let extras = null;
        if(globalCfg.api.isDeposit(record))
        {
          const envelope_id = api.bank.envelopeIdFromRequest(record);
          extras = (< ><br/><span key={'envelope_'+record.id}>ENVELOPE ID: <b>{envelope_id}</b></span></>);
        }
        //
        return(
          <span key={'tags'+record.id}>
            {extras}
          </span>
        );

        // return (
        //     <span key={'tags'+record.id}>
        //      <Tag color={'geekblue'} key={'type_'+record.id}>
        //             {tx_type.toUpperCase()}
        //      </Tag><br/>
        //      <Tag color={'geekblue'} key={'state_'+record.id}>
        //             {(record.state||'COMPLETED').toUpperCase()}
        //      </Tag>
        //      {extras}
        //     </span>
        //     )
      }
    },
    //
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => {
        const title = (globalCfg.bank.isAdminAccount(account_type))?null:'Details';
        return request_helper.getProcessButton(record, callback, title);
      },
    },
    {
    title: 'Amount and date',
    // fixed: 'right',    
    dataIndex: 'block_time',
    key: 'block_time',
    sortDirections: ['descend'],
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.block_time_number - b.block_time_number,
    align: 'right',
    render: (block_time, record) => {
      const negative = request_helper.blockchain.isNegativeTransaction(record)
      return (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledAmount(record, false, negative)}
            {request_helper.getStyledDate(record)}
          </div>
          )
      }
  }
  ]
};

//

export const getColumnsForOperations = (callback, account_type) => {
  return [
  {
    title: '#',
    dataIndex: 'sub_header',
    key: 'sub_header',
    render: (value, record) => {
      return(
        <span className="name_value_row">
          <div className="row_name centered" >
            {request_helper.getTypeIcon(record.request)} 
          </div>
          <div className="row_value wider">
            <span className="row_tx_description">{record.sub_header_admin_ex}</span> 
             <div className="" style={{maxWidth:400, overflowWrap:'normal'}}>
               <ul>
                 <li className="hidden">{utils.objectToString(record.data)}</li>
                 <li className="hidden">{utils.objectToString(record.request)}</li>
                 <li><Tag color="volcano" key={'warning_'+Math.random()}>Open to view details</Tag></li>
               </ul>
             </div>
          </div>   
        </span>)
    }
  },
  //
  // {
  //   title: 'Tags',
  //   key: 'tx_type',
  //   dataIndex: 'tx_type',
  //   render: (tx_type, record) => {
  //     let extras = null;
  //     if(globalCfg.api.isDeposit(record.request))
  //     {
  //       const envelope_id = api.bank.envelopeIdFromRequest(record);
  //       extras = (< ><br/><span key={'envelope_'+record.id}>ENVELOPE ID: <b>{envelope_id}</b></span></>);
  //     }
  //     //
  //     return (
  //         <span key={'tags'+record.id}>
  //          {extras}
  //         </span>
  //         )}
  // },
  //
  {
    title: 'Action',
    key: 'action',
    render: (text, record) => {
      const process     = request_helper.getProcessButton(record, callback, 'Details');
      const blockchain  = request_helper.getBlockchainLink(record.transaction_id, true);
      return (<>{process}&nbsp;{blockchain}</>)
    },
  },
  //
  {
    title: 'Amount and date',
    // fixed: 'right',    
    dataIndex: 'block_time',
    key: 'block_time',
    sortDirections: ['descend'],
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.block_time_number - b.block_time_number,
    align: 'right',
    render: (block_time, record) => {
      const negative = request_helper.blockchain.isNegativeTransaction(record)
      return (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledAmount(record, false, negative)}
            {request_helper.getStyledDate(record)}
          </div>
          )
      }
  }
]};

//
export const columnsForAccounts = (callback) => {
    
    return [
      {
        title: 'Account',
        dataIndex: 'key',
        key: 'account_name',
        render: (value, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.getAccountTypeIcon(record.account_type)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">{record.key}</span> 
                 {request_helper.getAccountStateTag(record, true)} 
              </div>   
            </span>);
        }
      },
      {
        title: 'IUGU alias',
        key: 'overdraft',
        dataIndex: 'overdraft',
        
        render: (overdraft, record) =>{
          const isBiz = globalCfg.bank.isBusinessAccount(record);
          const _alias = (isBiz&&record.alias)?record.alias:(isBiz?request_helper.errorStateTag('Alias not configured!'):'');
          return (
            <span>
              {_alias}
            </span> 
          )}
      },
      //
      {
        title: 'Fee & overdraft',
        key: 'fee',
        dataIndex: 'fee',
        render: (fee, record) => {
          
          return (
            <span>
              <Tag color={'geekblue'} key={Math.random()}>
                    FEE: {globalCfg.currency.toCurrencyString(fee)}
              </Tag>
              <Tag color={'geekblue'} key={Math.random()}>
                    OVERDRAFT: {globalCfg.currency.toCurrencyString(record.overdraft)}
              </Tag>
            </span> 
          )}
      },
      //
      {
        title: 'Action',
        key: 'action',        
        render: (text, record) => {
          // return (<Button key={'details_'+request.id} size="small" onClick={()=>{ buttonClick(callback, request) }}>{title}</Button>);
          return <Button key={'details_'+record.key} onClick={()=>{ callback(record) }} icon="profile" size="small">Details</Button>
        }
      },

      {
        title: 'Balance',
        
        dataIndex: 'balance',
        key: 'balance',
        align: 'right',
        render: (balance, record) => (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.getStyledBalance(record)}
          </div>
          )
      }
    ];
}

//
export const columnsForProviders = (callback) => {
  return [
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                sortDirections: ['descend'],
                defaultSortOrder: 'descend',
                // sorter: (a, b) => a.block_time_number - b.block_time_number,
              },
              {
                title: 'CNPJ',
                dataIndex: 'cnpj',
                key: 'cnpj'
              },
              //
              {
                title: 'Contact',
                dataIndex: 'email',
                key: 'email',
                render: (email, record) => (
                  <>
                    <span key={'email_'+record.id}>
                     <Icon type="mail" />&nbsp;{email}
                    </span><br/>
                    <span key={'phone_'+record.id}> 
                      <Icon type="phone" />&nbsp;{record.phone}
                    </span>
                  </>)
              },
              {
                title: 'Address',
                dataIndex: 'address',
                key: 'address',
                render: (address, record) => (
                  <span key={address._id}>
                   <Icon type="environment" /> {address.street}, {address.city}, CP {address.zip}, {address.state}, {address.country}
                  </span>
                  )
              },
              {
                title: 'Category',
                key: 'category',
                dataIndex: 'category',
              },
              //
              {
                title: 'Products/Services',
                dataIndex: 'products_services',
                key: 'products_services',
                
              },
              {
                title: 'Bank Accounts',
                dataIndex: 'bank_accounts',
                key: 'bank_accounts',
                render: (bank_accounts, record) => (
                  <span key={'bank_accounts_'+record.id}>
                    <Icon type="bank" /> {bank_accounts.map(bank_account => <span key={'bank_accounts'+bank_account._id}>{bank_account.bank_name}, {bank_account.agency}, {bank_account.cc}</span>)} 
                  </span>
                  )
              },
              //
              {
                title: 'Action',
                fixed: 'right',
                width: 100,
                key: 'action',
                render: (record) => 
                    (<>
                     <Button key={'process_'+record.id} onClick={()=>{ callback(record) }} icon="profile" size="small">Profile</Button>
                     </>)
                  ,
              },
            ];

}

//
export const columnsForProfiles = (callback) => {
    
    return [
      {
        title: 'Nome',
        dataIndex: 'first_name',
        key: 'first_name',
        render: (first_name, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.getAccountTypeIcon(record.account_type)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">{request_helper.getProfileName(record)}</span> 
                <br/>@{record.account_name} 
              </div>   
            </span>)
        }
      },
      {
        title: 'Email',
        key: 'email',
        dataIndex: 'email',
        render: (email, record) => {
          
          return (
            <span>
              {record.email}
            </span> 
          )}
      },
      {
        title: 'Cuentas',
        dataIndex: 'userCounterId',
        key: 'userCounterId',
        render: (userCounterId, record) => (
          <span>N/A</span>
          )
      },
      {
        title: 'Action',
        key: 'action',        
        align: 'right',
        render: (text, record) => {
          return <Button key={'details_'+record.key} onClick={()=>{ callback(record) }} icon="profile" size="small">Details</Button>
        }
      }
    ];
}

//

export const columnsForIUGU = (callback) => {
    
    return [
      {
        title: 'Description',
        dataIndex: 'sub_header',
        key: 'sub_header',
        render: (value, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.iugu.stateIcon(record)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">
                  {request_helper.iugu.header(record)}
                </span> 
                <br/>{request_helper.iugu.stateLabel(record)}
              </div>   
            </span>)
        }
      },
      {
        title: 'Tags',
        key: 'tx_type',
        dataIndex: 'tx_type',
        render: (tx_type, record) => {
          const error  = (request_helper.iugu.inError(record))?(<Alert message={record.error} type="error" />):(null);
          const issued = (record.issued_at)?(<p>ISSUED AT: {request_helper.iugu.getDate(record.issued_at)} </p>):(null);
          return (
            <span key={'tags'+record.id}>
               {error}
               {issued}
            </span>
            )}
      },
      //
      {
        title: 'Action',
        key: 'action',
        width: 100,
        render: (text, record) => {
          const iugu        = request_helper.iugu.iuguLink(record);
          const process     = request_helper.getProcessButton(record, callback, 'Details');
          const blockchain  = record.issued_tx_id?request_helper.getBlockchainLink(record.issued_tx_id, true):(null);
          return (<>{process}&nbsp;{iugu}&nbsp;{blockchain}</>)
        }
      },

      {
        title: 'Amount and date',
        
        dataIndex: 'paid_at',
        key: 'paid_at',
        sortDirections: ['descend'],
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.paid_at - b.paid_at,
        align: 'right',
        render: (paid_at, record) => (
          <div className="c-activity-row__extra-action c-activity-row__extra-action--margin_HACK-NO">
            {request_helper.iugu.styledAmount(record, (record.error))}
            {request_helper.iugu.styledDate(record, 'Payment date')}
          </div>
          )
      }
    ];
}

//
export const columnsForCrew = (callback, job_positions) => {
    
    return [
      {
        title: 'Nome',
        dataIndex: 'member',
        key: 'member',
        render: (member, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.getAccountTypeIcon(record.member.account_type)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">{request_helper.getProfileName(record.member)}</span> 
                <br/>@{record.member.account_name} 
              </div>   
            </span>)
        }
      },
      {
        title: 'Position',
        dataIndex: 'position',
        key: 'position',
        render: (position, record) => {
          const _position = job_positions?job_positions.filter(pos=>pos.key==position)[0].title:position;
          return (<span>{_position}</span>);
         }   
      },
      {
        title: 'Wage',
        key: 'wage',
        dataIndex: 'wage',
        render: (wage, record) => {
          
          return (
            <span>
              {globalCfg.currency.toCurrencyString(wage)}
            </span> 
          )}
      },
      {
        title: 'Action',
        key: 'action',        
        align: 'right',
        render: (text, record) => {
                    
          const profile = (<Button key={'profile_'+record.member._id} disabled={true} onClick={()=>{ callback(record, events.VIEW) }} icon="profile" size="small">Profile</Button>);
          const edit    = (<Button key={'edit_'+record.member._id}                    onClick={()=>{ callback(record, events.EDIT) }} icon="edit" size="small">Edit</Button>);
          const remove  = (<Button key={'details_'+record.member._id} type="link"     onClick={()=>{ callback(record, events.REMOVE) }} icon="delete" size="small">Remove</Button>);
          return (<>{profile}&nbsp;{edit}&nbsp;{remove}</>)
        }
      }
    ];
}


//
export const columnsForSalaries = (callback, remove_callback, job_positions) => {
    
    return [
      {
        title: 'Nome',
        dataIndex: 'member',
        key: 'member',
        render: (member, record) => {
          return(
            <span className="name_value_row">
              <div className="row_name centered" >
                {request_helper.getAccountTypeIcon(record.member.account_type)} 
              </div>
              <div className="row_value wider">
                <span className="row_tx_description">{request_helper.getProfileName(record.member)}</span> 
                <br/>@{record.member.account_name} 
              </div>   
            </span>)
        }
      },
      {
        title: 'Position',
        dataIndex: 'position',
        key: 'position',
        render: (position, record) => {
          const _position = job_positions?job_positions.filter(pos=>pos.key==position)[0].title:position;
          return (<span>{_position}</span>);
         }   
      },
      {
        title: 'Wage',
        key: 'wage',
        dataIndex: 'wage',
        render: (wage, record) => {
          
          return (
            <span>
              {globalCfg.currency.toCurrencyString(wage)}
            </span> 
          )}
      },
      {
        title: 'To Pay',
        key: 'current_wage',
        dataIndex: 'current_wage',
        editable: true,
        className:'column_editable'
      },
      {
        title: 'Reason',
        key: 'current_reason',
        dataIndex: 'current_reason',
        editable: true,
        className:'column_editable'
      }
      ,{
        title: 'operation',
        dataIndex: 'operation',
        align: 'right',
        className:'column_action',
        render: (text, record) =>
          (
            <Popconfirm title="Sure to remove from this month payment list?" onConfirm={() => remove_callback(record)}>
              <a>REMOVE</a>
            </Popconfirm>
          )
      },
    ];
}

//

export const columnsForServices = (callback, services_states) => {
    
    const getStateDesc = (state) => {
      if(!services_states)
        return state;
      const the_state = services_states.find(st => st.key==state);
      if(!the_state)
        return state;
      return the_state.title;
    }
    return [
      {
        title: 'Service',
        dataIndex: 'title',
        key: 'title',
        width:'40%',
        render: (title, record) => {
          
            return (<span className="name_value_row">
            <div className="row_name centered" >
              <div className="ui-row__col ui-row__col--heading">
                  <div className="ui-avatar">
                    {request_helper.getCircledTypeIcon('hack_service')} 
                  </div>
              </div>
            </div>
            <div className="row_value wider">
              <span className="row_tx_description">{record.title}</span> 
               <div className="" style={{maxWidth:400, overflowWrap:'normal'}}>
                 {record.description}
               </div>
            </div>   
          </span>)
        }
      },
      {
        title: 'Status',
        dataIndex: 'state',
        key: 'state',
        render: (state, record) => {
          const _state = getStateDesc(state);
          return (<span>{_state}</span>);
         }   
      },
      {
        title: 'Price',
        key: 'amount',
        dataIndex: 'amount',
        render: (amount, record) => {
          
          return (
            <span>
              {globalCfg.currency.toCurrencyString(amount)}
            </span> 
          )}
      },
      {
        title: 'Action',
        key: 'action',        
        align: 'right',
        render: (text, record) => {
          const style     = {marginTop:6};
          const edit      = (<Button key={'edit_'+record._id}        onClick={()=>{ callback(record, events.EDIT) }}      icon="edit" size="small">Edit</Button>);
          const children  = (<Button style={style} key={'children_'+record._id}    onClick={()=>{ callback(record, events.CHILDREN) }}  icon="usergroup-delete" size="small">Customers</Button>);
          const new_child = (<Button style={style} key={'new_child_'+record._id}   onClick={()=>{ callback(record, events.NEW_CHILD) }} icon="user-add" size="small">New customer</Button>);
          
          return (<>{edit}<br/>{children}<br/>{new_child}</>);
          // const _disable = (<Button key={'details_'+record._id} type="link"     onClick={()=>{ callback(record, events.DISABLE) }} icon="pause-circle" size="small">Disable</Button>);
          // return (<>{edit}&nbsp;{_disable}</>)
        }
      }
    ];
}

//

export const columnsForServiceContract = (callback) => {
    
    return [
      {
        title: 'Customer',
        dataIndex: 'account',
        key: 'account',
        width:'40%',
        render: (account, record) => {
          
            return (<span className="name_value_row">
            <div className="row_name centered" >
              <div className="ui-row__col ui-row__col--heading">
                  <div className="ui-avatar">
                    {request_helper.getCircledTypeIcon('hack_user')} 
                  </div>
              </div>
            </div>
            <div className="row_value wider">
              <span className="row_tx_description">@{account}</span> 
               
            </div>   
          </span>)
        }
      },
      {
        title: 'Duration',
        key: 'begins_at',
        dataIndex: 'begins_at',
        render: (begins_at, record) => {
          
          return (
            <>
              <span>
                From: {moment(begins_at).format(form_helper.MONTH_FORMAT_HUMANIZED)}
              </span> 
              <br/><span> 
                To: {moment(begins_at).add(record.periods, 'months').format(form_helper.MONTH_FORMAT_HUMANIZED)}
              </span> 
            </> 
          )}
      },
      {
        title: 'Status',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled, record) => {
          const {last_charged, total_charged} = api.pap_helper.getChargeInfo(record);
          const _state                        = (enabled)?'ACTIVE':'INACTIVE';
          return (
            <>
              <span>Last period charged: {last_charged}</span>
              <br/><span>Total periods charged: {total_charged}</span>
              <br/><span>{_state}</span>
            </>);
         }   
      },
      
      {
        title: 'Action',
        key: 'action',        
        align: 'right',
        render: (text, record) => {
          const style     = {marginTop:6};
          const charge   = (<Button               key={'charge_'+record.id}   onClick={()=>{ callback(record, events.CHARGE) }}    icon="calendar" size="small" disabled={!record.enabled}>Charge</Button>);
          const children = (<Button style={style} key={'children_'+record.id} onClick={()=>{ callback(record, events.CHILDREN) }}  icon="download" size="small" disabled>Received payments</Button>);
          const _remove  = (<Button style={style} key={'remove_'+record.id}   onClick={()=>{ callback(record, events.REMOVE) }}    icon="delete"   size="small" type="link" disabled>SEASE and REMOVE</Button>);
          return (<>{charge}<br/>{children}<br/>{_remove}</>);
        }
      }
    ];
}
