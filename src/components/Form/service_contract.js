import React, {useState, Component} from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import * as accountsRedux from '@app/redux/models/accounts';
import * as loginRedux from '@app/redux/models/login'

import * as api from '@app/services/inkiriApi';
import * as globalCfg from '@app/configs/global';
import * as validators from '@app/components/Form/validators';
import * as request_helper from '@app/components/TransactionCard/helper';
import * as form_helper from '@app/components/Form/form_helper';

import ServiceCard from '@app/components/TransactionCard/service_card';

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import { Select, notification, Empty, Button, Form, message, AutoComplete, Input, Icon } from 'antd';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const DEFAULT_CONTRACT = {
  begins_at   : null,
  expires_at  : null,
  provider    : null,
  service     : null,
  customer    : null
}
class ServiceContractForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      services_states: props.services_states,
      service:         props.service,
      provider:        props.provider,
      customer:        props.customer,
      callback:        props.callback,

    };
    this.handleSubmit               = this.handleSubmit.bind(this);
    this.openNotificationWithIcon   = this.openNotificationWithIcon.bind(this); 
    this.onSelect                   = this.onSelect.bind(this)
  }

  componentDidMount(){
  }

  componentDidUpdate(prevProps, prevState) 
  {
      if(prevProps.job_positions !== this.props.job_positions) {
        this.setState({
            services_states: this.props.services_states,
            service:         this.props.service,
            provider:        this.props.provider,
            callback:        this.props.callback,
            customer:        this.props.customer,
          });
      }
  }

  openNotificationWithIcon(type, title, message) {
    notification[type]({
      message: title,
      description:message,
    });
  }

  /*
  * Components' Events.
  */
    
  fireEvent = (error, cancel, data) => {
    const {callback} = this.state;
    if(typeof  callback === 'function') {
        callback(error, cancel, data)
    }
  }
  
  onSelect = (e) => {
  
  }

  handleSubmit = (e) => {
    e.preventDefault();
    
    this.props.form.validateFields((err, values) => {
      
      if (err) {
        this.openNotificationWithIcon("error", "Validation errors","Please verifiy errors on screen!")    
        console.log(' ERRORS!! >> ', err)
        return;
      }
      // const {member} = this.state;
      // if(!member)
      // {
      //   const exists = this.props.accounts.filter( account => account.key==values.member);
      //   if(!exists || exists.length==0)
      //   {
      //     this.openNotificationWithIcon("error", 'Please select an account from the list.');
      //     return;
      //   }
      // }

      // const editing = (member!=null);
      // let my_member = (editing)
      //   ? { ...values, member:member.member._id, _id:member._id}
      //   : { ...values };

      this.fireEvent(null, null, values);
      
    });
  };

  resetForm(){
    
    // this.setState({...DEFAULT_STATE});
  }

  renderMemberSelector(){
    const {member}              = this.state;
    const { getFieldDecorator } = this.props.form;
    const my_accounts           = this.props.accounts.filter(acc=>acc.key!=this.props.actualAccountName && globalCfg.bank.isPersonalAccount(acc)).map(acc=>acc.key)
    let selector   = null;
    //
    if(member){
      selector = (<div className="ui-row__col ui-row__col--content">
                    <div className="ui-info-row__content">
                        <div className="ui-info-row__title"><b>{request_helper.getProfileName(member.member)}</b></div>
                          <div className="ui-info-row__details">
                              <ul>
                                  <li>@{member.member.account_name}</li>
                              </ul>
                          </div>
                    </div>
                </div>); 
    }
    else{
      selector = (<Form.Item>
                        {getFieldDecorator('member', {
                        rules: [{ required: true, message: 'Please choose a customer!' }]
                      })(
                          <AutoComplete size="large" dataSource={my_accounts} style={{ width: '100%' }} onSelect={this.onSelect} placeholder="Choose a customer by account name" filterOption={true} className="extra-large" />
                        )}
                      </Form.Item>);
    }
  //
    return (<div className="money-transfer__row row-complementary row-complementary-bottom money-transfer__select" >
              <div className="badge badge-extra-small badge-circle addresse-avatar ">
                  <span className="picture">
                    <FontAwesomeIcon icon="user" size="lg" color="gray"/>
                  </span>
              </div>
              <div className="money-transfer__input money-transfer__select">
                {selector}
              </div>
          </div>);
  }
  
  //

  render() {
    const { form, actualAccountProfile }  = this.props;
    const { member, service }             = this.state;
    const member_selector                 = this.renderMemberSelector();
    const button_text                     = 'SEND REQUEST';
    return (
            
            <>
            <ServiceCard service={service} provider={actualAccountProfile}/>

            <Form onSubmit={this.handleSubmit}>
              
              <div className="money-transfer no_label">    

                  {member_selector}
                  {form_helper.withIcon('calendar-alt', form_helper.getMonthItem(form, null , 'begins_at'  , 'Service begins at'  , 'Please input a valid month!'))}
                  {form_helper.withIcon('calendar-alt', form_helper.getMonthItem(form, null , 'expires_at' , 'Service expires at' , 'Please input a valid month!'))}
                  

              </div>
              <div className="mp-box__actions mp-box__shore">
                <Button size="large" key="requestButton" htmlType="submit" type="primary" htmlType="submit" >{button_text}</Button>
                <Button size="large" className="danger_color" type="link" onClick={()=>{this.fireEvent(null, true, null)}}>Cancel</Button>
              </div>
                
              
            </Form>
            </>
        );
  }

  
}
//
export default Form.create() (withRouter(connect(
    (state)=> ({
        accounts:               accountsRedux.accounts(state),
        actualAccountProfile:   loginRedux.actualAccountProfile(state),
    }),
    (dispatch)=>({
        
    })
)(ServiceContractForm) )
);


