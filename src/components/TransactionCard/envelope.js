import React from 'react'
import { connect } from 'react-redux'
import * as globalCfg from '@app/configs/global';
import * as request_helper from '@app/components/TransactionCard/helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import InjectMessage from "@app/components/intl-messages";

const TransactionEnvelope = ({request}) => {
    
    if(!request)
        return (null);
    if(!globalCfg.api.isDeposit(request))
        return (null);

    const envelope_id = request_helper.envelopeIdFromRequest(request);

    return(
      <div className="ui-list">
        <ul className="ui-list__content">
            <li className="ui-row ui-info-row ui-info-row--medium ui-info-row">
                <div className="ui-row__col ui-row__col--heading">
                    <div className="ui-avatar">
                      <div className="ui-avatar__content ui-avatar__content--icon">
                        <FontAwesomeIcon icon="envelope" size="lg" color="black"/>
                      </div>
                    </div>
                </div>
                <div className="ui-row__col ui-row__col--content">
                    <div className="ui-info-row__content">
                        <div className="ui-info-row__title"><InjectMessage id="components.TransactionCard.envelope.envelope_description" />: <b>{envelope_id}</b></div>
                    </div>
                </div>
            </li>
        </ul>
      </div>
    )
    
}

export default connect(
    (state)=> ({
        // allAccounts:     loginRedux.allAccounts(state),
        // actualAccountName:   loginRedux.actualAccountName(state),
        // currentAccount:  loginRedux.currentAccount(state),
        // isLoading:       loginRedux.isLoading(state)
    })
)(TransactionEnvelope)