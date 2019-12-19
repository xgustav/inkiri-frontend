import React, {Component} from 'react'
import { connect } from 'react-redux'
import * as balanceRedux from '@app/redux/models/balance'
import { bindActionCreators } from 'redux';
import { Spin, Button } from 'antd';
import * as globalCfg from '@app/configs/global';

class UserBalance extends Component  {
    
    constructor(props) {
        super(props);
        this.state = {
          balance         : props.balance,
          showCurrency    : props.showCurrency||false     
        }
      }

    componentDidMount() {
        // const {userId, loadBalance} = this.props;
        // // console.log(' >> userBalance::componentDidMount userId: ', userId)
        // loadBalance(userId);
        this.reloadBalance();
    }

    componentDidUpdate(prevProps, prevState) 
    {
        const {userId, balance, loadBalance} = this.props;
        if(prevProps.userId !== userId) {
            loadBalance(userId)
        }
        if(prevProps.balance !== balance) {
          this.setState({balance:balance})
        }
    }

    reloadBalance = async() =>{
      const {userId, loadBalance} = this.props;
      loadBalance(userId);
    }
    // componentWillReceiveProps(newProps) {
    //     const {userId, loadBalance} = this.props;
    //     if(newProps.userId !== userId) {
    //         loadBalance(newProps.userId)
    //     }
    // }
    
    render() {
        const {userId, loading}         = this.props;
        const {balance, showCurrency}   = this.state;
        const currency                  = showCurrency
            ?(<span className="menu_balance_currency">{globalCfg.currency.symbol}&nbsp;</span>)
            :(null);
        // console.log(' >> userBalance::render userID: ', userId, ' | balance: ', balance)
        return (
        <>
            {
                loading? <Spin size={'small'} />: <Button type="link" onClick={() => {this.reloadBalance()}}>{currency}<b>{balance}</b></Button>
            }
        </>
        )
    }
}

export default connect(
    (state)=> ({
        balance:   balanceRedux.userBalanceNoOftFormatted(state),
        loading:   balanceRedux.isLoading(state),
    }),
    (dispatch) => ({
        loadBalance: bindActionCreators(balanceRedux.loadBalance, dispatch)
    })
)(UserBalance)