import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Tabs } from 'antd';
import { CyclingAeth, HistoryTable, Icon, PieChart, TransferForm, TransformForm } from '../';
import * as actionTypes from '../../constants/action-types';
import { showNotification, toggleAethWallet } from '../../local-flux/actions/app-actions';
import { actionAdd, actionClearHistory, actionGetHistory } from '../../local-flux/actions/action-actions';
import { profileAethTransfersIterator, profileCyclingStates,
    profileGetBalance, } from '../../local-flux/actions/profile-actions';
import { searchProfiles, searchResetResults } from '../../local-flux/actions/search-actions';
import { selectActionsHistory, selectBalance, selectCyclingStates, selectLoggedEthAddress,
    selectPendingActionByType, selectProfileSearchResults } from '../../local-flux/selectors';
import { generalMessages, profileMessages } from '../../locale-data/messages';
import clickAway from '../../utils/clickAway';
import { balanceToNumber, formatBalance, removeTrailingZeros } from '../../utils/number-formatter';

const { TabPane } = Tabs;
const CYCLING = 'cycling';
const HISTORY = 'history';
const TRANSFORM = 'transform';
const WALLET = 'wallet';

class AethWallet extends Component {
    state = {
        activeTab: WALLET
    };

    componentDidMount () {
        this.props.profileCyclingStates();
        this.props.profileAethTransfersIterator();
        this.props.profileGetBalance();
        this.props.actionGetHistory([actionTypes.transferAeth, actionTypes.bondAeth, actionTypes.freeAeth,
            actionTypes.sendTip, actionTypes.transformEssence]);
    }

    componentWillReceiveProps (nextProps) {
        const { pendingCycleAeth } = nextProps;
        if (!pendingCycleAeth && this.props.pendingCycleAeth) {
            this.props.profileCyclingStates();
        }
    }

    componentWillUnmount () {
        this.props.actionClearHistory();
        this.props.searchResetResults();
    }

    componentClickAway = () => {
        this.props.toggleAethWallet();
    };

    selectTab = (activeTab) => { this.setState({ activeTab }); };

    onFreeAeth = () => {
        const { cyclingStates, loggedEthAddress } = this.props;
        const amount = balanceToNumber(cyclingStates.getIn(['available', 'total']));
        this.props.actionAdd(loggedEthAddress, actionTypes.freeAeth, { amount });
    };

    onTransfer = (payload) => {
        const { loggedEthAddress } = this.props;
        this.props.actionAdd(loggedEthAddress, actionTypes.transferAeth, payload);
    };

    getActionCell = (action) => {
        const { intl } = this.props;
        const sentIcon = <Icon className="aeth-wallet__sent-icon" type="arrowUp" />;
        const receivedIcon = <Icon className="aeth-wallet__received-icon" type="arrowDown" />;
        const transformedIcon = <Icon className="aeth-wallet__transformed-icon" type="reload" />;

        switch (action.type) {
            case actionTypes.transferAeth:
                return (
                  <span className="flex-center-y">
                    {sentIcon}{intl.formatMessage(generalMessages.sent)}
                  </span>
                );
            case actionTypes.sendTip:
                return (
                  <span className="flex-center-y">
                    {sentIcon}{intl.formatMessage(profileMessages.sentTip)}
                  </span>
                );
            case actionTypes.bondAeth:
                return (
                  <span className="flex-center-y">
                    {transformedIcon}{intl.formatMessage(generalMessages.manafied)}
                  </span>
                );
            case actionTypes.freeAeth:
                return (
                  <span className="flex-center-y">
                    {transformedIcon}{intl.formatMessage(generalMessages.collected)}
                  </span>
                );
            case actionTypes.transformEssence:
                return (
                  <span className="flex-center-y">
                    {receivedIcon}{intl.formatMessage(generalMessages.forged)}
                  </span>
                );
            case actionTypes.receiveAeth:
                return (
                  <span className="flex-center-y capitalize">
                    {receivedIcon}{intl.formatMessage(generalMessages.received)}
                  </span>
                );
            default:
                return null;
        }
    };

    getAmount = (action) => {
        let amount;
        switch (action.type) {
            case actionTypes.transferAeth:
                return action.getIn(['payload', 'tokenAmount']);
            case actionTypes.bondAeth:
            case actionTypes.freeAeth:
                return action.getIn(['payload', 'amount']);
            case actionTypes.transformEssence:
                amount = action.getIn(['payload', 'amount']);
                return amount ? Number(amount) / 1000 : '-';
            case actionTypes.receiveAeth:
                return removeTrailingZeros(action.getIn(['payload', 'amount']));
            case actionTypes.sendTip:
                return action.getIn(['payload', 'tokenAmount']);
            default:
                return '';
        }
    };

    renderHistory = () => {
        const { intl, sentTransactions } = this.props;
        const transactions = sentTransactions.filter(action => !!this.getAmount(action));
        const rows = transactions.map(action => ({
            action: this.getActionCell(action),
            amount: <span>{this.getAmount(action)} {intl.formatMessage(generalMessages.aeth)}</span>,
            blockNumber: action.get('blockNumber'),
            id: action.get('id'),
            success: action.get('success')
        }));

        return (
          <HistoryTable rows={rows} />
        );
    };

    renderLegend = () => {
        const { balance, intl } = this.props;
        const aethBalance = balance.get('aeth').toJS();

        return (
          <div className="aeth-wallet__chart-legend">
            <div className="aeth-wallet__legend-row">
              <div className="aeth-wallet__legend-box aeth-wallet__legend-box_transferable" />
              <div>
                <div className="aeth-wallet__legend-label">
                  {intl.formatMessage(generalMessages.transferable)}
                </div>
                <div>{aethBalance.free} {intl.formatMessage(generalMessages.aeth)}</div>
              </div>
            </div>
            <div className="aeth-wallet__legend-row">
              <div className="aeth-wallet__legend-box aeth-wallet__legend-box_manafied" />
              <div>
                <div className="aeth-wallet__legend-label">
                  {intl.formatMessage(generalMessages.manafied)}
                </div>
                <div>{aethBalance.bonded} {intl.formatMessage(generalMessages.aeth)}</div>
              </div>
            </div>
            <div className="aeth-wallet__legend-row">
              <div className="aeth-wallet__legend-box aeth-wallet__legend-box_cycling" />
              <div>
                <div className="aeth-wallet__legend-label">
                  {intl.formatMessage(generalMessages.cycling)}
                </div>
                <div>{aethBalance.cycling} {intl.formatMessage(generalMessages.aeth)}</div>
              </div>
            </div>
          </div>
        );
    }

    render () {
        const { balance, cyclingStates, intl, loggedEthAddress, pendingBondAeth, pendingCycleAeth,
            pendingFreeAeth, pendingTransfer, pendingTransformEssence, profileResults } = this.props;
        const { activeTab } = this.state;
        const aethBalance = balance.get('aeth').toJS();
        const cyclingPending = cyclingStates.getIn(['pending', 'collection']);
        const cyclingCount = pendingCycleAeth ? (cyclingPending.length || 0) + 1 : cyclingPending.length;
        const hasCycledAeth = !!(+cyclingStates.getIn(['available', 'total']));
        const cyclingTab = (
          <span className="flex-center">
            {hasCycledAeth &&
              <div className="aeth-wallet__cycled-indicator" />
            }
            {intl.formatMessage(generalMessages.cycling)}
            <span className="flex-center aeth-wallet__cycling-count">{cyclingCount}</span>
          </span>
        );
        const free = balanceToNumber(aethBalance.free);
        const bonded = balanceToNumber(aethBalance.bonded);
        const cycling = balanceToNumber(aethBalance.cycling);
        let data;
        if (free === 0 && bonded === 0 && cycling === 0) {
            data = [1, 1, 1];
        } else {
            data = [free, bonded, cycling];
        }
        return (
          <div className="aeth-wallet">
            <div className="aeth-wallet__header">
              <div className="aeth-wallet__balance-label">
                {intl.formatMessage(profileMessages.totalBalance)}
              </div>
              <div>
                <span className="aeth-wallet__balance">
                  {formatBalance(balance.getIn(['aeth', 'total']), 7)}
                </span>
                <span>{intl.formatMessage(generalMessages.aeth)}</span>
              </div>
            </div>
            <div className="aeth-wallet__chart-area">
              <div className="aeth-wallet__chart-wrapper">
                <PieChart
                  data={{
                      labels: ['Transferable', 'Manafied', 'Cycling'],
                          datasets: [{
                              data,
                              backgroundColor: ['#06d2dc', '#b400ff', '#039eda']
                          }]
                  }}
                  options={{
                      legend: { display: false },
                      tooltips: { enabled: false }
                  }}
                  width="100%"
                  height="100%"
                />
              </div>
              {this.renderLegend()}
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={this.selectTab}
              tabBarStyle={{ height: '40px', marginBottom: '0px' }}
              type="card"
            >
              <TabPane key={WALLET} tab={intl.formatMessage(generalMessages.wallet)}>
                <TransferForm
                  balance={balance.getIn(['aeth', 'free'])}
                  dataSource={profileResults}
                  ethAddress={loggedEthAddress}
                  onCancel={this.props.toggleAethWallet}
                  onSubmit={this.onTransfer}
                  pendingTransfer={pendingTransfer}
                  searchProfiles={this.props.searchProfiles}
                  showNotification={this.props.showNotification}
                  type="aeth"
                />
              </TabPane>
              <TabPane key={TRANSFORM} tab={intl.formatMessage(generalMessages.transform)}>
                <TransformForm
                  actionAdd={this.props.actionAdd}
                  balance={balance}
                  loggedEthAddress={loggedEthAddress}
                  pendingBondAeth={pendingBondAeth}
                  pendingCycleAeth={!!pendingCycleAeth}
                  pendingTransformEssence={pendingTransformEssence}
                  onCancel={this.props.toggleAethWallet}
                />
              </TabPane>
              <TabPane key={CYCLING} tab={cyclingTab}>
                <CyclingAeth
                  cyclingStates={cyclingStates}
                  onCollect={this.onFreeAeth}
                  pendingCycleAeth={pendingCycleAeth}
                  pendingFreeAeth={pendingFreeAeth}
                />
              </TabPane>
              <TabPane key={HISTORY} tab={intl.formatMessage(generalMessages.history)}>
                {this.renderHistory()}
              </TabPane>
            </Tabs>
          </div>
        );
    }
}

AethWallet.propTypes = {
    actionAdd: PropTypes.func.isRequired,
    actionClearHistory: PropTypes.func.isRequired,
    actionGetHistory: PropTypes.func.isRequired,
    balance: PropTypes.shape().isRequired,
    cyclingStates: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    loggedEthAddress: PropTypes.string.isRequired,
    pendingBondAeth: PropTypes.bool,
    pendingCycleAeth: PropTypes.string,
    pendingFreeAeth: PropTypes.bool,
    pendingTransfer: PropTypes.bool,
    pendingTransformEssence: PropTypes.bool,
    profileAethTransfersIterator: PropTypes.func.isRequired,
    profileCyclingStates: PropTypes.func.isRequired,
    profileGetBalance: PropTypes.func.isRequired,
    profileResults: PropTypes.shape().isRequired,
    searchProfiles: PropTypes.func.isRequired,
    searchResetResults: PropTypes.func.isRequired,
    sentTransactions: PropTypes.shape().isRequired,
    showNotification: PropTypes.func.isRequired,
    toggleAethWallet: PropTypes.func.isRequired,
};

function mapStateToProps (state) {
    return {
        balance: selectBalance(state),
        cyclingStates: selectCyclingStates(state),
        loggedEthAddress: selectLoggedEthAddress(state),
        pendingBondAeth: selectPendingActionByType(state, actionTypes.bondAeth),
        pendingCycleAeth: selectPendingActionByType(state, actionTypes.cycleAeth),
        pendingFreeAeth: selectPendingActionByType(state, actionTypes.freeAeth),
        pendingTransfer: selectPendingActionByType(state, actionTypes.transferAeth),
        pendingTransformEssence: selectPendingActionByType(state, actionTypes.transformEssence),
        profileResults: selectProfileSearchResults(state),
        sentTransactions: selectActionsHistory(state)
    };
}

export default connect(
    mapStateToProps,
    {
        actionAdd,
        actionClearHistory,
        actionGetHistory,
        profileAethTransfersIterator,
        profileCyclingStates,
        profileGetBalance,
        searchProfiles,
        searchResetResults,
        showNotification,
        toggleAethWallet
    }
)(injectIntl(clickAway(AethWallet)));
