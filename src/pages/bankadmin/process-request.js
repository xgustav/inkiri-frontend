import React, {useState, Component} from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import * as loginRedux from '@app/redux/models/login'
import * as accountsRedux from '@app/redux/models/accounts'
import * as balanceRedux from '@app/redux/models/balance'
import * as apiRedux from '@app/redux/models/api';

import * as api from '@app/services/inkiriApi';
import * as globalCfg from '@app/configs/global';
import * as utils from '@app/utils/utils';

import { withRouter } from "react-router-dom";
import * as routesService from '@app/services/routes';
import * as components_helper from '@app/components/helper';

import { Modal, Card, PageHeader, Tag, Button, Spin } from 'antd';
import { notification, Form, Icon, InputNumber, Input } from 'antd';

import TransactionCard from '@app/components/TransactionCard';

import TxResult from '@app/components/TxResult';
import {RESET_PAGE, RESET_RESULT, DASHBOARD} from '@app/components/TxResult';

import { injectIntl } from "react-intl";
import InjectMessage from "@app/components/intl-messages";
import * as gqlRequestI18nService from '@app/services/inkiriApi/requests-i18n-graphql-helper'

const DEFAULT_RESULT = {
  result:             undefined,
  result_object:      undefined,
  error:              {},
}

const DEFAULT_ATTACHS = {
  attachments:       {
        [globalCfg.api.NOTA_FISCAL]       : undefined,
        [globalCfg.api.BOLETO_PAGAMENTO]  : undefined,
        [globalCfg.api.COMPROBANTE]       : undefined,
      }
}
class processExternal extends Component {
  constructor(props) {
    super(props);
    const request       = (props && props.location && props.location.state && props.location.state.request)? props.location.state.request : undefined;
    const pathname      = utils.getFirstPart(props.location);
    this.state = {
      referrer:        (props && props.location && props.location.state && props.location.state.referrer)? props.location.state.referrer : undefined,
      loading:      false,
      isFetching:   false,
      
      pushingTx:    false,
      
      ...DEFAULT_RESULT,
      
      pathname:      pathname,   
      request:       request,
      
      ...DEFAULT_ATTACHS,
      cancel_reason: ''
    };

    this.renderContent              = this.renderContent.bind(this); 
    this.resetPage                  = this.resetPage.bind(this); 
    this.userResultEvent            = this.userResultEvent.bind(this); 
  }

  componentDidMount(){
    const { match, location, history } = this.props;
    // console.log( 'processRequest::router-params >>' , JSON.stringify(this.props.location.state.request) );
    if(this.props.location && this.props.location.state)
    {
      this.setState({request : this.props.location.state.request
                      , pathname : utils.getFirstPart(this.props.location)
                      , ...DEFAULT_ATTACHS})
    }

  }

  componentDidUpdate(prevProps, prevState) 
  {
    let new_state = {};
    if(prevProps.isFetching!=this.props.isFetching){
      new_state = {...new_state, isFetching:this.props.isFetching}
    }
    if(!utils.arraysEqual(prevProps.getErrors, this.props.getErrors)){
      // const ex = this.props.getLastError;
      // new_state = {...new_state, 
      //     getErrors:     this.props.getErrors, 
      //     result:        ex?'error':undefined, 
      //     error:         ex?JSON.stringify(ex):null}
      // if(ex)
      //   components_helper.notif.exceptionNotification("An error occurred!", ex);
    }
    if(!utils.arraysEqual(prevProps.getResults, this.props.getResults) ){
      const lastResult = this.props.getLastResult;
      // new_state = {...new_state, 
      //   getResults:      this.props.getResults, 
      //   result:          lastResult?'ok':undefined, 
      //   result_object:   lastResult};
      if(lastResult)
      {
        const that = this;
        setTimeout(()=> that.reload() ,100);
        // components_helper.notif.successNotification('Operation completed successfully')
      }
    }


    if(Object.keys(new_state).length>0)      
        this.setState(new_state);
  }

  reload = async () => {
    const that      = this;
    const {request} = this.state;
    this.setState({loading:true});

    try{
      const data = await gqlRequestI18nService.request({id:request._id, account_name:this.props.actualAccountName}, this.props.intl);
      this.setState({request:data, loading:false, ...DEFAULT_ATTACHS})
    }
    catch(e)
    {
      this.setState({loading:false, ...DEFAULT_ATTACHS});
      components_helper.notif.exceptionNotification(this.props.intl.formatMessage({id:'pages.bankadmin.process-external.error_reloading'}), e);
    }
    
    // api.bank.getRequestById(request.id)
    //     .then( (data) => {
    //         that.setState({loading:false, request:data, ...DEFAULT_ATTACHS})
    //       },
    //       (ex) => {
    //         components_helper.notif.exceptionNotification(this.props.intl.formatMessage({id:'pages.bankadmin.process-external.error_reloading'}), ex);
    //         that.setState({loading:false, ...DEFAULT_ATTACHS});
    //         console.log(' ** ERROR @ processRequest', JSON.stringify(ex))
    //       }  
    //     );
  }

  getPropsForUploader(name){
    const filelist = this.state.attachments[name] || [];
    // console.log(' FILELIST OF '+name, JSON.stringify(filelist) )
    return {
      onRemove: file => {
        this.setState(state => {
          const index         = state.attachments[name].indexOf(file);
          const newFileList   = state.attachments[name].slice();
          newFileList.splice(index, 1);
          return {
            attachments: {[name]: newFileList}
          };
        });
      },
      beforeUpload: file => {
        if(this.state.attachments[name] && this.state.attachments[name].length>0)
        {
          components_helper.notif.infoNotification(this.props.intl.formatMessage({id:'pages.bankadmin.process-external.only_one_file'}));
          return false;
        }

        let attachments = this.state.attachments || {};
        attachments[name]= [file];
        this.setState(state => ({
          ...attachments
        }));
        return false;
      },
      fileList: filelist,
      className: filelist.length>0?'icon_color_green':'icon_color_default'
    };
  }
  
  backToDashboard = async () => {
    this.props.history.push({
      pathname: `/${this.props.actualRole}/dashboard`
    })
  }

  // backToReferrer = async () => {
  //   this.props.history.push({
  //     pathname: `/${this.props.actualRole}/external-transfers`
  //   })
  // }

  resetPage(){
    this.setState({...DEFAULT_RESULT, ...DEFAULT_ATTACHS});
  }

  resetResult(){
    this.setState({...DEFAULT_RESULT});
  }

  userResultEvent = (evt_type) => {
    console.log(' ** userResultEvent -> EVT: ', evt_type)
    if(evt_type==DASHBOARD)
      this.backToDashboard();
    if(evt_type==RESET_RESULT)
      this.resetResult();
    if(evt_type==RESET_PAGE)
      this.resetPage();
    
  }

  renderContent() {
    
    if(this.state.result)
    {
      const result_type = this.state.result;
      const title       = null;
      const message     = null;
      const tx_id       = this.state.result_object?this.state.result_object.transaction_id:null;
      const error       = this.state.error
      
      const result = (<TxResult result_type={result_type} title={title} message={message} tx_id={tx_id} error={error} cb={this.userResultEvent}  />);
      return (<div style={{ margin: '0 0px', padding: 24, marginTop: 24}}>
                <div className="ly-main-content content-spacing cards">
                  <section className="mp-box mp-box__shadow money-transfer__box">
                    {result}
                  </section>
                </div>      
              </div>);
    }
    //
    const {request, pushingTx}      = this.state;
    const buttons                   = this.getActionsForRequest();
    const notaUploaderProps         = this.getPropsForUploader(globalCfg.api.NOTA_FISCAL);
    const boletoUploaderProps       = this.getPropsForUploader(globalCfg.api.BOLETO_PAGAMENTO);
    const comprobanteUploaderProps  = this.getPropsForUploader(globalCfg.api.COMPROBANTE);
    const uploader                  = {
                  [globalCfg.api.NOTA_FISCAL] :notaUploaderProps
                  ,[globalCfg.api.BOLETO_PAGAMENTO] :boletoUploaderProps
                  ,[globalCfg.api.COMPROBANTE] :comprobanteUploaderProps };
                   
    return (
      <Spin spinning={pushingTx} delay={500} tip={this.props.intl.formatMessage({id:'pages.bankadmin.process-external.pushing_transaction'})}>
        <TransactionCard 
                request={request} 
                admin={this.props.isAdmin}
                uploader={uploader}
        />
        <div className="c-detail bottom">
          { buttons?buttons.map(button=>button):(<></>)}
        </div>
      </Spin>);
  }
  //
  processRequest(){
    let that = this;  
    that.setState({pushingTx:true});
    const {formatMessage} = this.props.intl;
    Modal.confirm({
      title:   formatMessage({id:'pages.bankadmin.process-external.confirm_process_step'}),
      content: formatMessage({id:'pages.bankadmin.process-external.confirm_process_step_message'}),
      onOk() {
        const {request} = that.state;
        api.bank.processExternal(that.props.actualAccountName, request.id)
        .then( (data) => {
            that.setState({pushingTx:false})
            components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.change'}));
            that.reload();
          },
          (ex) => {
            that.setState({pushingTx:false})
            components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), ex);
            console.log(' ** ERROR @ processRequest', JSON.stringify(ex))
          }  
        );
        
      },
      onCancel() {
        that.setState({pushingTx:false})
      },
    });
    
  }

  getAttach(attach_name){
    const attachments      = this.state.attachments;
    return (attachments[attach_name] && attachments[attach_name].length>0) ? attachments[attach_name][0] : undefined; 
  }

  acceptWithComprobanteRequest(){
    let that = this;  
    // Check Comprobante
    const {formatMessage} = this.props.intl;
    const my_COMPROBANTE   = this.getAttach(globalCfg.api.COMPROBANTE);
    if(!my_COMPROBANTE)
    {

      components_helper.notif.errorNotification(formatMessage({id:'pages.bankadmin.process-external.receipt_attach_required'}), formatMessage({id:'pages.bankadmin.process-external.receipt_attach_required_message'}));
      return;
    }  
    let attachs = {[globalCfg.api.COMPROBANTE]:my_COMPROBANTE};

    const my_NOTA          = this.getAttach(globalCfg.api.NOTA_FISCAL);
    if(my_NOTA)
      attachs[globalCfg.api.NOTA_FISCAL]=my_NOTA;
    // console.log(attachs)
    that.setState({pushingTx:true});
    
    Modal.confirm({
      title:   formatMessage({id:'pages.bankadmin.process-external.confirm_accept_step'}),
      content: formatMessage({id:'pages.bankadmin.process-external.confirm_accept_step_message'}),
      onOk() {
        const {request} = that.state;
        
        const my_COMPROBANTE   = that.getAttach(globalCfg.api.COMPROBANTE);
        api.bank.acceptExternal(that.props.actualAccountName, request.id, attachs)
        .then( (data) => {
            that.setState({pushingTx:false})
            components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.accept'}));
            that.reload();
          },
          (ex) => {
            console.log(' ** ERROR @ acceptWithComprobanteRequest', JSON.stringify(ex));
            that.setState({pushingTx:false})
            components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), ex);
          }  
        );
        
      },
      onCancel() {
        that.setState({pushingTx:false})
        console.log('Cancel');
      },
    });  
  }

  refundRequest(){
    this.doRefund(globalCfg.api.STATE_REFUNDED);  
  }
  
  handleCancelChange = (event) => {
    this.setState({cancel_reason: event.target.value});
    // console.log(event.target.value)
  }

  rejectRequest(){
    const that            = this;
    const {formatMessage} = this.props.intl;
    Modal.confirm({
      title:   formatMessage({id:'pages.bankadmin.process-external.confirm_reject_step'}),
      content: 
        <div>
          <div>{formatMessage({id:'pages.bankadmin.process-external.confirm_reject_step_message'})}</div>
          <Input.TextArea rows="4" onChange={this.handleCancelChange} />
          <div className="hint">{formatMessage({id:'pages.bankadmin.process-external.cancel_reason'})}</div>
        </div>,
      onOk() {
        const {request} = that.state;
        api.bank.rejectExternal(that.props.actualAccountName, request.id, that.state.cancel_reason)
        .then( (data) => {
            that.setState({pushingTx:false})
            components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.reject'}));
            that.reload();
          },
          (ex) => {
            console.log(' ** ERROR @ acceptWithComprobanteRequest', JSON.stringify(ex));
            that.setState({pushingTx:false})
            components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), ex);
          }  
        );
      },
      onCancel() {
        that.setState({pushingTx:false})
        console.log('Cancel');
      },
    });  
    
  }
  
  refundRevertRequest(){
    const that            = this;
    const {formatMessage} = this.props.intl;
    Modal.confirm({
      title:   formatMessage({id:'pages.bankadmin.process-external.confirm_revert_step'}),
      // content: formatMessage({id:'pages.bankadmin.process-external.confirm_revert_step_message'}),
      content:<div>
          <div>{formatMessage({id:'pages.bankadmin.process-external.confirm_revert_step_message'})}</div>
          <Input.TextArea rows="4" onChange={this.handleCancelChange} />
          <div className="hint">{formatMessage({id:'pages.bankadmin.process-external.cancel_reason'})}</div>
        </div>,
      onOk() {
        that.doRefund(globalCfg.api.STATE_REVERTED);  
      },
      onCancel() {
        that.setState({pushingTx:false})
        console.log('Cancel');
      },
    });  
    
  }

  doRefund(new_state){
    
    const that       = this;
    const {request}  = that.state;
    const {formatMessage} = this.props.intl;

    that.setState({pushingTx:true});
    
    const sender      = this.props.actualAccountName;
    const amount      = request.amount;
    const privateKey  = this.props.actualPrivateKey;
    
    // api.refund(sender, privateKey, request.from, amount, request.requestCounterId, new_state)
    //   .then((data) => {
    //   }, (ex1) => {
    // });
    
    api.refund(sender, privateKey, request.from, amount, request.requestCounterId, new_state)
      .then((data) => {
        const send_tx             = data;
        console.log(' processExternal::refund (then#1) >>  ', JSON.stringify(send_tx));
        api.bank.refundExternal(sender, request.id, new_state, send_tx.data.transaction_id, that.state.cancel_reason)
          .then((data2) => {
              // that.clearAttachments();
              that.setState({uploading: false, result:'ok', pushingTx:false, result_object:{transaction_id : send_tx.data.transaction_id, request_id:request.id} });
              that.reload();
              components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.refund'}));
            }, (ex2) => {
              console.log(' processExternal::refund (error#2) >>  ', JSON.stringify(ex2));
              components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.refund.1'}), ex2);              
              that.setState({result:'error', uploading: false, pushingTx:false, error:JSON.stringify(ex2)});
          });
      }, (ex1) => {
        console.log(' processExternal::refund (error#1) >>  ', JSON.stringify(ex1));
        components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.refund.2'}), ex1, null, that.props.intl);
        that.setState({result:'error', uploading: false, pushingTx:false, error:JSON.stringify(ex1)});
      });
  }

  attachNota(){
    
    const {formatMessage} = this.props.intl;
    const my_NOTA_FISCAL  = this.getAttach(globalCfg.api.NOTA_FISCAL);
    if(!my_NOTA_FISCAL)
    {
      components_helper.notif.errorNotification( formatMessage({id:'pages.bankadmin.process-external.invoice_attach_required'}), formatMessage({id:'pages.bankadmin.process-external.invoice_attach_required_message'}));
      return;
    }   
    
    const that = this;  
    that.setState({pushingTx:true});
    const {request} = that.state;
    
    // api.bank.updateProviderPaymentFiles(this.props.actualAccountName ,request.id, request.state, {[globalCfg.api.NOTA_FISCAL]:my_NOTA_FISCAL})
    api.bank.updateExternalFilesAdmin(this.props.actualAccountName ,request.id, request.state, {[globalCfg.api.NOTA_FISCAL]:my_NOTA_FISCAL})
    .then( (data) => {
        that.setState({pushingTx:false})
        components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.invoice_uploaded'}));
        that.reload();
      },
      (ex) => {
        that.setState({pushingTx:false})
        components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), ex);
        console.log(' ** ERROR @ updateRequest', JSON.stringify(ex))
      }  
    );
  }
  
  cancelRequest(){}

  acceptRequest(){
    const that = this;
    that.setState({pushingTx:true});
    const {formatMessage} = this.props.intl;
    Modal.confirm({
      title:   formatMessage({id:'pages.bankadmin.process-external.confirm_accept_step'}),
      content: formatMessage({id:'pages.bankadmin.process-external.confirm_accept_step_message'}),
      onOk() {
        const {request} = that.state;
          
        api.bank.acceptWithdrawRequest(that.props.actualAccountName, request.id)
        .then( (data) => {
            that.setState({pushingTx:false})
            components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.withdraw.accept'}));
            that.reload();
          },
          (ex) => {
            console.log(' ** ERROR @ acceptWithdraw', JSON.stringify(ex));
            that.setState({pushingTx:false})
            components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), ex);
          }  
        );
        
      },
      onCancel() {
        that.setState({pushingTx:false})
        console.log('Cancel');
      },
    });  
  }

  // doRejectAndRefund(){
    
  //   const that            = this;
  //   const {request}       = that.state;
  //   const {formatMessage} = this.props.intl;
  //   that.setState({pushingTx:true});
  //   const sender      = this.props.actualAccountName;
  //   const amount      = request.amount;
  //   const privateKey  = this.props.actualPrivateKey;
    
  //   api.refund(sender, privateKey, request.from, amount, request.requestCounterId, globalCfg.api.STATE_REVERTED)
  //     .then((data) => {
  //       const send_tx             = data;
  //       api.bank.refundRequest(sender, request.id, send_tx.data.transaction_id)
  //         .then((data2) => {
  //             that.setState({uploading: false, result:'ok', pushingTx:false, result_object:{transaction_id : send_tx.data.transaction_id, request_id:request.id} });
  //             that.reload();
  //             components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.refund'}));
  //           }, (ex2) => {
  //             console.log(' processExternal::refund (error#2) >>  ', JSON.stringify(ex2));
  //             components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.refund.1'}), ex2);
  //             that.setState({result:'error', uploading: false, pushingTx:false, error:JSON.stringify(ex2)});
  //         });
  //     }, (ex1) => {
  //       console.log(' processExternal::refund (error#1) >>  ', JSON.stringify(ex1));
  //       components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.refund.2'}), ex1);
  //       that.setState({result:'error', uploading: false, pushingTx:false, error:JSON.stringify(ex1)});
  //     });
  // }

  /*
  * DEPOSIT
  */
  acceptDepositAndIssue(){
    const {id, amount, requested_by, requestCounterId, deposit_currency} = this.state.request;
    const privateKey      = this.props.actualPrivateKey;
    const receiver        = requested_by.account_name;
    const sender          = globalCfg.currency.issuer; //this.props.actualAccountName;
    const admin_name      = this.props.actualAccountName;
    const fiat            = globalCfg.api.fiatSymbolToMemo(deposit_currency)
    // Very important memo structure!!!!!!!!!!!1
    const memo            = `dep|${fiat}|${requestCounterId.toString()}`;
    const that            = this;
    const {formatMessage} = this.props.intl;    
    // const content    = `You will ISSUE ${globalCfg.currency.symbol}${amount} to ${requested_by.account_name}`;

    Modal.confirm({
      title: formatMessage({id:'pages.bankadmin.process-external.confirm_deposit_step'}),
      content: ( <p key="messagio"> { formatMessage({id:'pages.bankadmin.process-external.confirm_deposit_step_message'}, {currency_symbol:globalCfg.currency.symbol, amount:amount, receiver:requested_by.account_name, bold: str => <b key={Math.random()}>{str}</b> })  } </p> ) ,
      onOk() {
      
          that.setState({pushingTx:true});
          
          /*
           api.issueMoney(sender, privateKey, receiver, amount, memo)
            .then(data => {
              if(data && data.data && data.data.transaction_id)
              {
                // updeteo la tx
                api.bank.setDepositOk(admin_name, id, data.data.transaction_id)
                .then( (update_res) => {
                    that.reload();
                    that.setState({result:'ok', pushingTx:false, result_object:data});
                    components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.deposit'}));
                  }, (err) => {
                    that.setState({result:'error', pushingTx:false, error:JSON.stringify(err)});
                    components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), err);
                  }
                )
              }
              else{
                that.setState({result:'error', pushingTx:false, error:'UNKNOWN!'});
                components_helper.notif.errorNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), JSON.stringify(data));
              }
            }, (ex)=>{
              console.log(' processRequest::issue (error#1) >>  ', JSON.stringify(ex));
              that.setState({result:'error', pushingTx:false, error:JSON.stringify(ex)});
              components_helper.notif.exceptionNotification(formatMessage({id:'errors.occurred_title'}), ex);
              
            });
          */
          api.bank.setDepositOk(admin_name, id)
          .then( (update_res) => {
              
              api.issueMoney(sender, privateKey, receiver, amount, memo)
                .then(data => {
                  if(data && data.data && data.data.transaction_id)
                  {
                    that.setState({result:'ok', pushingTx:false, result_object:data});
                    components_helper.notif.successNotification(formatMessage({id:'pages.bankadmin.process-external.success.deposit'})); 
                  }
                  else{
                    that.setState({result:'error', pushingTx:false, error:'UNKNOWN!'});
                    components_helper.notif.errorNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), JSON.stringify(data));
                  }

                  that.reload();
                  
                }, (ex)=>{
                  console.log(' processRequest::issue (error#1) >>  ', JSON.stringify(ex));
                  that.setState({result:'error', pushingTx:false, error:JSON.stringify(ex)});
                  components_helper.notif.exceptionNotification(formatMessage({id:'errors.occurred_title'}), ex, null, that.props.intl);
                  that.reload();
                });
            
            }, (err) => {
              that.setState({result:'error', pushingTx:false, error:JSON.stringify(err)});
              components_helper.notif.exceptionNotification(formatMessage({id:'pages.bankadmin.process-external.error.occurred_title'}), err);
            
            }
          )

        },
      onCancel() {
        that.setState({pushingTx:false})
        console.log('Cancel');
      },
    });
  }
  
  getActionsForRequest(){
    const {request, pushingTx}    = this.state;

    const processButton = (<Button loading={pushingTx} size="large" onClick={() => this.processRequest()} key="processButton" type="primary" title="" >
          <InjectMessage id="pages.bankadmin.process-external.action.process_request" />
        </Button>);
    //
    const acceptWithComprobanteButton = (<Button loading={pushingTx} size="large" onClick={() => this.acceptWithComprobanteRequest()} key="acceptWithComprobanteButton" type="primary" title="" >
          <InjectMessage id="pages.bankadmin.process-external.action.accept" />
        </Button>);
    //
    const cancelButton                = (<Button loading={pushingTx} size="large" onClick={() => this.cancelRequest()} key="cancelButton" className="danger_color" style={{marginLeft:16}} type="link" >
          <InjectMessage id="pages.bankadmin.process-external.action.cancel" />
        </Button>);
    //
    // const rejectButton                = (<Button loading={pushingTx} size="large" onClick={() => this.rejectRequest()} key="rejectButton" className="danger_color" style={{marginLeft:16}} type="link" >
    //       <InjectMessage id="pages.bankadmin.process-external.action.reject_and_refund" />
    //     </Button>);
    const rejectButton                = (<Button loading={pushingTx} size="large" onClick={() => this.rejectRequest()} key="rejectButton" className="danger_color" style={{marginLeft:16}} type="link" >
          <InjectMessage id="pages.bankadmin.process-external.action.reject" />
        </Button>);
    //
    const refundRevertButton                = (<Button loading={pushingTx} size="large" onClick={() => this.refundRevertRequest()} key="revertButton" className="danger_color" style={{marginLeft:16}} type="link" >
          <InjectMessage id="pages.bankadmin.process-external.action.revert_and_refund" />
        </Button>);
    //
    const attachNotaButton            = (<Button loading={pushingTx} size="large" onClick={() => this.attachNota()} key="updateButton" type="primary" style={{marginLeft:16}} type="primary" >
          <InjectMessage id="pages.bankadmin.process-external.action.upload_nota" />
        </Button>);
    //
    const attachFiles                 = (<Button loading={pushingTx} size="large" onClick={() => this.attachFiles()} key="attachButton" type="primary" style={{marginLeft:16}} type="primary" >
          <InjectMessage id="pages.bankadmin.process-external.action.attach_files" />
        </Button>);
    //
    const refundButton                = (<Button loading={pushingTx} size="large" onClick={() => this.refundRequest()} key="refundButton" type="primary" style={{marginLeft:16}} type="primary" >
          <InjectMessage id="pages.bankadmin.process-external.action.refund" />
        </Button>);
    //
    const acceptAndIssueButton        = (<Button loading={pushingTx} size="large" onClick={() => this.acceptDepositAndIssue()} key="acceptAndIssueButton" type="primary" style={{marginLeft:16}} type="primary" >
          <InjectMessage id="pages.bankadmin.process-external.action.accept_and_issue" />
        </Button>);
    //
    const acceptButton                = (<Button loading={pushingTx} size="large" onClick={() => this.acceptRequest()} key="acceptButton" style={{marginLeft:16}} type="primary" >
          <InjectMessage id="pages.bankadmin.process-external.action.accept" />
        </Button>);
    //
    // const rejectRefundButton        = (<Button loading={pushingTx} size="large" onClick={() => this.doRejectAndRefun(d)} key="rejectRefundButton" className="danger_color" style={{marginLeft:16}} type="link" >
    //       <InjectMessage id="pages.bankadmin.process-external.action.reject_and_refund" />
    //     </Button>);
    //
    let buttons = []
    switch (request.state){
      case globalCfg.api.STATE_REQUESTED:
        buttons.push(rejectButton);
        if(globalCfg.api.isDeposit(request))
        {
          return [acceptAndIssueButton, ...buttons];
        }

        if(globalCfg.api.requiresReception(request))
        {
          if(!request.attach_nota_fiscal_id)
            buttons.push(attachNotaButton);
          return buttons;
        }

        // fucking error!
        return buttons;
        
        break;

      case globalCfg.api.STATE_RECEIVED:
        if(globalCfg.api.requiresAttach(request) && !request.attach_nota_fiscal_id)
        {
          buttons.push(attachNotaButton);
        };

        if(globalCfg.api.isWithdraw(request))
          return [acceptButton, ...buttons, refundRevertButton];

        return [processButton, ...buttons, refundRevertButton];
        break;
      
      case globalCfg.api.STATE_PROCESSING:
        if(globalCfg.api.isDeposit(request))
        {
          return[];
        }

        // if(globalCfg.api.requiresAttach(request) && !request.attach_nota_fiscal_id)
        //   return [acceptWithComprobanteButton, attachNotaButton, refundRevertButton];
        return [acceptWithComprobanteButton, refundRevertButton];

      break;

      case globalCfg.api.STATE_REJECTED:
        return [];
      break;
      case globalCfg.api.STATE_REVERTED:
        return [];
        break;
      case globalCfg.api.STATE_ACCEPTED:
        if(globalCfg.api.requiresAttach(request) && !request.attach_nota_fiscal_id)
          return [attachNotaButton];
        return [];
      break;
      case globalCfg.api.STATE_ERROR:
        return [];
      break;
      case globalCfg.api.STATE_REFUNDED:
        if(!request.refund_tx_id)
          return [refundButton];
      break;
      case globalCfg.api.STATE_CANCELED:
        return [];
      break;
    }
  }


  render() {
    const go_back = (this.state.referrer)
      ? {onBack:() => {this.props.history.push({pathname: this.state.referrer, state: {keep_search: true}}); } }
      : {};

    let content     = this.renderContent();
    const routes    = routesService.breadcrumbForPaths([this.state.referrer, this.props.location.pathname]);
    return (
      <>
        <PageHeader
          {...go_back}
          breadcrumb={{ routes:routes, itemRender:components_helper.itemRender }}
          title={<InjectMessage id="pages.bankadmin.process-external.title" />}>
        </PageHeader>

        {content}

      </>
    );
  }
  
}

//
export default Form.create() (withRouter(connect(
    (state)=> ({
        accounts:           accountsRedux.accounts(state),
        actualAccountName:  loginRedux.actualAccountName(state),
        actualRole:         loginRedux.actualRole(state),
        actualPrivateKey:   loginRedux.actualPrivateKey(state),
        isLoading:          loginRedux.isLoading(state),
        balance:            balanceRedux.userBalanceFormatted(state),
        isAdmin:            loginRedux.isAdmin(state),
        isBusiness:         loginRedux.isBusiness(state),


        isFetching:       apiRedux.isFetching(state),
        getErrors:        apiRedux.getErrors(state),
        getLastError:     apiRedux.getLastError(state),
        getResults:       apiRedux.getResults(state),
        getLastResult:    apiRedux.getLastResult(state),
    }),
    (dispatch)=>({
        callAPI:          bindActionCreators(apiRedux.callAPI, dispatch),
        callAPIEx:        bindActionCreators(apiRedux.callAPIEx, dispatch),
        clearAll:         bindActionCreators(apiRedux.clearAll, dispatch),

        // isAdmin:    bindActionCreators(loginRedux.isAdmin, dispatch),
        // isBusiness: bindActionCreators(loginRedux.isBusiness, dispatch)
    })
)( injectIntl(processExternal)) )
);
