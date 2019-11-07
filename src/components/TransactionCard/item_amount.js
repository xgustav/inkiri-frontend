import React from 'react'
import { Menu, Dropdown, Button, Icon, message } from 'antd';
// import * as loginRedux from '@app/redux/models/login'
import * as globalCfg from '@app/configs/global';

import * as request_helper from '@app/components/TransactionCard/helper';

const ItemAmount = ({amount, symbol}) => {
    
    const my_symbol = symbol?symbol:globalCfg.currency.fiat.symbol;
    return(
      <span className="price-tag price-tag-billing">
        <span className="price-tag price-tag-symbol">
          {my_symbol} 
        </span>
        <span className="price-tag price-tag-fraction">
          {amount}
        </span>
      </span>
                         
    )
    
}
//
export default (ItemAmount)