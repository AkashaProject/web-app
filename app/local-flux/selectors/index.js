import { List, Map } from 'immutable';
import { ProfileRecord } from '../reducers/records';

/* eslint-disable no-use-before-define */

export const selectAction = (state, id) => state.actionState.getIn(['byId', id]);

export const selectActionsHistory = state =>
    state.actionState.get('history').map(id => selectAction(state, id));

export const selectActionPending = (state, actionType) =>
    state.actionState.getIn(['pending', actionType]);

export const selectActionPendingAll = state => state.actionState.get('pending');

export const selectActionToPublish = state => state.actionState.get('toPublish');

export const selectActiveDashboard = (state) => {
    const activeDashboard = state.dashboardState.get('activeDashboard');
    if (!activeDashboard) {
        return null;
    }
    return state.dashboardState.getIn([
        'byId',
        activeDashboard
    ]);
};

export const selectActiveDashboardColumns = (state) => {
    const id = state.dashboardState.get('activeDashboard');
    if (!id || !state.dashboardState.getIn(['byId', id])) {
        return new List();
    }
    return state.dashboardState
        .getIn(['byId', id, 'columns'])
        .map(columnId => selectColumn(state, columnId));
};

export const selectActiveDashboardId = state => state.dashboardState.get('activeDashboard');

export const selectActivePanel = state => state.panelState.get('activePanel');

export const selectAllDashboards = state =>
    state.dashboardState.get('allDashboards').map(id => selectDashboard(state, id));

export const selectAllFollowings = state => state.profileState.get('allFollowings');

export const selectAllLicenses = state => state.licenseState.get('byId');

export const selectAllPendingClaims = state => state.actionState.getIn(['pending', 'claim']);

export const selectAllPendingVotes = state => state.actionState.getIn(['pending', 'entryVote']);

export const selectBalance = state => state.profileState.get('balance');

export const selectBaseUrl = state =>
    state.externalProcState.getIn(['ipfs', 'status', 'baseUrl']);

export const selectBatchActions = state =>
    state.actionState.get('batchActions').map(actionId => selectAction(state, actionId));

export const selectBlockNumber = state => state.externalProcState.getIn(['geth', 'status', 'blockNr']);

export const selectClaimableActions = state =>
    state.actionState.get('claimable').map(actionId => selectAction(state, actionId));

export const selectClaimableEntries = state => state.claimableState.get('entryList');

export const selectClaimableEntriesById = (state) => {
    const entryById = state.entryState.get('byId');
    let entries = new Map();
    state.claimableState.get('entryList').forEach((claimableEntry) => {
        entries = entries.set(claimableEntry.entryId, entryById.get(claimableEntry.entryId));
    });
    return entries;
};

export const selectClaimableLoading = state => !!state.claimableState.get('entriesLoading').size;

export const selectClaimableLoadingMore = state => !!state.claimableState.get('entriesLoadingMore').size;

export const selectClaimableMoreEntries = state => state.claimableState.get('moreEntries');

export const selectClaimableOffset = state => state.claimableState.get('entryList').size;

export const selectColumn = (state, columnId) => state.dashboardState.getIn(['columnById', columnId]);

export const selectColumnEntries = (state, columnId) =>
    state.dashboardState
        .getIn(['columnById', columnId, 'itemsList'])
        .map(id => selectEntry(state, id));

export const selectColumnPendingEntries = (state, dashboardId) => {
    if (!dashboardId || !state.dashboardState.getIn(['byId', dashboardId])) {
        return new Map();
    }
    return state.dashboardState.getIn(['byId', dashboardId, 'columns']).map(colId =>
        state.entryState.getIn(['flags', 'pendingEntries', colId])
    );
}

export const selectColumnFirstBlock = (state, columnId) =>
    state.dashboardState.getIn(['columnById', columnId, 'firstBlock']);

export const selectColumnLastBlock = (state, columnId) =>
    state.dashboardState.getIn(['columnById', columnId, 'lastBlock']);

export const selectColumnLastEntry = (state, columnId) =>
    state.dashboardState.getIn(['columnById', columnId, 'itemsList']).last();

export const selectColumnLastIndex = (state, columnId) =>
    state.dashboardState.getIn(['columnById', columnId, 'lastIndex']);

export const selectColumns = state => state.dashboardState.get('columnById');

export const selectComment = (state, id) => state.commentsState.getIn(['byId', id]);

export const selectCommentIsPending = (state, context, commentId) =>
    state.commentsState.getIn(['flags', 'pendingComments', context, commentId]);

export const selectCommentLastBlock = (state, parent) => state.commentsState.getIn(['lastBlock', parent]);

export const selectCommentLastIndex = (state, parent) => state.commentsState.getIn(['lastIndex', parent]);

export const selectCommentVote = (state, commentId) => state.commentsState.getIn(['votes', commentId]);

export const selectEntryCommentsForParent = (state, entryId, parent) => {
    const list = state.commentsState.getIn(['byParent', parent]);
    return List(list).map(id => selectComment(state, id)).filter(comm => comm.entryId === entryId);
};

export const selectCommentsFlag = (state, flag, id) => {
    if (id) {
        return state.commentsState.getIn(['flags', flag, id]);
    }
    return state.commentsState.getIn(['flags', flag]);
};

export const selectCyclingStates = state => state.profileState.get('cyclingStates');

export const selectDashboard = (state, id) =>
    state.dashboardState.getIn(['byId', id]);

export const selectDashboardIdByName = (state, name) =>
    state.dashboardState.get('byId')
        .filter(dashboard => dashboard.get('name') === name)
        .map(dashboard => dashboard.get('id'));

export const selectDashboards = (state) => {
    const search = selectDashboardSearch(state);
    if (!search) {
        return state.dashboardState.get('allDashboards').map(id => selectDashboard(state, id));
    }
    return state.dashboardState.get('allDashboards')
        .filter(id =>
            selectDashboard(state, id).get('name').toLowerCase().includes(search.toLowerCase())
        )
        .map(id => selectDashboard(state, id));
};

export const selectDashboardSearch = state => state.dashboardState.get('search');

export const selectDraftById = (state, draftId) => state.draftState.getIn(['drafts', draftId]);

export const selectDrafts = state => state.draftState.get('drafts');

export const selectDraftsLastBlock = state => state.draftState.getIn(['iterator', 'lastBlock']);

export const selectDraftsLastIndex = state => state.draftState.getIn(['iterator', 'lastIndex']);

export const selectDraftsTotalLoaded = state => state.draftState.getIn(['iterator', 'totalLoaded']);

export const selectEntry = (state, id) => state.entryState.getIn(['byId', id]);

export const selectEntryBalance = (state, id) => state.entryState.getIn(['balance', id]);

export const selectEntryCanClaim = (state, id) => state.entryState.getIn(['canClaim', id]);

export const selectEntryCanClaimVote = (state, id) => state.entryState.getIn(['canClaimVote', id]);

export const selectEntryEndPeriod = state => state.entryState.get('endPeriod');

export const selectEntryFlag = (state, flag) => state.entryState.getIn(['flags', flag]);

export const selectEntryVote = (state, id) => state.entryState.getIn(['votes', id]);

export const selectEssenceIterator = (state) => {
    return {
        lastBlock: state.profileState.getIn(['essenceIterator', 'lastBlock']),
        lastIndex: state.profileState.getIn(['essenceIterator', 'lastIndex'])
    };
};

export const selectEthBalance = state => state.profileState.getIn(['balance', 'eth']);

export const selectFetchingFollowers = (state, ethAddress) =>
    state.profileState.getIn(['flags', 'fetchingFollowers', ethAddress]);

export const selectFetchingFollowings = (state, ethAddress) =>
    state.profileState.getIn(['flags', 'fetchingFollowings', ethAddress]);

export const selectFetchingHistory = state => state.actionState.getIn(['flags', 'fetchingHistory']);

export const selectFetchingMoreFollowers = (state, ethAddress) =>
    state.profileState.getIn(['flags', 'fetchingMoreFollowers', ethAddress]);

export const selectFetchingMoreFollowings = (state, ethAddress) =>
    state.profileState.getIn(['flags', 'fetchingMoreFollowings', ethAddress]);

export const selectFetchingMoreHistory = state => state.actionState.getIn(['flags', 'fetchingMoreHistory']);

export const selectFirstComment = state => state.commentsState.get('firstComm');

export const selectFollowers = (state, ethAddress) => {
    const followers = state.profileState.getIn(['followers', ethAddress]);
    if (followers) {
        return followers.map(ethAddr => selectProfile(state, ethAddr));
    }
    return new List();
};

export const selectFollowings = (state, ethAddress) => {
    const followings = state.profileState.getIn(['followings', ethAddress]);
    if (followings) {
        return followings.map(ethAddr => selectProfile(state, ethAddr));
    }
    return new List();
};

export const selectFullEntry = state =>
    state.entryState.get('fullEntry');

export const selectGeneralSettings = state => state.settingsState.get('general');

export const selectGethStatus = state => state.externalProcState.getIn(['geth', 'status']);

export const selectGethSyncStatus = state => state.externalProcState.getIn(['geth', 'syncStatus']);

export const selectGethSyncActionId = state => state.externalProcState.getIn(['geth', 'syncActionId']);

export const selectIpfsStatus = state => state.externalProcState.getIn(['ipfs', 'status']);

export const selectIsFollower = (state, ethAddress) => state.profileState.getIn(['isFollower', ethAddress]);

export const selectHideEntrySettings = state =>
    state.settingsState.getIn(['userSettings', 'hideEntryContent']);

export const selectHideCommentSettings = state =>
    state.settingsState.getIn(['userSettings', 'hideCommentContent']);

export const selectHighlight = (state, id) => state.highlightState.getIn(['byId', id]);

export const selectHighlights = (state) => {
    const searchResults = state.highlightState.get('searchResults');
    if (state.highlightState.get('search')) {
        return searchResults.map(id => state.highlightState.getIn(['byId', id]));
    }
    return state.highlightState.get('byId').toList();
};

export const selectHighlightsCount = state => state.highlightState.get('byId').size;

export const selectHighlightSearch = state => state.highlightState.get('search');

export const selectLastFollower = (state, ethAddress) =>
    state.profileState.getIn(['lastFollower', ethAddress]);

export const selectLastFollowing = (state, ethAddress) =>
    state.profileState.getIn(['lastFollowing', ethAddress]);

export const selectCurrentTotalFollowing = (state, ethAddress) => {
    const following = state.profileState.getIn(['followings', ethAddress]);
    return following ? following.size : null;
};

export const selectCurrentTotalFollowers = (state, ethAddress) => {
    const followers = state.profileState.getIn(['followers', ethAddress]);
    return followers ? followers.size : null;
};

export const selectCurrentTotalProfileEntries = (state, ethAddress) => {
    const entries = state.entryState.getIn(['profileEntries', ethAddress, 'entryIds']);    
    return entries ? entries.size : null;
};

export const selectLastGethLog = state =>
    state.externalProcState.getIn(['geth', 'lastLogTimestamp']);

export const selectLastIpfsLog = state =>
    state.externalProcState.getIn(['ipfs', 'lastLogTimestamp']);

export const selectLastStreamBlock = state => state.entryState.get('lastStreamBlock');

export const selectListById = (state, id) => state.listState.getIn(['byId', id]);

export const selectListEntryType = (state, id, entryId) => {
    const entryIds = state.listState.getIn(['byId', id, 'entryIds']);
    const entryIndex = entryIds.findIndex(ele => ele.entryId === entryId);
    const entry = entryIds.get(entryIndex);
    return entry.entryType;
};

export const selectListEntries = (state, value, limit) =>
    (state.listState.getIn(['byId', value, 'entryIds']) || new List())
        .slice(0, limit)
        .map((ele) => {
            const { entryId, entryType, authorEthAddress } = ele;
            return { entryId, entryType, author: { ethAddress: authorEthAddress } };
        })
        .toJS();

export const selectListNextEntries = (state, value, limit) => {
    const startIndex = state.listState.getIn(['byId', value, 'startIndex']);
    return state.listState
        .getIn(['byId', value, 'entryIds'])
        .slice(startIndex, startIndex + limit)
        .map(ele => ({ entryId: ele.entryId, author: { ethAddress: ele.authorEthAddress } }))
        .toJS();
};

export const selectLists = (state) => {
    if (state.listState.get('search')) {
        const searchResults = state.listState.get('searchResults');
        return searchResults.map(id => state.listState.getIn(['byId', id]));
    }
    return state.listState.get('byId').toList();
};

export const selectListsAll = state => state.listState.get('byId').toList();

export const selectListsNames = state => state.listState.get('byId').toList().map(list => list.get('name'));

export const selectListsCount = state => state.listState.get('byId').size;

export const selectListSearch = state => state.listState.get('search');

export const selectLocalProfiles = state =>
    state.profileState
        .get('localProfiles')
        .map(ethAddress => selectProfile(state, ethAddress));

export const selectLoggedEthAddress = state =>
    state.profileState.getIn(['loggedProfile', 'ethAddress']);

export const selectLoggedProfile = state => state.profileState.get('loggedProfile');

export const selectLoggedProfileData = state =>
    selectProfile(state, state.profileState.getIn(['loggedProfile', 'ethAddress']));

export const selectManaBalance = state => state.profileState.getIn(['balance', 'mana', 'remaining']);

export const selectManaBurned = state => state.profileState.get('manaBurned');

export const selectMoreComments = (state, parent) => state.commentsState.getIn(['moreComments', parent]);

export const selectMoreFollowers = (state, ethAddress) =>
    state.profileState.getIn(['moreFollowers', ethAddress]);

export const selectMoreFollowings = (state, ethAddress) =>
    state.profileState.getIn(['moreFollowings', ethAddress]);

export const selectNeedAuthAction = state =>
    state.actionState.getIn(['byId', state.actionState.get('needAuth')]);

export const selectNewColumn = state => state.dashboardState.get('newColumn');

// export const selectNewColumnEntries = (state) => {
//     const entryIds = state.dashboardState.getIn(['columnById', 'newColumn', 'entries']);
//     return entryIds.map(id => selectEntry(state, id));
// };

export const selectNewCommentsBlock = state =>
    state.commentsState.getIn(['newComments', 'lastBlock']) || selectBlockNumber(state);

export const selectNewestCommentBlock = (state, parent) =>
    state.commentsState.getIn(['newestCommentBlock', parent]);

export const selectNotificationsPanel = state => state.appState.get('showNotificationsPanel');

export const selectNotificationsPreference = state =>
    state.settingsState.getIn(['userSettings', 'notificationsPreference']);

export const selectPendingActionByType = (state, actionType) =>
    state.actionState.getIn(['pending', actionType]);

export const selectPendingBondAeth = state => state.actionState.getIn(['pending', 'bondAeth']);

export const selectPendingClaim = (state, entryId) =>
    !!state.actionState.getIn(['pending', 'claim', entryId]);

export const selectPendingClaims = state =>
    state.actionState.getIn(['pending', 'claim']);

export const selectPendingClaimVote = (state, entryId) =>
    !!state.actionState.getIn(['pending', 'claimVote', entryId]);

export const selectPendingClaimVotes = state =>
    state.actionState.getIn(['pending', 'claimVote']);

export const selectPendingComments = (state, entryId) =>
    state.actionState.getIn(['pending', 'comment', entryId]) || new List();

export const selectPendingCommentVote = (state, commentId) =>
    state.actionState.getIn(['pending', 'commentVote', commentId]);

export const selectPendingCycleAeth = state => state.actionState.getIn(['pending', 'cycleAeth']);

export const selectPendingEntries = (state, context) =>
    state.entryState.getIn(['flags', 'pendingEntries', context]);

export const selectPendingFollow = (state, ethAddress) =>
    !!state.actionState.getIn(['pending', 'follow', ethAddress]);

export const selectPendingProfiles = (state, context) =>
    state.profileState.getIn(['flags', 'pendingProfiles', context]);

export const selectPendingTip = (state, akashaId) =>
    !!state.actionState.getIn(['pending', 'sendTip', akashaId]);

export const selectPendingTransformEssence = state =>
    state.actionState.getIn(['pending', 'transformEssence']);

export const selectPendingVote = (state, entryId) =>
    !!state.actionState.getIn(['pending', 'entryVote', entryId]);

export const selectProfile = (state, ethAddress) =>
    state.profileState.getIn(['byEthAddress', ethAddress]) || new ProfileRecord();

export const selectProfileEditToggle = state =>
    state.appState.get('showProfileEditor');

export const selectProfileEntries = (state, ethAddress) =>
    (state.entryState.getIn(['profileEntries', ethAddress, 'entryIds']) || new List())
        .map(entryId => selectEntry(state, entryId));

export const selectProfileLoggedEntries = (state) =>
    (state.dashboardState.getIn(['columnById', 'profileEntries', 'itemsList']) || new List())
        .map(entryId => selectEntry(state, entryId));

export const selectProfileEntriesCount = (state, ethAddress) =>
    state.profileState.getIn(['byEthAddress', ethAddress, 'entriesCount']);

export const selectProfileEntriesFlags = (state, ethAddress) => {
    const profileEntries = state.entryState.getIn(['profileEntries', ethAddress]);
    if (!profileEntries) {
        return {};
    }
    return {
        fetchingEntries: profileEntries.get('fetchingEntries'),
        fetchingMoreEntries: profileEntries.get('fetchingMoreEntries'),
        moreEntries: profileEntries.get('moreEntries')
    };
};

export const selectProfileEntriesLastBlock = (state, value) =>
    state.entryState.getIn(['profileEntries', value, 'lastBlock']);

export const selectProfileEntriesLastIndex = (state, value) =>
    state.entryState.getIn(['profileEntries', value, 'lastIndex']);

export const selectProfileExists = state => state.profileState.get('exists');

export const selectProfileFlag = (state, flag) => state.profileState.getIn(['flags', flag]);

export const selectProfileSearchResults = state => state.searchState.get('profilesAutocomplete');

export const selectPublishingActions = state =>
    state.actionState.get('publishing').map(id => selectAction(state, id));

export const selectResolvingComment = (state, commentId) =>
    state.commentsState.getIn(['flags', 'resolvingComments', commentId]);

export const selectSearchEntries = state =>
    state.searchState.entryIds.map(entryId => state.entryState.getIn(['byId', entryId]));

export const selectSearchEntryOffset = state => state.searchState.offset;

export const selectSearchProfiles = state =>
    state.searchState.profiles.map(ethAddress => state.profileState.getIn(['byEthAddress', ethAddress]));

export const selectSearchQuery = state => state.searchState.get('query');

export const selectSearchQueryAutocomplete = state => state.searchState.get('queryAutocomplete');

export const selectSearchTags = state => state.searchState.get('tags');

export const selectSelectionState = (state, draftId, ethAddress) =>
    state.draftState.getIn(['selection', draftId, ethAddress]);

export const selectShowWallet = state => state.appState.get('showWallet');

export const selectTagEntriesCount = state => state.tagState.get('entriesCount');

export const selectTagExists = state => state.tagState.get('exists');

export const selectTagSearchResults = state => state.searchState.get('tags');

export const selectToken = state => state.profileState.getIn(['loggedProfile', 'token']);

export const selectTokenExpiration = state => state.profileState.getIn(['loggedProfile', 'expiration']);

export const selectTransactionsLog = state => state.appState.get('showTransactionsLog');

export const selectUnreadNotifications = state => state.notificationsState.get('unreadNotifications');

export const selectVoteCost = state => state.entryState.get('voteCostByWeight');

/* eslint-enable no-use-before-define */
