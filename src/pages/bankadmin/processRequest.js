import React, {useState, Component} from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import * as loginRedux from '@app/redux/models/login'
import * as accountsRedux from '@app/redux/models/accounts'
import * as balanceRedux from '@app/redux/models/balance'

import * as api from '@app/services/inkiriApi';
import * as routesService from '@app/services/routes';
import * as globalCfg from '@app/configs/global';
import * as utils from '@app/utils/utils';

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import { Result, Card, PageHeader, Tag, Button, Statistic, Row, Col, Spin, Descriptions } from 'antd';
import { notification, Form, Icon, InputNumber, Input, AutoComplete, Typography } from 'antd';

import './processRequest.css'; 
import styles from './processRequest.less';

const { Paragraph, Text } = Typography;


const Description = ({ term, children, span = 12 }) => (
    <Col span={span}>
      <div className="description">
        <div className="term">{term}</div>
        <div className="detail">{children}</div>
      </div>
    </Col>
  );

const routes = routesService.breadcrumbForFile('pda');

class processRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading:      false,
      
      receipt:      '',
      amount:       0,
      memo:         '',
      pushingTx:    false,
      result:       undefined,
      result_object:undefined,
      error:        {},
      number_validateStatus : '',
      number_help:  ''
      
      , request:     undefined
    };

    // this.handleSearch = this.handleSearch.bind(this); 
    this.onSelect                   = this.onSelect.bind(this); 
    this.renderContent              = this.renderContent.bind(this); 
    this.handleSubmit               = this.handleSubmit.bind(this);
    this.onChange                   = this.onChange.bind(this); 
    this.resetPage                  = this.resetPage.bind(this); 
    this.openNotificationWithIcon   = this.openNotificationWithIcon.bind(this); 
    this.renderInfoForRequest       = this.renderInfoForRequest.bind(this);
    this.renderInfoForDeposit       = this.renderInfoForDeposit.bind(this);
    this.issueMoney                 = this.issueMoney.bind(this);
  }

  static propTypes = {
    // match: PropTypes.object.isRequired,
    // location: PropTypes.object.isRequired,
    // history: PropTypes.object.isRequired
    match: PropTypes.object,
    location: PropTypes.object,
    history: PropTypes.object
  };

  componentDidMount(){
    const { match, location, history } = this.props;
    // console.log( 'processRequest::router-params >>' , JSON.stringify(this.props.location.state.request) );
    if(this.props.location && this.props.location.state)
      this.setState({request : this.props.location.state.request})
  }
  
  onSelect(value) {
    console.log('onSelect', value);
    this.setState({receipt:value})
  }

  onChange(e) {
    e.preventDefault();
    // console.log('changed', e);
    this.setState({amount:e.target.value, number_validateStatus:'' , number_help:''})
  }

  openNotificationWithIcon(type, title, message) {
    notification[type]({
      message: title,
      description:message,
    });
  }

  issueMoney = async () => {
    const {_id, amount, requested_by, requestCounterId, deposit_currency} = this.state.request;
    const privateKey = this.props.actualPrivateKey;
    const receiver   = requested_by.account_name;
    const sender     = this.props.actualAccountName; //globalCfg.currency.issuer
    
    const fiat       = globalCfg.api.fiatSymbolToMemo(deposit_currency)
    const memo       = `dep|${fiat}|${requestCounterId.toString()}`;

    let that = this;
    that.setState({pushingTx:true});
    api.issueMoney(sender, privateKey, receiver, amount, memo)
      .then(data => {
        console.log(' processRequest::issue (then#1) >>  ', JSON.stringify(data));
        if(data && data.data && data.data.transaction_id)
        {
          // updeteo la tx
          api.bank.setDepositOk(sender, _id, data.data.transaction_id).then(
            // muestro resultado
            (update_res) => {
              console.log(' processRequest::issue (then#2) >> update_res ', JSON.stringify(update_res), JSON.stringify(data));
              console.log(' processRequest::issue (then#2) >> data ', JSON.stringify(data));
              that.setState({result:'ok', pushingTx:false, result_object:data});
            }, (err) => {
              that.setState({result:'error', pushingTx:false, error:JSON.stringify(err)});
            }
          )
        }
        else{
          that.setState({result:'error', pushingTx:false, error:'UNKNOWN!'});
        }
        
      }, (ex)=>{
        console.log(' processRequest::issue (error#1) >>  ', JSON.stringify(ex));
        that.setState({result:'error', pushingTx:false, error:JSON.stringify(ex)});
      });
  }


  handleSubmit = e => {
    e.preventDefault();
    this.issueMoney();
  };

  backToDashboard = async () => {
    this.props.history.push({
      pathname: `/${this.props.actualRole}/dashboard`
    })
  }

  backToPDA = async () => {
    this.props.history.push({
      pathname: `/${this.props.actualRole}/pda`
    })
  }

  resetPage(){
    this.setState({result: undefined, result_object: undefined, error: {}});
  }

  renderContent() {
  
    const { getFieldDecorator } = this.props.form;
    
    if(this.state.result=='ok')
    {
      const tx_id = api.dfuse.getTxId(this.state.result_object?this.state.result_object.data:{});
      const _href = api.dfuse.getBlockExplorerTxLink(tx_id);
      // console.log(' >>>>> api.dfuse.getBlockExplorerTxLink: ', _href)
      
      return (<Result
        status="success"
        title="Transaction completed successfully!"
        subTitle={`Transaction id ${tx_id}. Cloud server takes up to 30 seconds, please wait.`}
        extra={[
          <Button type="primary" key="go-to-dashboard" onClick={()=>this.backToDashboard()}>
            Go to dashboard
          </Button>,
          <Button  key="go-to-pda" onClick={()=>this.backToPDA()}>
            Back to PDA
          </Button>,
          <Button type="link" href={_href} target="_blank" key="view-on-blockchain" icon="cloud" title="View on Blockchain">B-Chain</Button>,
          
        ]}
      />)
    }

    if(this.state.result=='error')
    {

      // <Button key="re-send">Try sending again</Button>,
      return (<Result
                status="error"
                title="Transaction Failed"
                subTitle="Please check and modify the following information before resubmitting."
                extra={[
                  <Button type="primary" key="go-to-dashboard" onClick={()=>this.backToDashboard()}>Go to dashboard</Button>,
                  <Button shape="circle" icon="close-circle" key="close" onClick={()=>this.resetPage()} />
                ]}
              >
                <div className="desc">
                  <Paragraph>
                    <Text
                      strong
                      style={{ fontSize: 16, }}
                    >
                      The content you submitted has the following error:
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Icon style={{ color: 'red' }} type="close-circle" /> {this.state.error}
                  </Paragraph>
                </div>
              </Result>)
    }
    
    // ** hack for sublime renderer ** //

    const {amount, requested_by} = this.state.request;
    const cant_process           = globalCfg.api.isFinished(this.state.request)
    return (
        <div style={{ margin: '0 auto', width:500, padding: 24, background: '#fff'}}>
          <Spin spinning={this.state.pushingTx} delay={500} tip="Pushing transaction...">
            <Form onSubmit={this.handleSubmit}>
                
              <Form.Item style={{minHeight:60, marginBottom:12}}>
                <Input
                    size="large"
                    style={{ width: '100%' }}
                    value={requested_by.account_name}
                    className="extra-large"
                    readOnly
                    suffix={<Icon type="user" style={{fontSize:20}} className="default-icon" />} 
                  />

              </Form.Item>

              
              <Form.Item  style={{minHeight:60, marginBottom:12}}> 
                <Input
                    size="large"
                    style={{ width: '100%' }}
                    value={amount}
                    className="input-money extra-large"
                    readOnly
                    prefix={<Icon type="dollar-circle" theme="filled" style={{fontSize:34}} className="certain-category-icon" />} 
                  />
                
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" disabled={cant_process}>
                  Accept Deposit & Issue
                </Button>
                
              </Form.Item>
            </Form>
          </Spin>
        </div>
    );
  }
  //
  renderInfoForRequest(){
    switch(this.state.request.requested_type) {
      case globalCfg.api.TYPE_DEPOSIT:
        return this.renderInfoForDeposit() 
        break;
      case globalCfg.api.TYPE_WITHDRAW:
        return this.renderInfoForWithdraw() 
        break;
      default:
        return (<></>);
    }
  }
  // ** hack for sublime renderer ** //
  renderInfoForDeposit() 
  {
    const {tx_id, deposit_currency, requested_type, amount, quantity_txt, state, created_at, requestCounterId, subheader, requested_by} = this.state.request;
    const envelope_id = api.bank.envelopeIdFromRequest(this.state.request);
    const _requested_type = requested_type.split('_')[1].toUpperCase();
    const _state          = state.split('_')[1].toUpperCase();
    let viewOnBlockchain = (<></>);
    if(tx_id)
      {
        const _href = api.dfuse.getBlockExplorerTxLink(tx_id);
        viewOnBlockchain = (<Button type="link" href={_href} target="_blank" key="view-on-blockchain" icon="cloud" title="View on Blockchain">B-Chain</Button>)
      }
    return (<Descriptions className="headerList" size="small" column={2}>
      <Descriptions.Item  label = " Requested By " > {requested_by.account_name} ({requested_by.email})</ Descriptions.Item >
      <Descriptions.Item  label = " Request type " > <Tag color="#108ee9">{_requested_type}</Tag> </ Descriptions.Item >
      <Descriptions.Item  label = " Created at " >{created_at}</ Descriptions.Item >
      <Descriptions.Item  label = " Amount " >{quantity_txt}</ Descriptions.Item >
      <Descriptions.Item  label = " Associated Documents " >
        <a href="#"><i>nothing yet</i></a>
      </Descriptions.Item>
      <Descriptions.Item  label = " Envelope Id " >{envelope_id}</ Descriptions.Item >
      <Descriptions.Item  label = " Status " >{_state}</ Descriptions.Item >
      <Descriptions.Item  label = " Blockchain Link" >
        {viewOnBlockchain}
      </ Descriptions.Item >
    </Descriptions>);

    // const current_stats = this.currentStats();
    // return (
    //   <Row>
    //     <Description term="Entradas"><Tag color="green">IK$ {current_stats.money_in.toFixed(2)}</Tag></Description>
    //     <Description term="Variacao de caja"><Tag color="red">IK$ {(current_stats.money_in - current_stats.money_out).toFixed(2)}</Tag></Description>
    //     <Description term="Saidas"><Tag color="red">-IK$ {current_stats.money_out.toFixed(2)}</Tag></Description>
    //     <Description term="Lançamentos">{current_stats.count|0}</Description>
    //   </Row>
    // );
  }  
  // ** hack for sublime renderer ** //

  renderExtraContent ()
  {
    return(
      <Row>
        
        <Col xs={24} sm={24}>
          <div className ="textSecondary" > Customer Balance ({globalCfg.currency.symbol}) </div>
          <div className ="heading" >{Number(0).toFixed(2)}</div>
        </Col>
      </Row>
    );
  }

  render() {
    let content = this.renderContent();
    
    return (
      <>
        <PageHeader
          breadcrumb={{ routes }}
          title="Process Request"
          subTitle="Process customer request"
          
        >
         
         <div className="wrap">
            <div className="content padding">{this.renderInfoForRequest()}</div>
            <div className="extraContent">{this.renderExtraContent()}</div>
          </div>

        </PageHeader>

        <div style={{ margin: '24px 0', padding: 0, background: '#fff'}}>
           <Card title="Deposit"  style={ { marginBottom: 24 } } >
          {content}
          </Card>
        </div>
      </>
    );
  }
  
  
}

//
export default Form.create() (withRouter(connect(
    (state)=> ({
        accounts:         accountsRedux.accounts(state),
        actualAccountName:    loginRedux.actualAccountName(state),
        actualRole:       loginRedux.actualRole(state),
        actualPrivateKey: loginRedux.actualPrivateKey(state),
        isLoading:        loginRedux.isLoading(state),
        balance:          balanceRedux.userBalanceFormatted(state),
    }),
    (dispatch)=>({
        
    })
)(processRequest) )
);
