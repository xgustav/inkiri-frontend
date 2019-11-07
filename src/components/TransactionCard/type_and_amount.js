import React from 'react'
import { Menu, Dropdown, Button, Icon, message } from 'antd';
import { connect } from 'react-redux'
// import * as loginRedux from '@app/redux/models/login'
import * as globalCfg from '@app/configs/global';
import ItemAmount from '@app/components/TransactionCard/item_amount';
import * as request_helper from '@app/components/TransactionCard/helper';

const TransactionTypeAndAmount = ({request, transaction}) => {
    
    let description = (null);
    let amount      = (null);
    
    if(request){
      description = (<>{globalCfg.api.typeToText(request.requested_type).toUpperCase()} <small>request</small></>);
      amount      = (<ItemAmount amount={request.amount} />);
    }
    
    if(transaction){
      description = transaction.name.toUpperCase();
      if(transaction.request && transaction.request.requested_type)
      {
        console.log(' ** TransactionTypeAndAmount: ', transaction.request)
        description = globalCfg.api.typeToText(transaction.request.requested_type).toUpperCase();
      }
      amount      = (<ItemAmount amount={transaction.quantity} symbol={globalCfg.currency.symbol} />);
      return (
        <div className="ui-list">
          <ul className="ui-list__content">
            <li className="ui-row ui-info-row ui-info-row--medium ui-info-row">
              <div className="ui-row__col ui-row__col--heading">
                  <div className="ui-avatar">
                      <div className="ui-avatar__content ui-avatar__content--icon">
                        <img width="30" height="auto" src="/images/eos_logo.444cd068.svg" />
                      </div>
                  </div>
              </div>
              <div className="ui-row__col ui-row__col--content">
                  <div className="c-ticket ">
                      <ul>
                          <li className="c-ticket__section ">
                              <ul>
                                  <li className="c-ticket__item c-ticket-subtotal">
                                      <div className="c-ticket__row">
                                        <div className="c-ticket__title request_details_title">
                                          {description}
                                        </div>
                                        <div className="c-ticket__amount ">
                                          {amount}
                                        </div>
                                      </div>
                                  </li>
                              </ul>
                          </li>
                      </ul>
                  </div>
              </div>
          </li>
        </ul>
      </div>);
    }
    
    //

    return(
      <div className="ui-list">
          <ul className="ui-list__content">
              <li>
                  <div className="c-ticket ">
                      <ul>
                          <li className="c-ticket__section ">
                              <ul>
                                  <li className="c-ticket__item c-ticket-subtotal">
                                      <div className="c-ticket__row">
                                        <div className="c-ticket__title request_details_title">
                                          {description}
                                        </div>
                                        <div className="c-ticket__amount ">
                                          {amount}
                                        </div>
                                      </div>
                                  </li>
                              </ul>
                          </li>
                      </ul>
                  </div>
              </li>
          </ul>
      </div>  
    )
    
}

export default connect(
    (state)=> ({
        // allAccounts:     loginRedux.allAccounts(state),
        // actualAccountName:   loginRedux.actualAccountName(state),
        // currentAccount:  loginRedux.currentAccount(state),
        // isLoading:       loginRedux.isLoading(state)
    })
)(TransactionTypeAndAmount)