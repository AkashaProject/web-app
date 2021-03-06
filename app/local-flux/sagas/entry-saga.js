import { all, apply, call, fork, put, select, take, takeEvery,
    takeLatest } from 'redux-saga/effects';
import getChannels from 'akasha-channels';
import { actionChannels, enableChannel, isLoggedProfileRequest } from './helpers';
import * as actionActions from '../actions/action-actions';
import * as appActions from '../actions/app-actions';
import * as actions from '../actions/entry-actions';
import * as claimableActions from '../actions/claimable-actions';
import * as draftActions from '../actions/draft-actions';
import * as profileActions from '../actions/profile-actions';
import * as tagActions from '../actions/tag-actions';
import * as types from '../constants';
import * as columnTypes from '../../constants/columns';
import { selectBlockNumber, selectColumn, selectColumnFirstBlock, selectColumnLastBlock, selectColumnLastIndex,
    selectListEntries, selectListEntryType, selectIsFollower, selectListNextEntries, selectLoggedEthAddress,
    selectProfileEntriesLastBlock, selectProfileEntriesLastIndex, selectToken,
    selectCurrentTotalProfileEntries, selectDrafts, selectDraftsLastBlock,
    selectDraftsLastIndex, selectDraftsTotalLoaded } from '../selectors';
import * as actionStatus from '../../constants/action-status';
import { isEthAddress } from '../../utils/dataModule';

const ALL_STREAM_LIMIT = 3;
const ITERATOR_LIMIT = 3;
const ENTRY_LIST_ITERATOR_LIMIT = 3;

/* eslint-disable no-use-before-define */

function* enableExtraChannels () {
    const { canClaim, getEntryBalance, getVoteOf } = getChannels().server.entry;
    yield all([
        call(enableChannel, getVoteOf, getChannels().client.entry.manager),
        call(enableChannel, getEntryBalance, getChannels().client.entry.manager),
        call(enableChannel, canClaim, getChannels().client.entry.manager),
    ]);
}

function* entryCanClaim ({ entryIds }) {
    const channel = getChannels().server.entry.canClaim;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(channel, channel.send, [{ entryId: entryIds }]);
}

function* entryCanClaimVote ({ entryIds }) {
    const channel = getChannels().server.entry.canClaimVote;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const ethAddress = yield select(selectLoggedEthAddress);
    yield apply(channel, channel.send, [{ entries: entryIds, ethAddress }]);
}

function* entryClaim ({ actionId, entryId, entryTitle }) {
    const channel = getChannels().server.entry.claim;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const token = yield select(selectToken);
    yield apply(channel, channel.send, [{ actionId, token, entryId, entryTitle }]);
}

function* entryClaimSuccess ({ data }) {
    const { entryId } = data;
    yield put(actions.entryCanClaim([entryId]));
    yield put(actions.entryGetBalance([entryId]));
    yield put(appActions.showNotification({
        id: 'claimSuccess',
        duration: 4,
        values: { entryTitle: data.entryTitle }
    }));
    yield put(actionActions.actionUpdateClaim(data));
}

function* entryClaimVote ({ actionId, entryId, entryTitle }) {
    const channel = getChannels().server.entry.claimVote;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const token = yield select(selectToken);
    yield apply(channel, channel.send, [{ actionId, token, entryId, entryTitle }]);
}

function* entryClaimVoteSuccess ({ data }) {
    const { entryId } = data;
    yield put(actions.entryCanClaimVote([entryId]));
    yield put(actions.entryGetVoteOf([entryId]));
    yield put(appActions.showNotification({
        id: 'claimVoteSuccess',
        duration: 4,
        values: { entryTitle: data.entryTitle }
    }));
    yield put(actionActions.actionUpdateClaimVote(data));
}

function* entryDownvote ({ actionId, entryId, entryTitle, ethAddress, weight, value }) {
    const channel = getChannels().server.entry.downvote;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const token = yield select(selectToken);
    yield apply(
        channel,
        channel.send,
        [{ actionId, token, entryId, entryTitle, ethAddress, weight, value }]
    );
}

function* entryDownvoteSuccess ({ data }) {
    const { getVoteRatio } = getChannels().server.entry;
    yield call(entryVoteSuccess, data.entryId); // eslint-disable-line no-use-before-define
    yield put(appActions.showNotification({
        id: 'downvoteEntrySuccess',
        duration: 4,
        values: { entryTitle: data.entryTitle }
    }));
    yield put(claimableActions.claimableIterator());
    yield apply(getVoteRatio, getVoteRatio.send, [{ entryId: data.entryId }]);
}

function* entryGetBalance ({ entryIds, claimable }) {
    const channel = getChannels().server.entry.getEntryBalance;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(channel, channel.send, [{ list: entryIds, claimable }]);
}

function* entryGetEndPeriod ({ entryIds }) {
    const channel = getChannels().server.entry.getVoteEndPeriod;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(channel, channel.send, [entryIds]);
}

function* entryGetExtraOfEntry (entryId, ethAddress) {
    const { canClaim, getEntryBalance, getVoteOf, getVoteRatio } = getChannels().server.entry;
    yield call(enableExtraChannels);
    const loggedEthAddress = yield select(selectLoggedEthAddress);
    const isOwnEntry = ethAddress && loggedEthAddress === ethAddress;
    yield apply(getVoteOf, getVoteOf.send, [{ list: [{ ethAddress: loggedEthAddress, entryId }] }]);
    yield apply(getVoteRatio, getVoteRatio.send, [{ entryId }]);
    if (isOwnEntry) {
        yield apply(getEntryBalance, getEntryBalance.send, [{ list: [entryId] }]);
        yield apply(canClaim, canClaim.send, [{ entryId: [entryId] }]);
    } else {
        const isFollower = yield select(state => selectIsFollower(state, ethAddress));
        if (isFollower === undefined) {
            yield put(profileActions.profileIsFollower([ethAddress]));
        }
    }
}

export function* entryGetExtraOfList (collection, columnId, asDrafts, batching) { // eslint-disable-line
    const { canClaim, getEntryBalance, getVoteOf } = getChannels().server.entry;
    yield call(enableExtraChannels);
    const loggedEthAddress = yield select(selectLoggedEthAddress);
    const allEntries = [];
    const ownEntries = [];
    const ethAddresses = [];
    collection.forEach((entry) => {
        const { ethAddress } = entry.author;
        allEntries.push({ ethAddress: loggedEthAddress, entryId: entry.entryId });
        if (!ethAddress) {
            console.error('entry with no author found', entry); //eslint-disable-line
        }
        if (ethAddress && !ethAddresses.includes(ethAddress)) {
            ethAddresses.push(ethAddress);
        }
        if (ethAddress && loggedEthAddress === ethAddress) {
            ownEntries.push(entry.entryId);
        }
    });

    if (ethAddresses.length) {
        yield put(profileActions.profileIsFollower(ethAddresses));
    }

    if (allEntries.length) {
        yield apply(getVoteOf, getVoteOf.send, [{ list: allEntries }]);
    }

    if (ownEntries.length) {
        yield apply(getEntryBalance, getEntryBalance.send, [{ list: ownEntries }]);
        yield apply(canClaim, canClaim.send, [{ entryId: ownEntries }]);
    }
    yield all([
        ...ethAddresses.map(ethAddress => put(profileActions.profileGetData({ ethAddress, batching }))),
        ...collection.map(collection => put(actions.entryGetShort({
            entryId: collection.entryId,
            ethAddress: collection.author.ethAddress,
            context: columnId,
            batching
        })))
    ]);
}

function* entryGetFull ({
    akashaId, entryId, ethAddress, version, asDraft, revert,
    publishedDateOnly, latestVersion
}) {
    const channel = getChannels().server.entry.getEntry;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(channel, channel.send, [{
        akashaId,
        entryId,
        ethAddress,
        full: true,
        version,
        asDraft,
        revert,
        publishedDateOnly,
        latestVersion
    }]);
    if (!asDraft && ethAddress) {
        yield put(profileActions.profileGetData({ ethAddress }));
    }
}

function* entryGetLatestVersion ({ entryId }) {
    const channel = getChannels().server.entry.getEntry;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(channel, channel.send, [{ entryId, full: true, latestVersion: true }]);
}

function* entryGetScore ({ entryId }) {
    const channel = getChannels().server.entry.getScore;
    yield apply(channel, channel.send, [{ entryId }]);
}

function* entryGetShort ({ context, entryId, ethAddress, batching, includeVotes }) {
    const channel = getChannels().server.entry.getEntry;
    yield apply(channel, channel.send, [{ context, entryId, ethAddress, batching, includeVotes }]);
}

function* entryGetVoteOf ({ entryIds, claimable }) {
    const channel = getChannels().server.entry.getVoteOf;
    const ethAddress = yield select(selectLoggedEthAddress);
    const request = entryIds.map(id => ({ entryId: id, ethAddress }));
    yield apply(channel, channel.send, [{ list: request, claimable }]);
}

function* entryListIterator ({ column, batching }) {
    const { id, value, limit = ENTRY_LIST_ITERATOR_LIMIT } = column;
    const collection = yield select(state => selectListEntries(state, value, limit));
    yield call(entryGetExtraOfList, collection, id, null, batching);
    yield put(actions.entryListIteratorSuccess({ collection }, { columnId: id, value, limit }));
}

function* entryMoreListIterator ({ column, batching }) {
    const { value, id, limit = ENTRY_LIST_ITERATOR_LIMIT } = column;
    const collection = yield select(state => selectListNextEntries(state, value, limit));
    yield call(entryGetExtraOfList, collection, id, null, batching);
    yield put(actions.entryMoreListIteratorSuccess({ collection }, { columnId: id, value, limit }));
}

function* entryMoreNewestIterator ({ column, batching }) {
    const channel = getChannels().server.entry.allStreamIterator;
    const { id, lastIndex, lastBlock } = column;
    yield apply(
        channel,
        channel.send,
        [{ columnId: id, limit: ALL_STREAM_LIMIT, toBlock: lastBlock, lastIndex, more: true, batching }]
    );
}

function* entryMoreProfileIterator ({ column, batching }) {
    const channel = getChannels().server.entry.entryProfileIterator;
    const { id, itemsList, value } = column;
    const isProfileEntries = id === 'profileEntries';
    const toBlock = !isProfileEntries ?
        yield select(state => selectColumnLastBlock(state, id)) :
        yield select(state => selectProfileEntriesLastBlock(state, value));
    const lastIndex = !isProfileEntries ?
        yield select(state => selectColumnLastIndex(state, id)) :
        yield select(state => selectProfileEntriesLastIndex(state, value));
    let akashaId, ethAddress; // eslint-disable-line
    if (isEthAddress(value)) {
        ethAddress = value;
    } else {
        akashaId = value;
    }
    yield apply(
        channel,
        channel.send,
        [{
            columnId: id,
            ethAddress, akashaId, limit: ITERATOR_LIMIT, toBlock, lastIndex,
            totalLoaded: itemsList.size,
            more: true,
            batching
        }]
    );
}

function* entryMoreStreamIterator ({ column, batching }) {
    const channel = getChannels().server.entry.followingStreamIterator;
    const { lastBlock, lastIndex, id } = column;
    const ethAddress = yield select(selectLoggedEthAddress);
    yield apply(
        channel,
        channel.send,
        [{
            columnId: id,
            ethAddress,
            limit: ITERATOR_LIMIT,
            toBlock: lastBlock,
            lastIndex,
            more: true,
            batching
        }]
    );
}

function* entryMoreTagIterator ({ column, batching }) {
    const channel = getChannels().server.entry.entryTagIterator;
    const { id, value, lastBlock, lastIndex } = column;
    yield apply(
        channel,
        channel.send,
        [{
            columnId: id,
            limit: ITERATOR_LIMIT,
            toBlock: lastBlock,
            lastIndex,
            tagName: value,
            more: true,
            batching
        }]
    );
}

function* entryNewestIterator ({ column, batching }) {
    const channel = getChannels().server.entry.allStreamIterator;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const { id, firstBlock, firstIndex, reversed } = column;
    const toBlock = reversed ? firstBlock : yield select(selectBlockNumber);
    const lastIndex = reversed ? firstIndex : 0;
    yield apply(channel, channel.send, [{
        columnId: id,
        limit: ALL_STREAM_LIMIT,
        reversed,
        toBlock,
        lastIndex,
        batching
    }]);
}

function* entryProfileIterator ({ column, batching }) {
    const { id, value, asDrafts, reversed, limit = ITERATOR_LIMIT, entryType, firstIndex } = column;
    if (value && !isEthAddress(value)) {
        yield put(profileActions.profileExists(value));
    }
    const channel = getChannels().server.entry.entryProfileIterator;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    let akashaId, ethAddress, lastIndex, toBlock, totalLoaded; // eslint-disable-line
    if (asDrafts) {
        toBlock = (yield select(selectDraftsLastBlock)) || (yield select(selectBlockNumber));
        lastIndex = yield select(selectDraftsLastIndex);
        totalLoaded = yield select(selectDraftsTotalLoaded);
    } else {
        toBlock = reversed ?
            yield select(state => selectColumnFirstBlock(state, id)) :
            yield select(selectBlockNumber);
        lastIndex = reversed ? firstIndex : column.lastIndex;
    }
    if (isEthAddress(value)) {
        ethAddress = value;
    } else {
        akashaId = value;
    }
    yield apply(
        channel,
        channel.send,
        [{ columnId: id, limit, akashaId,
            ethAddress, asDrafts, toBlock, reversed,
            lastIndex, entryType, totalLoaded, batching
        }]
    );
}

function* entryResolveIpfsHash ({ entryId, ipfsHash }) {
    const channel = getChannels().server.entry.resolveEntriesIpfsHash;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    yield apply(
        channel,
        channel.send,
        [{ ipfsHash: [ipfsHash], entryId, full: true }]
    );
}

function* entryStreamIterator ({ column, batching }) {
    const channel = getChannels().server.entry.followingStreamIterator;
    const { id, reversed, firstIndex } = column;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const toBlock = reversed ?
        yield select(state => selectColumnFirstBlock(state, id)) :
        yield select(selectBlockNumber);
    const lastIndex = reversed ? firstIndex : column.lastIndex;
    const ethAddress = yield select(selectLoggedEthAddress);
    yield apply(
        channel,
        channel.send,
        [{
            columnId: id,
            ethAddress,
            limit: ITERATOR_LIMIT,
            toBlock,
            lastIndex,
            reversed,
            batching
        }]
    );
}

function* entryTagIterator ({ column, batching }) {
    const { id, value, reversed, firstBlock, firstIndex } = column;
    yield put(tagActions.tagExists({ tagName: value }));
    const channel = getChannels().server.entry.entryTagIterator;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const toBlock = reversed ?
        firstBlock :
        yield select(selectBlockNumber);
    const lastIndex = reversed ? firstIndex : column.lastIndex;

    yield apply(
        channel,
        channel.send,
        [{
            columnId: id,
            limit: ITERATOR_LIMIT,
            tagName: value,
            toBlock,
            lastIndex,
            reversed,
            batching
        }]
    );
}

function* entryVoteSuccess (entryId) {
    yield put(actions.entryGetScore(entryId));
    yield put(actions.entryGetVoteOf([entryId]));
}

function* entryUpvote ({ actionId, entryId, entryTitle, ethAddress, weight, value }) {
    const channel = getChannels().server.entry.upvote;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const token = yield select(selectToken);
    yield apply(
        channel,
        channel.send,
        [{ actionId, token, entryId, entryTitle, ethAddress, weight, value }]
    );
}

function* entryUpvoteSuccess ({ data }) {
    const { getVoteRatio } = getChannels().server.entry;
    yield call(entryVoteSuccess, data.entryId);
    yield put(appActions.showNotification({
        id: 'upvoteEntrySuccess',
        duration: 4,
        values: { entryTitle: data.entryTitle }
    }));
    yield put(claimableActions.claimableIterator());
    yield apply(getVoteRatio, getVoteRatio.send, [{ entryId: data.entryId }]);
}

function* entryVoteCost () {
    const channel = getChannels().server.entry.voteCost;
    yield call(enableChannel, channel, getChannels().client.entry.manager);
    const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    yield apply(channel, channel.send, [weights]);
}

// Channel watchers

function* watchEntryCanClaimChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.canClaim);
        if (resp.error) {
            yield put(actions.entryCanClaimError(resp.error));
        } else {
            yield put(actions.entryCanClaimSuccess(resp.data));
        }
    }
}

function* watchEntryCanClaimVoteChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.canClaimVote);
        if (resp.error) {
            yield put(actions.entryCanClaimVoteError(resp.error));
        } else {
            yield put(actions.entryCanClaimVoteSuccess(resp.data));
        }
    }
}

function* watchEntryClaimChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.claim);
        const { actionId, entryId, entryTitle } = resp.request;
        const shouldApplyChanges = yield call(isLoggedProfileRequest, actionId);
        if (shouldApplyChanges) {
            if (resp.error) {
                yield put(actions.entryClaimError(resp.error, entryId, entryTitle));
                yield put(actionActions.actionDelete(actionId));
            } else if (resp.data.receipt) {
                yield put(actionActions.actionPublished(resp.data.receipt));
                if (!resp.data.receipt.success) {
                    yield put(actions.entryClaimError({}, entryId, entryTitle));
                }
            } else {
                const changes = { id: actionId, status: actionStatus.publishing, tx: resp.data.tx };
                yield put(actionActions.actionUpdate(changes));
            }
        }
    }
}

function* watchEntryClaimVoteChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.claimVote);
        const { actionId } = resp.request;
        const shouldApplyChanges = yield call(isLoggedProfileRequest, actionId);
        if (shouldApplyChanges) {
            if (resp.error) {
                yield put(actions.entryClaimVoteError(resp.error, resp.request));
                yield put(actionActions.actionDelete(actionId));
            } else if (resp.data.receipt) {
                yield put(actionActions.actionPublished(resp.data.receipt));
                if (!resp.data.receipt.success) {
                    yield put(actions.entryClaimVoteError({}, resp.request));
                }
            } else {
                const changes = { id: actionId, status: actionStatus.publishing, tx: resp.data.tx };
                yield put(actionActions.actionUpdate(changes));
            }
        }
    }
}

function* watchEntryDownvoteChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.downvote);
        const { actionId, entryId, entryTitle } = resp.request;
        const shouldApplyChanges = yield call(isLoggedProfileRequest, actionId);
        if (shouldApplyChanges) {
            if (resp.error) {
                yield put(actions.entryDownvoteError(resp.error, entryId, entryTitle));
                yield put(actionActions.actionDelete(actionId));
            } else if (resp.data.receipt) {
                yield put(actionActions.actionPublished(resp.data.receipt));
                if (!resp.data.receipt.success) {
                    yield put(actions.entryDownvoteError({}, entryId, entryTitle));
                }
            } else {
                const changes = { id: actionId, status: actionStatus.publishing, tx: resp.data.tx };
                yield put(actionActions.actionUpdate(changes));
            }
        }
    }
}

function* watchEntryGetBalanceChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getEntryBalance);
        const { collection } = resp.data;
        if (resp.error) {
            yield put(actions.entryGetBalanceError(resp.error));
        } else {
            if (resp.request.claimable) {
                for (let i = 0; i < collection.length; i++) {
                    const balance = collection[i];
                    if (balance.claimed) {
                        yield put(claimableActions.claimableDeleteEntry(balance.entryId));
                    }
                }
            }
            yield put(actions.entryGetBalanceSuccess(resp.data, resp.request));
        }
    }
}
/* eslint-disable complexity */
/* eslint-disable max-statements */
function* watchEntryGetChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getEntry);
        if (resp.error) {
            if (resp.request.asDraft) {
                yield put(actions.entryGetFullAsDraftError(resp.error));
            } else if (resp.request.latestVersion) {
                yield put(actions.entryGetLatestVersionError(resp.error));
            } else if (resp.request.full) {
                yield put(actions.entryGetFullError(resp.error));
            } else {
                yield put(actions.entryGetShortError(resp.error, resp.request));
            }
        } else if (resp.request.asDraft) {
            yield put(actions.entryGetFullAsDraftSuccess({ ...resp.data, ...resp.request }));
        } else if (resp.request.latestVersion && !resp.request.full) {
            // TODO Use getLatestEntryVersion channel
            const { content } = resp.data;
            yield put(actions.entryGetLatestVersionSuccess(content && content.version));
        } else if (resp.request.publishedDateOnly) {
            yield put(actions.entryGetVersionPublishedDateSuccess(resp.data, resp.request));
        } else if (resp.request.full && !resp.request.asDraft) {
            if (!resp.request.ethAddress) {
                resp.request.ethAddress = resp.data.ethAddress;
                yield put(profileActions.profileGetData({ ethAddress: resp.data.ethAddress }));
            }
            yield put(actions.entryGetFullSuccess(resp.data, resp.request));
            yield fork(entryGetExtraOfEntry, resp.request.entryId, resp.request.ethAddress);
            const version = resp.data.content && resp.data.content.version;
            if (version && version > 0 && !resp.request.publishedDateOnly) {
                for (let i = version; i >= 0; i -= 1) {
                    yield put(actions.entryGetFull({
                        version: i,
                        entryId: resp.data.entryId,
                        ethAddress: resp.request.ethAddress,
                        publishedDateOnly: true
                    }));
                }
            }
        } else {
            if(resp.request.includeVotes) {
                yield put(actions.entryGetVoteOf([resp.request.entryId]));
            }
            yield put(actions.entryGetShortSuccess(resp.data, resp.request));
        }
    }
}
/* eslint-enable complexity */
/* eslint-enable max-statements */

function* watchEntryGetEndPeriodChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getVoteEndPeriod);
        if (resp.error) {
            yield put(actions.entryGetEndPeriodError(resp.error));
        } else {
            yield put(actions.entryGetEndPeriodSuccess(resp.data));
        }
    }
}

function* watchEntryGetScoreChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getScore);
        if (resp.error) {
            yield put(actions.entryGetScoreError(resp.error));
        } else {
            yield put(actions.entryGetScoreSuccess(resp.data));
        }
    }
}

function* watchEntryGetVoteOfChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getVoteOf);
        const { collection } = resp.data;
        if (resp.error) {
            yield put(actions.entryGetVoteOfError(resp.error));
        } else {
            if (!resp.request.claimable) {
                const voteEntries = [];
                collection.forEach((vote) => {
                    if (vote.vote !== '0') {
                        voteEntries.push(vote.entryId);
                    }
                });
                if (voteEntries.length) {
                    yield put(actions.entryCanClaimVote(voteEntries));
                }
            } else {
                for (let i = 0; i < collection.length; i++) {
                    const vote = collection[i];
                    if (vote.claimed) {
                        yield put(claimableActions.claimableDeleteEntry(vote.entryId));
                    }
                }
            }
            yield put(actions.entryGetVoteOfSuccess(resp.data, resp.request));
        }
    }
}

function* watchEntryGetVoteRatioChannel () {
    while (true) {
        const response = yield take(actionChannels.entry.getVoteRatio);
        if (response.error) {
            yield put(actions.entryGetVoteRatioError(response.error));
        } else {
            yield put(actions.entryGetVoteRatioSuccess(response.data));
        }
    }
}

function* watchEntryListIteratorChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.getEntryList);
        if (resp.error) {
            yield put(actions.entryListIteratorError(resp.error));
        } else {
            const { entryId, ethAddress } = resp.data;
            const listName = resp.request[0].listName;
            const entryType = yield select(selectListEntryType, listName, entryId);
            resp.data.entryType = entryType;
            yield put(actions.entryListIteratorSuccess(resp.data, resp.request));
            yield fork(entryGetExtraOfEntry, entryId, ethAddress);
        }
    }
}

function* watchEntryNewestIteratorChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.allStreamIterator);
        yield fork(handleEntryNewestIteratorResponse, resp);
    }
}

function* handleEntryNewestIteratorResponse (resp) {
    if (resp.error) {
        if (resp.request.more) {
            yield put(actions.entryMoreNewestIteratorError(resp.error, resp.request));
        } else {
            yield put(actions.entryNewestIteratorError(resp.error, resp.request));
        }
    } else {
        const { columnId, reversed } = resp.request;
        if (!reversed) {
            yield call(entryGetExtraOfList, resp.data.collection, columnId);
        }
        if (resp.request.more) {
            yield put(actions.entryMoreNewestIteratorSuccess(resp.data, resp.request));
        } else {
            yield put(actions.entryNewestIteratorSuccess(resp.data, resp.request));
        }
    }
}

function* watchEntryProfileIteratorChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.entryProfileIterator);
        yield fork(handleEntryProfileIteratorResponse, resp);
    }
}

function* handleEntryProfileIteratorResponse (resp) { // eslint-disable-line max-statements, complexity
    const { columnId, asDrafts, reversed } = resp.request;
    if (resp.error) {
        if (resp.request.more) {
            yield put(actions.entryMoreProfileIteratorError(resp.error, resp.request));
        } else if (resp.request.asDrafts) {
            yield put(draftActions.entriesGetAsDraftsError(resp.error, resp.request));
        } else {
            yield put(actions.entryProfileIteratorError(resp.error, resp.request));
        }
    } else if (resp.request.more) {
        yield call(entryGetExtraOfList, resp.data.collection, columnId, asDrafts);
        yield put(actions.entryMoreProfileIteratorSuccess(resp.data, resp.request));
    } else if (resp.request.asDrafts) {
        const drafts = yield select(selectDrafts);
        const noResults = !resp.data.collection.length;
        const duplicatedResults = !noResults &&
            resp.data.collection.every(entry => !!drafts.get(entry.entryId));
        yield put(draftActions.entriesGetAsDraftsSuccess(resp.data, resp.request));
        const ethAddress = resp.request.ethAddress;
        const incomingDrafts = resp.data.collection;
        yield all(incomingDrafts.map(draft => put(actions.entryGetFull({
            entryId: draft.entryId,
            ethAddress,
            asDraft: true
        }))));
        /* If the iterator is called with "entryType" filter and it returns no new entries, automatically
         * continue to iterate until at least one entry is found or the end of the chain is reached
         */
        if (resp.request.entryType != null && resp.data.lastBlock && (noResults || duplicatedResults)) {
            const args = { ...resp.request, value: resp.request.ethAddress };
            yield fork(entryProfileIterator, args);
        }
        /* If the iterator is called with "entryType" filter and it returns no new entries, automatically
         * continue to iterate until at least one entry is found or the end of the chain is reached
         */
        if (resp.request.entryType != null && resp.data.lastBlock && (noResults || duplicatedResults)) {
            const args = { ...resp.request, value: resp.request.ethAddress };
            yield fork(entryProfileIterator, args);
        }
    } else {
        if (!reversed) {
            yield call(entryGetExtraOfList, resp.data.collection, columnId, asDrafts);
        }
        yield put(actions.entryProfileIteratorSuccess(resp.data, resp.request));
    }
}

function* watchEntryResolveIpfsHashChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.resolveEntriesIpfsHash);
        if (resp.error) {
            yield put(actions.entryResolveIpfsHashError(resp.error, resp.request));
        } else {
            yield put(actions.entryResolveIpfsHashSuccess(resp.data, resp.request));
        }
    }
}

function* watchEntryStreamIteratorChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.followingStreamIterator);
        yield fork(handleEntryStreamIteratorResponse, resp);
    }
}

function* handleEntryStreamIteratorResponse (resp) {
    if (resp.error) {
        if (resp.request.more) {
            yield put(actions.entryMoreStreamIteratorError(resp.error, resp.request));
        } else {
            yield put(actions.entryStreamIteratorError(resp.error, resp.request));
        }
    } else {
        const { columnId, reversed } = resp.request;
        if (!reversed) {
            yield call(entryGetExtraOfList, resp.data.collection, columnId);
        }
        if (resp.request.more) {
            yield put(actions.entryMoreStreamIteratorSuccess(resp.data, resp.request));
        } else {
            yield put(actions.entryStreamIteratorSuccess(resp.data, resp.request));
        }
    }
}

function* watchEntryTagIteratorChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.entryTagIterator);
        yield fork(handleEntryTagIteratorResponse, resp);
    }
}

function* handleEntryTagIteratorResponse (resp) {
    if (resp.error) {
        if (resp.request.more) {
            yield put(actions.entryMoreTagIteratorError(resp.error, resp.request));
        } else {
            yield put(actions.entryTagIteratorError(resp.error, resp.request));
        }
    } else {
        const { columnId, reversed } = resp.request;
        if (!reversed) {
            yield call(entryGetExtraOfList, resp.data.collection, columnId);
        }
        if (resp.request.more) {
            yield put(actions.entryMoreTagIteratorSuccess(resp.data, resp.request));
        } else {
            yield put(actions.entryTagIteratorSuccess(resp.data, resp.request));
        }
    }
}

function* watchEntryUpvoteChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.upvote);
        const { actionId, entryId, entryTitle } = resp.request;
        const shouldApplyChanges = yield call(isLoggedProfileRequest, actionId);
        if (shouldApplyChanges) {
            if (resp.error) {
                yield put(actions.entryUpvoteError(resp.error, entryId, entryTitle));
                yield put(actionActions.actionDelete(actionId));
            } else if (resp.data.receipt) {
                yield put(actionActions.actionPublished(resp.data.receipt));
                if (!resp.data.receipt.success) {
                    yield put(actions.entryUpvoteError({}, entryId, entryTitle));
                }
            } else {
                const changes = { id: actionId, status: actionStatus.publishing, tx: resp.data.tx };
                yield put(actionActions.actionUpdate(changes));
            }
        }
    }
}

function* watchEntryVoteCostChannel () {
    while (true) {
        const resp = yield take(actionChannels.entry.voteCost);
        if (resp.error) {
            yield put(actions.entryVoteCostError(resp.error));
        } else {
            yield put(actions.entryVoteCostSuccess(resp.data));
        }
    }
}

export function* registerEntryListeners () {
    yield fork(watchEntryCanClaimChannel);
    yield fork(watchEntryCanClaimVoteChannel);
    yield fork(watchEntryClaimChannel);
    yield fork(watchEntryClaimVoteChannel);
    yield fork(watchEntryDownvoteChannel);
    yield fork(watchEntryGetBalanceChannel);
    yield fork(watchEntryGetChannel);
    yield fork(watchEntryGetEndPeriodChannel);
    yield fork(watchEntryGetScoreChannel);
    yield fork(watchEntryGetVoteOfChannel);
    yield fork(watchEntryGetVoteRatioChannel);
    yield fork(watchEntryListIteratorChannel);
    yield fork(watchEntryNewestIteratorChannel);
    yield fork(watchEntryProfileIteratorChannel);
    yield fork(watchEntryResolveIpfsHashChannel);
    yield fork(watchEntryStreamIteratorChannel);
    yield fork(watchEntryTagIteratorChannel);
    yield fork(watchEntryUpvoteChannel);
    yield fork(watchEntryVoteCostChannel);
}

export function* watchEntryActions () { // eslint-disable-line max-statements
    yield takeEvery(types.ENTRY_CAN_CLAIM, entryCanClaim);
    yield takeEvery(types.ENTRY_CAN_CLAIM_VOTE, entryCanClaimVote);
    yield takeEvery(types.ENTRY_CLAIM, entryClaim);
    yield takeEvery(types.ENTRY_CLAIM_SUCCESS, entryClaimSuccess);
    yield takeEvery(types.ENTRY_CLAIM_VOTE, entryClaimVote);
    yield takeEvery(types.ENTRY_CLAIM_VOTE_SUCCESS, entryClaimVoteSuccess);
    yield takeEvery(types.ENTRY_DOWNVOTE, entryDownvote);
    yield takeEvery(types.ENTRY_DOWNVOTE_SUCCESS, entryDownvoteSuccess);
    yield takeEvery(types.ENTRY_GET_BALANCE, entryGetBalance);
    yield takeEvery(types.ENTRY_GET_END_PERIOD, entryGetEndPeriod);
    yield takeEvery(types.ENTRY_GET_FULL, entryGetFull);
    yield takeLatest(types.ENTRY_GET_LATEST_VERSION, entryGetLatestVersion);
    yield takeEvery(types.ENTRY_GET_SCORE, entryGetScore);
    yield takeEvery(types.ENTRY_GET_SHORT, entryGetShort);
    yield takeEvery(types.ENTRY_GET_VOTE_OF, entryGetVoteOf);
    yield takeEvery(types.ENTRY_LIST_ITERATOR, entryListIterator);
    yield takeEvery(types.ENTRY_MORE_LIST_ITERATOR, entryMoreListIterator);
    yield takeEvery(types.ENTRY_MORE_NEWEST_ITERATOR, entryMoreNewestIterator);
    yield takeEvery(types.ENTRY_MORE_PROFILE_ITERATOR, entryMoreProfileIterator);
    yield takeEvery(types.ENTRY_MORE_STREAM_ITERATOR, entryMoreStreamIterator);
    yield takeEvery(types.ENTRY_MORE_TAG_ITERATOR, entryMoreTagIterator);
    yield takeEvery(types.ENTRY_NEWEST_ITERATOR, entryNewestIterator);
    yield takeEvery(types.ENTRY_PROFILE_ITERATOR, entryProfileIterator);
    yield takeEvery(types.ENTRY_RESOLVE_IPFS_HASH, entryResolveIpfsHash);
    yield takeEvery(types.ENTRY_STREAM_ITERATOR, entryStreamIterator);
    yield takeEvery(types.ENTRY_TAG_ITERATOR, entryTagIterator);
    yield takeEvery(types.ENTRY_UPVOTE, entryUpvote);
    yield takeEvery(types.ENTRY_UPVOTE_SUCCESS, entryUpvoteSuccess);
    yield takeEvery(types.ENTRY_VOTE_COST, entryVoteCost);
}

export function* registerWatchers () {
    yield fork(registerEntryListeners);
    yield fork(watchEntryActions);
}

/* eslint-enable no-use-before-define */
