import React, {useState, Component} from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';

import * as menuRedux from '@app/redux/models/menu';
import * as loginRedux from '@app/redux/models/login'

import * as globalCfg from '@app/configs/global';

import * as api from '@app/services/inkiriApi';
import { Route, Redirect, withRouter } from "react-router-dom";
import * as routesService from '@app/services/routes';
import * as components_helper from '@app/components/helper';

import * as columns_helper from '@app/components/TransactionTable/columns';
import TableStats from '@app/components/TransactionTable/stats'; 
import * as stats_helper from '@app/components/TransactionTable/stats';

import { Card, PageHeader, Tag, Tabs, Button, Form, Input, Icon} from 'antd';
import { Modal, notification, Table, Divider, Spin } from 'antd';

import AddMemberForm from '@app/components/Form/add_member';
import {DISPLAY_ALL_TXS} from '@app/components/TransactionTable';

import * as utils from '@app/utils/utils';

import _ from 'lodash';

const routes = routesService.breadcrumbForFile('accounts');

const STATE_LIST_MEMBERS = 'state_list_members';
const STATE_NEW_MEMBER   = 'state_new_member';
const STATE_EDIT_MEMBER  = 'state_edit_member';

class Crew extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routes :            routesService.breadcrumbForPaths(props.location.pathname),
      loading:            false,
      pushingTx:          false,
      team:               null,
      job_positions:      [],
      active_view:        STATE_LIST_MEMBERS,
      active_view_object: null,
    };

    this.loadTeam                   = this.loadTeam.bind(this);  
    this.loadJobPositions           = this.loadJobPositions.bind(this);  
    this.openNotificationWithIcon   = this.openNotificationWithIcon.bind(this); 
    this.onMembersListCallback      = this.onMembersListCallback.bind(this);
    this.getColumns                 = this.getColumns.bind(this);
    this.onNewMember                = this.onNewMember.bind(this); 
    this.memberFormCallback         = this.memberFormCallback.bind(this);
  }

  getColumns(){
    return columns_helper.columnsForCrew(this.onMembersListCallback, this.state.job_positions);
  }
  
  componentDidMount(){
    this.loadTeam();  
    this.loadJobPositions();
  } 

  onNewMember = () => {
    
    // this.openNotificationWithIcon("warning", "Not implemented yet");    
    this.setState({active_view:STATE_NEW_MEMBER})
  }

  onEditMember = (member) => {
    
    // this.openNotificationWithIcon("warning", "Not implemented yet");    
    this.setState({active_view: STATE_EDIT_MEMBER, active_view_object:member})
  }

  onRemoveMember = (member) => {
    const that           = this;
    Modal.confirm({
      title: 'Confirm delete member.',
      content: (<p>You are about to remove <b>{member.member.account_name}</b> from the crew. Continue or cancel.</p>),
      onOk() {
        const {team}         = that.state;
        if(!team)
        {
          that.setState({pushingTx:false})
          that.openNotificationWithIcon('error', 'There was an error. We cant get the team id. Please reload page.');
          return;
        }
        const teamId         = team?team.id:null;
        const account_name   = that.props.actualAccountName;
        const members = team.members.filter(item => item._id!=member._id)
        that.setState({pushingTx:true})
        api.bank.createOrUpdateTeam(teamId, account_name, members)
          .then((res)=>{
            that.openNotificationWithIcon("success", "Member removed from team successfully!")    
            that.loadTeam();
            that.resetPage(STATE_LIST_MEMBERS);
          }, (err)=>{
            console.log(' >> createOrUpdateTeam >> ', JSON.stringify(err));
            that.openNotificationWithIcon("error", "An error occurred", JSON.stringify(err))    
            that.setState({pushingTx:false});
          })
     
      },
      onCancel() {
        
      },
    });

  }

  onMembersListCallback(member, event){

    switch(event){
      case columns_helper.events.VIEW:
        console.log(event)
        break;
      case columns_helper.events.REMOVE:
        this.onRemoveMember(member);
        break;
      case columns_helper.events.EDIT:
        // console.log(event)
        this.onEditMember(member);
        break;
    }
    return;

  }

  memberFormCallback = async (error, cancel, values) => {
    // console.log(` ## memberFormCallback(error:${error}, cancel:${cancel}, values:${values})`)
    // console.log(' memberFormCallback:', JSON.stringify(values))
    
    if(cancel)
    {
      this.setState({active_view:STATE_LIST_MEMBERS})
      return;
    }
    if(error)
    {
      return;
    }

    // {"position":"job_position_tronco","member":"corpodoyoga1","input_amount":{"value":"15000"}}

    const that           = this;
    const {team}         = this.state;
    const teamId         = team?team.id:null;
    const account_name   = this.props.actualAccountName;
    this.setState({pushingTx:true})
    let member_profile   = null;
    
    // New member!
    if(!values._id)
      try{
        member_profile = await api.bank.getProfile(values.member);
      }catch(e){
        this.setState({pushingTx:false})
        this.openNotificationWithIcon('error', 'Cant retrieve new member profile!');
        return;
      }         


    const new_member = {
      _id:        member_profile ? undefined : values._id,
      member:     member_profile ? member_profile._id : values.member,
      position:   values.position,
      wage:       values.input_amount.value
    }
    

    const members        = team
      ? [  ...(team.members.filter(member=>member._id!=new_member._id))
                .map((member) => {return {_id        : member._id
                                          , member   : member.member._id
                                          , position : member.position
                                          , wage     : member.wage};
                                        })
           , new_member]
      : [new_member];

    // console.log(' -> values -> ', JSON.stringify(values));
    // console.log(' -> members -> ', JSON.stringify(members));
    // return;
    api.bank.createOrUpdateTeam(teamId, account_name, members)
      .then((res)=>{
        that.openNotificationWithIcon("success", "Member saved to team successfully!")    
        that.loadTeam();
        that.resetPage(STATE_LIST_MEMBERS);
      }, (err)=>{
        console.log(' >> createOrUpdateTeam >> ', JSON.stringify(err));
        that.openNotificationWithIcon("error", "An error occurred", JSON.stringify(err))    
        that.setState({pushingTx:false});
      })
 

  }

  resetPage(active_view){
    let my_active_view = active_view?active_view:this.state.active_view;
    this.setState({ 
        active_view:   my_active_view
        , pushingTx:   false
      });    
  }


  loadJobPositions = async () => {
    this.setState({loading:true});

    let data = null;

    try {
      data = await api.bank.getJobPositions();
    } catch (e) {
      this.openNotificationWithIcon("error", "Error retrieveing Team", JSON.stringify(e));
      this.setState({ loading:false})
      return;
    }
    // console.log(data.job_positions)
    this.setState({ job_positions: data.job_positions, loading:false})
  }

  loadTeam = async () => {

    this.setState({loading:true});

    let team = null;

    try {
      team = await api.bank.getTeam(this.props.actualAccountName);
    } catch (e) {
      this.openNotificationWithIcon("error", "Error retrieveing Team", JSON.stringify(e));
      this.setState({ loading:false})
      return;
    } 
    // console.log(JSON.stringify(team));
    this.setState({ team: team, loading:false})
        
  }


  openNotificationWithIcon(type, title, message) {
    notification[type]({
      message: title,
      description:message,
    });
  }
  // Component Events
  
  
  render() {
    const content               = this.renderContent();
    
    
    const {routes, active_view}  = this.state;
    const button = (active_view==STATE_LIST_MEMBERS)
      ?(<Button size="small" type="primary" key="_new_profile" icon="plus" onClick={()=>{this.onNewMember()}}> Member</Button>)
        :(null);
    return (
      <>
        <PageHeader
          breadcrumb={{ routes:routes, itemRender:components_helper.itemRender }}
          extra={[
            button,
          ]}
          title="Crew"
        >
          
        </PageHeader>
        
          {content}
        
      </>
    );
  }
  //
  renderContent(){
    const {team, loading, active_view, active_view_object, job_positions } = this.state;

    
    if(active_view==STATE_EDIT_MEMBER)
    {
      //
      return (<div style={{ margin: '0 0px', padding: 24, marginTop: 24}}>
          <div className="ly-main-content content-spacing cards">
            <section className="mp-box mp-box__shadow money-transfer__box">
              <Spin spinning={this.state.pushingTx} delay={500} tip="Pushing transaction...">
                <AddMemberForm key="add_member_form" callback={this.memberFormCallback} job_positions={job_positions} member={active_view_object}/>    
              </Spin>
            </section>
          </div>      
        </div>);
    }

    if(active_view==STATE_NEW_MEMBER)
    {
      //
      return (<div style={{ margin: '0 0px', padding: 24, marginTop: 24}}>
          <div className="ly-main-content content-spacing cards">
            <section className="mp-box mp-box__shadow money-transfer__box">
              <Spin spinning={this.state.pushingTx} delay={500} tip="Pushing transaction...">
                <AddMemberForm key="add_member_form" callback={this.memberFormCallback} job_positions={job_positions}/>    
              </Spin>
            </section>
          </div>      
        </div>);
    }


    //if(active_view==STATE_LIST_MEMBERS)  
    const members         = team?team.members||[]:[];
    return (
      <Card
          key="card_table_all_requests"
          className="styles listCard"
          bordered={false}
          style={{ marginTop: 24 }}
          headStyle={{display:'none'}}
        >
          <div style={{ background: '#fff', minHeight: 360, marginTop: 24}}>
            <Table
                key="team_members" 
                rowKey={record => record.member.id} 
                loading={loading} 
                columns={this.getColumns()} 
                dataSource={members} 
                scroll={{ x: 700 }}
                />
          </div>
        </Card>
      )
  }

}
//
export default  (withRouter(connect(
    (state)=> ({
        actualAccountName:    loginRedux.actualAccountName(state),
        actualRoleId:     loginRedux.actualRoleId(state),
        actualRole:       loginRedux.actualRole(state),
    }),
    (dispatch)=>({
        setLastRootMenuFullpath: bindActionCreators(menuRedux.setLastRootMenuFullpath , dispatch)
    })
)(Crew))
);