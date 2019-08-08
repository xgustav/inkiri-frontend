import React, {Component} from 'react'
import { connect } from 'react-redux'
import * as balanceRedux from '@app/redux/models/balance'
import { bindActionCreators } from 'redux';
import { Spin } from 'antd';


class UserBalance extends Component  {
    componentWillMount() {
        const {userId, loadBalance} = this.props;
        loadBalance(userId)
    }

    componentWillReceiveProps(newProps) {
        const {userId, loadBalance} = this.props;
        if(newProps.userId !== userId) {
            loadBalance(newProps.userId)
        }
    }
    
    render() {
        const {userId, balance, loading} = this.props;
        return (
        <>
            {
                loading? <Spin size={'small'} />: balance(userId)
            }
        </>
        )
    }
}

export default connect(
    (state)=> ({
        balance:   balanceRedux.userBalance(state),
        loading:   balanceRedux.isLoading(state),
    }),
    (dispatch) => ({
        loadBalance: bindActionCreators(balanceRedux.loadBalance, dispatch)
    })
)(UserBalance)