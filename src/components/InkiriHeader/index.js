import React, {Component} from 'react'
import { Layout, Icon, Button, Tag, Modal } from 'antd';

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import UserBalance from './userBalance';

import * as menuRedux from '@app/redux/models/menu'
import * as loginRedux from '@app/redux/models/login'

// import './index.less';
import './right_content.less';

import AccountSelector from '@app/components/InkiriHeader/accountSelector';

import * as globalCfg from '@app/configs/global';

const { Header } = Layout;

class InkiriHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMobile         : props.isMobile
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.isMobile!=prevProps.isMobile)
      this.setState({isMobile:this.props.isMobile})
  }
  toggle = () => {
    this.props.collapseMenu(!this.props.menuIsCollapsed);
    // this.setState({
    //   collapsed: !this.state.collapsed,
    // });
  };

  accountToString(account){
    return JSON.stringify(account);
  }
  

  handleChange(account_name) {
    console.log(`selected ${account_name}`);
    this.props.trySwitchAccount(account_name);
  }

  handleLogout() {
    const that = this;
    Modal.confirm({
      title: 'Logout confirmation',
      content: 'Please confirm logout action',
      onOk() {

        that.props.logout();
      },
      onCancel() {
        
      },
    });
    
  }

  render(){
    let header_content ;
    const {isMobile} = this.state;
    if(isMobile)
    {
      header_content = (
        <>
        <a className="ant-pro-global-header-logo" key="logo" href="/">
          <img src="/favicons/favicon-32x32.png" alt="logo" />
        </a>
        <div className="right">
          <span>Balance {globalCfg.currency.symbol}<UserBalance userId={this.props.actualAccountName} /> </span>
          <Button icon={'logout'} shape="circle" onClick={this.props.logout} style={{marginLeft: '8px'}}></Button>
        </div>
        </>
        );
    }
    else{
      //
      header_content=(
        <div className="right">
          <div className="header_element_container">
            <AccountSelector onChange={this.handleChange} isMobile={isMobile}/>
             &nbsp; <span> Balance {globalCfg.currency.symbol}<UserBalance userId={this.props.actualAccountName} /> </span>
           <Button style={{marginLeft: '10px', marginRight: '10px'}}  icon={'logout'} onClick={this.handleLogout} size="small">Logout</Button>
          </div>
        </div>
      );
    }
    //
    return (
       <Header style={{ background: '#fff', padding: 0 }}>
          <div className="ant-pro-global-header">  
            {header_content}
          </div>
        </Header>
    )
  }

}
//
export default connect(
    (state)=> ({
      actualAccountName :   loginRedux.actualAccountName(state),
      menuIsCollapsed :     menuRedux.isCollapsed(state),
      isMobile :            menuRedux.isMobile(state)
    }),
    (dispatch)=>({
        // try: bindActionCreators(userRedux.tryUserState , dispatch),
        tryLogin:           bindActionCreators(loginRedux.tryLogin, dispatch),
        trySwitchAccount:   bindActionCreators(loginRedux.trySwitchAccount, dispatch),
        logout:             bindActionCreators(loginRedux.logout, dispatch),
        collapseMenu:       bindActionCreators(menuRedux.collapseMenu, dispatch)
    })
)(InkiriHeader)