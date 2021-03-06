import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, Form, Popover, Slider, Tooltip } from 'antd';
import classNames from 'classnames';
import { selectManaBalance, selectVoteCost, selectLoggedEthAddress } from '../../local-flux/selectors';
import { entryMessages, formMessages, generalMessages } from '../../locale-data/messages';
import { Icon } from '../';
import { toggleGuestModal } from '../../local-flux/actions/app-actions';
import { guestAddress } from '../../constants/guest-address';

const FormItem = Form.Item;
const MIN = 1;
const MAX = 10;

class VotePopover extends Component {
    state = {
        popoverVisible: false
    };
    wasVisible = false;

    componentWillReceiveProps (nextProps) {
        const { votePending } = nextProps;
        if (!votePending && this.props.votePending) {
            this.setState({
                popoverVisible: false
            });
        }
    }

    componentWillUnmount () {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    canVote = () => {
        const { disabled, isOwnEntity, votePending, vote } = this.props;
        return !disabled && !isOwnEntity && !votePending && vote === '0';
    };

    isDownVote = () => this.props.type.includes('Downvote');

    getTooltip = () => {
        const { intl, isOwnEntity, type, votePending, vote } = this.props;
        if (votePending) {
            return intl.formatMessage(entryMessages.votePending);
        } else if (vote && vote !== '0') {
            const weight = Math.abs(Number(vote));
            return vote > '0' ?
                intl.formatMessage(entryMessages.alreadyUpvoted, { weight }) :
                intl.formatMessage(entryMessages.alreadyDownvoted, { weight });
        } else if (isOwnEntity && !type.includes('entry')) {
            return intl.formatMessage(entryMessages.votingOwnComment);
        } else if (this.isDownVote()) {
            return intl.formatMessage(entryMessages.downvote);
        } else if (type.includes('Upvote')) {
            return intl.formatMessage(entryMessages.upvote);
        }
        return null;
    }

    onCancel = () => {
        this.onVisibleChange(false);
    };

    onSubmit = (ev) => {
        ev.preventDefault();
        const { form, onSubmit, type } = this.props;
        const weight = form.getFieldValue('weight');
        onSubmit({ type, weight });
        this.onVisibleChange(false);
    };

    onVisibleChange = (popoverVisible) => {
        if (this.props.loggedEthAddress === guestAddress) {
            this.props.toggleGuestModal();
            return;
        }
        this.wasVisible = true;
        this.setState({
            popoverVisible: popoverVisible && this.canVote()
        });
        if (!popoverVisible) {
            // Delay state reset until popover animation is finished
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.props.form.setFieldsValue({ weight: MIN });
            }, 100);
        }
    };

    validateWeight = (rule, value, callback) => {
        const { intl } = this.props;
        if (!Number.isInteger(value)) {
            callback(intl.formatMessage(formMessages.voteWeightIntegerError, { min: MIN, max: MAX }));
        }
        if (value < MIN || value > MAX) {
            callback(intl.formatMessage(formMessages.voteWeightRangeError, { min: MIN, max: MAX }));
            return;
        }
        callback();
    };

    renderContent = () => {
        const { form, intl, votePending } = this.props;
        const { getFieldDecorator, getFieldError, getFieldValue } = form;
        const title = this.isDownVote() ? entryMessages.downvote : entryMessages.upvote;

        if (!this.canVote()) {
            return null;
        }

        const weightError = getFieldError('weight');
        const extra = (
          <span className="vote-popover__extra">
            {intl.formatMessage(formMessages.voteWeightExtra, { min: MIN, max: MAX })}
          </span>
        );
        const weight = getFieldValue('weight') || 1;

        return (
          <Form className="vote-popover__content" hideRequiredMark onSubmit={this.onSubmit}>
            <div className="vote-popover__title">
              {intl.formatMessage(title)}
            </div>
            <FormItem
              className="vote-popover__form-item"
              colon={false}
              help={weightError ? weightError[0] : extra}
              validateStatus={weightError ? 'error' : ''}
            >
              <div className="flex-center">
                {getFieldDecorator('weight', {
                    initialValue: MIN,
                    rules: [{
                        required: true,
                        message: intl.formatMessage(formMessages.voteWeightRequired)
                    }, {
                        validator: this.validateWeight
                    }]
                })(
                  <Slider
                    className="vote-popover__slider"
                    min={MIN}
                    max={MAX}
                    tipFormatter={null}
                  />
                )}
                <div className="flex-center vote-popover__weight">
                  {weight}
                </div>
              </div>
            </FormItem>
            <div className="vote-popover__actions">
              <Button className="vote-popover__button" onClick={this.onCancel}>
                <span className="vote-popover__button-label">
                  {intl.formatMessage(generalMessages.cancel)}
                </span>
              </Button>
              <Button
                className="vote-popover__button"
                disabled={!!weightError || votePending}
                htmlType="submit"
                onClick={this.onSubmit}
                type="primary"
              >
                <span className="vote-popover__button-label">
                  {intl.formatMessage(generalMessages.vote)}
                </span>
              </Button>
            </div>
          </Form>
        );
    };

    render () {
        const { containerRef, iconClassName, vote } = this.props;

        const iconClass = classNames(iconClassName, {
            'content-link': this.canVote(),
            'vote-popover__icon_disabled': !this.canVote(),
            'vote-popover__icon_downvoted': this.isDownVote() && vote < '0',
            'vote-popover__icon_upvoted': !this.isDownVote() && vote > '0',
        });

        return (
          <Popover
            content={this.wasVisible ? this.renderContent() : null}
            getPopupContainer={() => containerRef || document.body}
            onVisibleChange={this.onVisibleChange}
            overlayClassName="vote-popover"
            placement="bottomLeft"
            trigger="click"
            visible={this.state.popoverVisible}
          >
            <Tooltip
              arrowPointAtCenter
              getPopupContainer={() => containerRef || document.body}
              placement={this.isDownVote() ? 'top' : 'topRight'}
              title={this.getTooltip()}
            >
              <Icon
                className={iconClass}
                type={this.isDownVote() ? 'arrowDown' : 'arrowUp'}
              />
            </Tooltip>
          </Popover>
        );
    }
}

VotePopover.propTypes = {
    containerRef: PropTypes.shape(),
    disabled: PropTypes.bool,
    form: PropTypes.shape().isRequired,
    iconClassName: PropTypes.string,
    intl: PropTypes.shape().isRequired,
    isOwnEntity: PropTypes.bool,
    loggedEthAddress: PropTypes.string,
    mana: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    toggleGuestModal: PropTypes.func,
    type: PropTypes.string.isRequired,
    voteCost: PropTypes.shape().isRequired,
    votePending: PropTypes.bool,
    vote: PropTypes.string
};

function mapStateToProps (state) {
    return {
        loggedEthAddress: selectLoggedEthAddress(state),
        mana: selectManaBalance(state),
        voteCost: selectVoteCost(state)
    };
}

export default connect(
    mapStateToProps,
    {
        toggleGuestModal
    }
)(Form.create()(injectIntl(VotePopover)));
