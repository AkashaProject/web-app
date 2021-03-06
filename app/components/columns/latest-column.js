import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import Waypoint from 'react-waypoint';
import { ColumnHeader, EntryList } from '../';
import { dashboardMessages, entryMessages } from '../../locale-data/messages';
import { dashboardResetColumnEntries } from '../../local-flux/actions/dashboard-actions';
import { entryMoreNewestIterator,
    entryNewestIterator } from '../../local-flux/actions/entry-actions';
import { selectColumnEntries } from '../../local-flux/selectors';

const DELAY = 60000;

class LatestColumn extends Component {
    firstCallDone = false;
    interval = null;
    timeout = null;

    componentWillReceiveProps (nextProps) {
        if (nextProps.column.get('hasNewEntries') && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    componentWillUnmount () {
        const { column } = this.props;
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.props.dashboardResetColumnEntries(column.get('id'));
    }

    firstLoad = () => {
        if (!this.firstCallDone) {
            this.entryIterator();
            this.firstCallDone = true;
        }
    };

    setPollingInterval = () => {
        this.interval = setInterval(() => {
            this.props.entryNewestIterator(this.props.column.get('id'), true);
        }, DELAY);
    };

    entryIterator = () => {
        this.props.entryNewestIterator(this.props.column.get('id'));
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.timeout = setTimeout(this.setPollingInterval, DELAY);
    };

    entryMoreNewestIterator = () => {
        const { column } = this.props;
        this.props.entryMoreNewestIterator(column.get('id'));
    };

    render () {
        const { column, entriesList, intl } = this.props;
        const className = classNames('column', { column_large: column.get('large') });

        return (
          <div className={className}>
            <ColumnHeader
              column={column}
              iconType="entries"
              onRefresh={this.entryIterator}
              readOnly
              title={intl.formatMessage(dashboardMessages.latest)}
            />
            <Waypoint onEnter={this.firstLoad} horizontal />
            <EntryList
              contextId={column.get('id')}
              entries={entriesList}
              fetchingEntries={column.getIn(['flags', 'fetchingEntries'])}
              fetchingMoreEntries={column.getIn(['flags', 'fetchingMoreEntries'])}
              fetchMoreEntries={this.entryMoreNewestIterator}
              large={column.get('large')}
              moreEntries={column.getIn(['flags', 'moreEntries'])}
              placeholderMessage={intl.formatMessage(entryMessages.noNewEntries)}
            />
          </div>
        );
    }
}

LatestColumn.propTypes = {
    column: PropTypes.shape().isRequired,
    dashboardResetColumnEntries: PropTypes.func.isRequired,
    entriesList: PropTypes.shape().isRequired,
    entryMoreNewestIterator: PropTypes.func.isRequired,
    entryNewestIterator: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
};

function mapStateToProps (state, ownProps) {
    return {
        entriesList: selectColumnEntries(state, ownProps.column.get('id'))
    };
}

export default connect(
    mapStateToProps,
    {
        dashboardResetColumnEntries,
        entryMoreNewestIterator,
        entryNewestIterator,
    }
)(injectIntl(LatestColumn));
