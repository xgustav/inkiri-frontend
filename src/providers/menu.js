import React, {useEffect} from 'react'
import { connect } from 'react-redux'
//import { getMenuItems, getMenu,  } from '@app/redux/models/menu'
import * as menuRedux from '@app/redux/models/menu'
import * as loginRedux from '@app/redux/models/login'

import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';

import { getPath } from '@app/configs/routes'
// import { getRoutesByRole } from '@app/services/routes'

const  { SubMenu } = Menu;

const renderItem = (item) => {
    // console.log(item.key , item.items)
    if(item.items) {
        return (
        <SubMenu title={item.title} key={item.key}>
            { item.items.map(renderItem) }
        </SubMenu>
        );
    } else {
        return  (
        <Menu.Item key={item.key}>
            <Link to={getPath(item.path || item.key)}>
                { item.icon? <Icon type={item.icon} />: false }
                <span>{item.title}</span>
            </Link>
        </Menu.Item>
        );
    }
}

export const MenuByRole = ({items = [], getMenu, actualAccount, actualRole }) => {
        useEffect(()=>{
            getMenu(actualAccount, actualRole)
        })
        //
        return (
                <Menu
                    defaultSelectedKeys={['dashboard']}
                    defaultOpenKeys={['sub1']}
                    mode="inline"
                    theme="light"
                >
                    { items.map(renderItem) }
                </Menu>
        )
};

export default connect(
    state => ({
        items:             menuRedux.getMenuItems(state),
        actualAccount:     loginRedux.actualAccount(state),
        actualRole:        loginRedux.actualRole(state),
    }),
    dispatch => ({
        getMenu:           bindActionCreators( menuRedux.getMenu, dispatch)
    })
)(MenuByRole)
