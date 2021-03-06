import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';
import { ColumnHeader, ProfileList } from '../';
import { profileMessages } from '../../locale-data/messages';
import { profileFollowersIterator,
    profileMoreFollowersIterator } from '../../local-flux/actions/profile-actions';
import { selectFetchingFollowers, selectFetchingMoreFollowers, selectFollowers,
    selectMoreFollowers } from '../../local-flux/selectors';

class ProfileFollowersColumn extends Component {
    firstCallDone = false;
    firstLoad = () => {
        if (!this.firstCallDone) {
            this.followersIterator();
            this.firstCallDone = true;
        }
    }

    componentWillReceiveProps (nextProps) {
        const { ethAddress } = nextProps;
        if (this.props.ethAddress !== ethAddress) {
            this.followersIterator(ethAddress);
        }
    }

    followersIterator = (ethAddress) => {
        if (!ethAddress) {
            ethAddress = this.props.ethAddress;
        }
        this.props.profileFollowersIterator({ context: 'profilePageFollowers', ethAddress });
    };

    followersMoreIterator = () => {
        const { ethAddress } = this.props;
        this.props.profileMoreFollowersIterator({ context: 'profilePageFollowers', ethAddress });
    };

    render () {
        const { fetchingFollowers, fetchingMoreFollowers, followers, intl, moreFollowers } = this.props;

        return (
          <div className="column">
            <ColumnHeader
              onRefresh={this.followersIterator}
              noMenu
              readOnly
              title={intl.formatMessage(profileMessages.followers)}
            />
            <Waypoint onEnter={this.firstLoad} horizontal />
            <ProfileList
              context="profilePageFollowers"
              fetchingProfiles={fetchingFollowers}
              fetchingMoreProfiles={fetchingMoreFollowers}
              fetchMoreProfiles={this.followersMoreIterator}
              moreProfiles={moreFollowers}
              profiles={followers}
            />
          </div>
        );
    }
}

ProfileFollowersColumn.propTypes = {
    ethAddress: PropTypes.string.isRequired,
    fetchingFollowers: PropTypes.bool,
    fetchingMoreFollowers: PropTypes.bool,
    followers: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    moreFollowers: PropTypes.bool,
    profileFollowersIterator: PropTypes.func.isRequired,
    profileMoreFollowersIterator: PropTypes.func.isRequired,
};

function mapStateToProps (state, ownProps) {
    const { ethAddress } = ownProps;
    return {
        fetchingFollowers: selectFetchingFollowers(state, ethAddress),
        fetchingMoreFollowers: selectFetchingMoreFollowers(state, ethAddress),
        followers: selectFollowers(state, ethAddress),
        moreFollowers: selectMoreFollowers(state, ethAddress),
    };
}

export default connect(
    mapStateToProps,
    {
        profileFollowersIterator,
        profileMoreFollowersIterator,
    }
)(injectIntl(ProfileFollowersColumn));
