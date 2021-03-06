import React from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import { withRouter } from "react-router-dom";

import { Icon, Menu } from 'antd';

import * as menuRedux from '@app/redux/models/menu'

import HeaderDropdown from './HeaderDropdown';
import './index.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { injectIntl } from "react-intl";

class ReferrerWidget extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      referrer:       props.referrer
    };
  }

  onMenuClick = (event) => {
    const { referrer } = this.state;
    const { key }      = event;

    if (key === 'goto_referrer') {
      this.props.history.push({
        pathname: referrer.referrer
        , state: { 
            referrer: referrer.referrer_father
          }
      })
    }

    this.props.clearReferrer();

  };

  render() {
    const { referrer } = this.props;
    if(!referrer.referrer)
      return null;

    const menuHeaderDropdown = (
      <Menu className="menu" selectedKeys={[]} onClick={this.onMenuClick}>
        <Menu.Item key="goto_referrer">
            <FontAwesomeIcon icon={referrer.referrer_icon||'university'} color="black"/>
            &nbsp;{referrer.referrer_title}
          </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="clear_referrer">
          <Icon type="close" />
          { this.props.intl.formatMessage({id:'global.clear'}) }
        </Menu.Item>
      </Menu>
    );
    return (
      <HeaderDropdown overlay={menuHeaderDropdown} style={{marginRigth:16}} className="temp_alert_action">
          <span className={`action account`}>
            <FontAwesomeIcon icon={referrer.referrer_icon||'university'} className="fa_icon"/>
          </span>
      </HeaderDropdown>
    );
  }
}

export default (withRouter(connect(
    (state)=> ({
      
      referrer:           menuRedux.referrer(state),

    }),
    (dispatch)=>({
      
      clearReferrer:      bindActionCreators(menuRedux.clearReferrer, dispatch),
    })
)( injectIntl(ReferrerWidget)) ));

