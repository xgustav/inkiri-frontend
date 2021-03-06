import React, {Component} from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import * as apiRedux from '@app/redux/models/api';
import * as menuRedux from '@app/redux/models/menu';
import * as loginRedux from '@app/redux/models/login'
import * as balanceRedux from '@app/redux/models/balance';
import * as graphqlRedux from '@app/redux/models/graphql'

import * as globalCfg from '@app/configs/global';

import * as api from '@app/services/inkiriApi';
import { withRouter } from "react-router-dom";
import * as routesService from '@app/services/routes';
import * as components_helper from '@app/components/helper';

import * as columns_helper from '@app/components/TransactionTable/columns';

import { Card, PageHeader, Button, Table, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import SalaryForm from '@app/components/Form/salary';
import * as form_helper from '@app/components/Form/form_helper';

import TxResult from '@app/components/TxResult';
import {RESET_PAGE, RESET_RESULT, DASHBOARD} from '@app/components/TxResult';

import * as utils from '@app/utils/utils';

import EditableCell , {EditableFormRow } from '@app/components/TransactionTable/EditableTableRow';

import { injectIntl } from "react-intl";

const STATE_LIST_MEMBERS = 'state_list_members';
const STATE_NEW_PAYMENT  = 'state_new_payment';

const DEFAULT_RESULT = {
  result:             undefined,
  result_object:      undefined,
  error:              {},
}

class Salaries extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routes :            routesService.breadcrumbForPaths(props.location.pathname),
      loading:            false,
      isFetching:         false,
     
      dataSource:         [],
      removed:            [],

      // team:               null,
      // job_positions:      null,
      team:               props.team,
      job_positions:      props.jobPositions,

      ...DEFAULT_RESULT,

      active_view:        STATE_LIST_MEMBERS,
    };

    this.loadTeam                   = this.loadTeam.bind(this);  
    this.getColumns                 = this.getColumns.bind(this);
    this.onRestoreList              = this.onRestoreList.bind(this); 
    this.removeCallback             = this.removeCallback.bind(this); 
    this.handleNewPayment           = this.handleNewPayment.bind(this); 
    this.salaryFormCallback         = this.salaryFormCallback.bind(this); 
  }

  handleNewPayment = () => {
    this.setState({active_view:STATE_NEW_PAYMENT})
  }

  getColumns(){
    return columns_helper.columnsForSalaries(null, this.removeCallback, this.state.job_positions);
  }
  
  componentDidMount = async () => {
    const {team, job_positions} = this.state;
    if(!team)    
    {
      await this.loadTeam();
    }

    if(utils.objectNullOrEmpty(job_positions))
    {
      await this.props.loadConfig();
    }

    if(team && !utils.objectNullOrEmpty(job_positions))
      this.rebuildDataSourceAndSet();
  } 

  componentDidUpdate(prevProps, prevState) 
  {
    let new_state = {};
    let ok = false;
    if(prevProps.isFetching!=this.props.isFetching){
      new_state = {...new_state, isFetching:this.props.isFetching}
    }
    if(!utils.arraysEqual(prevProps.getResults, this.props.getResults) ){
      const ex = this.props.getLastError;
      new_state = {...new_state, 
          getErrors:     this.props.getErrors, 
          result:        ex?'error':undefined, 
          error:         ex?JSON.stringify(ex):null}
      if(ex)
        components_helper.notif.exceptionNotification(this.props.intl.formatMessage({id:'errors.occurred_title'}), ex);
    }
    
    if(!utils.arraysEqual(prevProps.getResults, this.props.getResults) ){
      const lastResult = this.props.getLastResult;
      new_state = {...new_state, 
        getResults:      this.props.getResults, 
        result:          lastResult?'ok':undefined, 
        result_object:   lastResult};
      if(lastResult)
      {
        ok = true;
        components_helper.notif.successNotification(this.props.intl.formatMessage({id:'success.oper_completed_succ'}))
      }
    }

    if(!utils.objectsEqual(prevProps.team, this.props.team) ){
      new_state = {...new_state, team:this.props.team};
    }
    if(!utils.objectsEqual(prevProps.jobPositions, this.props.jobPositions) ){
      new_state = {...new_state, job_positions:this.props.jobPositions};
    }
    
    const keys = Object.keys(new_state);
    if(keys.length>0)      
        this.setState(new_state, () => {
            if(ok || keys.includes('team') || keys.includes('job_positions') )
              this.rebuildDataSourceAndSet();
        });
  }

  onRestoreList = () => {
    
    const dataSource = [...this.state.dataSource, ...this.state.removed];
    const removed    = [];
    this.setState({ dataSource: dataSource, removed: removed});
  }

  removeCallback = record => {
    const dataSource = [...this.state.dataSource];
    const removed    = [...this.state.removed, record];
    this.setState({ dataSource: dataSource.filter(item => item._id !== record._id), removed: removed});
  };

  salaryFormCallback = async (error, cancel, values) => {
    
    if(cancel)
    {
      this.setState({active_view:STATE_LIST_MEMBERS})
      return;
    }
    if(error)
    {
      return;
    }

    const {dataSource} = this.state;
    const total        = dataSource.reduce((acc, member) => acc + Number(member.current_wage), 0);
    if(parseFloat(total)>parseFloat(this.props.balance))
    {
      const balance_txt = globalCfg.currency.toCurrencyString(this.props.balance);
      const err_msg     = this.props.intl.formatMessage({id:'pages.common.salaries.total_payment_exceeds_balance'}, {balance:balance_txt})
      components_helper.notif.errorNotification(err_msg, total.toString());
      return;
    }

    const that             =  this;
    const sender_priv      = this.props.actualPrivateKey;
    const sender_account   = this.props.actualAccountName;
    
    const {description, worked_month} = values;
    const to_amount_array = dataSource.map(item => { return{ 
                                                                account_name: item.member.account_name
                                                                , amount:     item.current_wage }});
    
    // console.log(sender_account, sender_priv, to_amount_array, description, worked_month.format(form_helper.MONTH_FORMAT));

    that.props.callAPI('paySalaries', [sender_account, sender_priv, to_amount_array, description, worked_month.format(form_helper.MONTH_FORMAT)])

  }


  backToDashboard = async () => {
    const dashboard = (this.props.actualRole=='business')?'extrato':'dashboard';
    this.props.history.push({
      pathname: `/${this.props.actualRole}/${dashboard}`
    })
  }

  resetResult(){
    this.setState({...DEFAULT_RESULT});
    // reset Errors and results
    this.props.clearAll();
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

  resetPage(active_view){
    let my_active_view = active_view?active_view:STATE_LIST_MEMBERS;
    this.setState({ 
        active_view:   my_active_view
        , isFetching:   false
        , ...DEFAULT_RESULT
      });  
    // reset Errors and results
    this.props.clearAll();  
  }

  loadTeam = async () =>{
    if(!this.props.actualAccountName || !this.props.actualRoleId)
    {
      components_helper.notif.warningNotification(this.state.intl.verify_credentials);
      return;
    }
    this.props.loadData(this.props.actualAccountName, this.props.actualRoleId)
  }

  rebuildDataSourceAndSet = () =>{
    const dataSource = this.rebuildDataSource();
    this.setState({ dataSource:  dataSource}) 
  }

  rebuildDataSource = () =>{
    const {job_positions, team} = this.state;
    let dataSource = [];
    if(team && team.members)
    {
      dataSource = team.members.map(member=> { 
        const _position = 
          job_positions
          ? this.props.intl.formatMessage({id:'pages.common.salaries.member_salary_description'},{position: job_positions.filter(pos=>pos.key==member.position)[0].value }) 
          : member.position;  
        return {...member
            , current_wage:   member.wage
            , current_reason: _position }
      });
    }
    return dataSource;
  }
  
  //

  handleSave = row => {
    // console.log(row)
    if(isNaN(row.current_wage))
      row.current_wage=row.wage;
    if(row.current_reason)
      row.current_reason=utils.firsts(row.current_reason, 30, false);
    const newData = [...this.state.dataSource];

    const index = newData.findIndex(item => row._id === item._id);
    // console.log('index:', index)
    
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    // console.log(newData)
    this.setState({ dataSource: newData });
  };


  
  renderContent(){
    const {active_view, job_positions, dataSource, result, isFetching } = this.state;

    if(result)
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
    const pushing_transaction   = this.props.intl.formatMessage({id:'pages.common.salaries.pushing_transaction'});
    //
    if(active_view==STATE_NEW_PAYMENT)
    {
      console.log(dataSource);
      return (<div style={{ margin: '0 0px', padding: 24, marginTop: 24}}>
          <div className="ly-main-content content-spacing cards">
            <section className="mp-box mp-box__shadow money-transfer__box">
              <Spin spinning={isFetching} delay={500} tip={pushing_transaction}>
                <SalaryForm key="salary_payment_form" callback={this.salaryFormCallback} job_positions={job_positions} members={dataSource}/>    
              </Spin>
            </section>
          </div>      
        </div>);
    }

    return this.renderTable();
  }

  //
  renderTable(){
    const {team, loading, dataSource} = this.state;
    const components       = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };
    const columns          = this.getColumns().map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });

    const pay_salaries               = this.props.intl.formatMessage({id:'pages.common.salaries.confirmation_action_title'});
    const new_salaries_payment_text  = this.props.intl.formatMessage({id:'pages.common.salaries.new_salaries_payment_text'});
    const total_members              = dataSource?dataSource.length:0;
    return (
      <Card
          title={pay_salaries}
          key="card_table_all_requests"
          className="styles listCard"
          bordered={false}
          style={{ marginTop: 24 }}
          // headStyle={{display:'none'}}
          actions={[
            <Button onClick={this.handleNewPayment} disabled={loading||(!dataSource||dataSource.length==0)} type="primary"> <FontAwesomeIcon icon="money-check-alt" size="lg" color="white"/>&nbsp;&nbsp;{new_salaries_payment_text} </Button> 
          ]}
        >
          <div style={{ background: '#fff'}}>
            <Table
                key="team_members" 
                rowKey={record => record._id} 
                loading={loading} 
                columns={columns}
                components={components} 
                dataSource={dataSource}
                pagination={{pageSize:total_members, total:total_members}}  
                scroll={{ x: 700 }}
                rowClassName={() => 'editable-row'}
                />
          </div>
        </Card>
      );
  }
  //

  render() {
    const {routes, active_view, removed}  = this.state;
    const content               = this.renderContent(); 
    const restore_members_text = this.props.intl.formatMessage({id:'pages.common.salaries.action.restore_members_text'});
    const page_title           = this.props.intl.formatMessage({id:'pages.common.salaries.title'});
    const button               = (active_view == STATE_LIST_MEMBERS)?
      (<Button size="small" type="primary" key="_redo" icon="redo" onClick={()=>{this.onRestoreList()}}> {restore_members_text}</Button>)
      :(null);
    //
    return (
      <>
        <PageHeader
          breadcrumb={{ routes:routes, itemRender:components_helper.itemRender }}
          extra={[
            button,
          ]}
          title={page_title}
        >
          
        </PageHeader>
        
          {content}
        
      </>
    );
  }
  //

}
//
export default  (withRouter(connect(
    (state)=> ({
        actualAccountName:    loginRedux.actualAccountName(state),
        actualPrivateKey:     loginRedux.actualPrivateKey(state),
        actualRoleId:         loginRedux.actualRoleId(state),
        actualRole:           loginRedux.actualRole(state),
        balance:              balanceRedux.userBalance(state),
        jobPositions:         graphqlRedux.jobPositions(state),
        team:                 graphqlRedux.team(state),

        isFetching:           apiRedux.isFetching(state),
        getErrors:            apiRedux.getErrors(state),
        getLastError:         apiRedux.getLastError(state),
        getResults:           apiRedux.getResults(state),
        getLastResult:        apiRedux.getLastResult(state)
    }),
    (dispatch)=>({
        callAPI:     bindActionCreators(apiRedux.callAPI, dispatch),
        clearAll:    bindActionCreators(apiRedux.clearAll, dispatch),

        loadConfig:  bindActionCreators(graphqlRedux.loadConfig, dispatch),
        loadData:    bindActionCreators(graphqlRedux.loadData, dispatch),

        setLastRootMenuFullpath: bindActionCreators(menuRedux.setLastRootMenuFullpath , dispatch),
        loadBalance:             bindActionCreators(balanceRedux.loadBalance, dispatch)
    })
)(injectIntl(Salaries)))
);