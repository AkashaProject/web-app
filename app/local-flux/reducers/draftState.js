import { editorStateFromRaw } from 'megadraft';
import { DraftModel } from './models';
import { createReducer } from './create-reducer';
import { entryTypes } from '../../constants/entry-types';
import { DraftsIterator, MetaInfo } from './records/draft-record';
import * as types from '../constants';

const initialState = new DraftModel();

const determineEntryType = (content) => {
    if (content.cardInfo && content.cardInfo.url) {
        return 'link';
    }
    return 'article';
};

export const sortByDate = (drafts, list) =>
    list.sort((a, b) => {
        const draftA = drafts.get(a);
        const draftB = drafts.get(b);
        const timestampA = draftA.getIn(['meta', 'updated']) || draftA.getIn(['meta', 'created']);
        const timestampB = draftB.getIn(['meta', 'updated']) || draftB.getIn(['meta', 'created']);
        if (!timestampA) {
            return -1;
        }
        if (new Date(timestampA) > new Date(timestampB)) {
            return -1;
        }
        if (new Date(timestampA) < new Date(timestampB)) {
            return 1;
        }
        return 0;
    });

const draftState = createReducer(initialState, {
    [types.DRAFT_CREATE_SUCCESS]: (state, { data }) =>
        state.merge({
            draftList: state.get('draftList').unshift(data.id),
            drafts: state.get('drafts').set(data.id, DraftModel.createDraft(data)),
            selection: state.get('selection').setIn([data.id, data.ethAddress], data.selectionState)
        }),

    [types.DRAFT_UPDATE_SUCCESS]: (state, { data }) =>
        state.merge({
            draftList: sortByDate(state.get('drafts'), state.get('draftList')),
            drafts: state.get('drafts').updateIn([data.draft.id], draft =>
                draft.merge(data.draft).set('saved', false)),
            selection: state.get('selection').setIn(
                [data.draft.id, data.draft.ethAddress],
                data.selectionState
            ),
        }),

    [types.DRAFTS_GET_SUCCESS]: (state, { data }) =>
        state.withMutations((stateMap) => {
            stateMap.mergeIn(['drafts'], data.drafts)
                .set('draftsFetched', true)
                .set('draftsCount', data.drafts.size)
                .set('fetchingDrafts', false);
            const ids = data.drafts.toList()
                .filter(drf => !stateMap.get('draftList').includes(drf.id))
                .map(drf => drf.id);
            let list = stateMap
                .get('draftList')
                .concat(ids);
            list = sortByDate(stateMap.get('drafts'), list);
            stateMap.set('draftList', list);
        }),

    [types.DRAFTS_GET]: state =>
        state.set('fetchingDrafts', true),

    [types.DRAFT_AUTOSAVE]: (state, { data }) =>
        state.updateIn(['drafts', data.id], draft =>
            draft.merge({
                saved: false,
                saving: true
            })),

    [types.DRAFT_AUTOSAVE_SUCCESS]: (state, { data }) =>
        state.withMutations(stateMap =>
            stateMap.updateIn(['drafts', data.id], draft =>
                draft.merge({
                    saved: true,
                    saving: false,
                    localChanges: true,
                })).set('draftsCount', state.get('drafts').size)
        ),
    [types.DRAFT_ADD_TAG]: (state, { data }) =>
        state.setIn(['drafts', data.draftId, 'tags', data.tagName], { checking: true }),

    [types.DRAFT_ADD_TAG_SUCCESS]: (state, { data }) =>
        state.mergeIn(['drafts', data.draftId, 'tags', data.tagName], {
            checking: false,
            exists: data.exists
        }),

    // state.mergeIn(['drafts', data.draftId, 'tags'], {
    //     name: data.tag,
    //     exists: data.exists
    // }),

    [types.DRAFT_REMOVE_TAG]: (state, { data }) =>
        state.deleteIn(['drafts', data.draftId, 'tags', data.tagName]),

    [types.DRAFT_GET_BY_ID_SUCCESS]: (state, { data }) =>
        state.setIn(['drafts', data.draft.id], data.draft),

    [types.DRAFTS_GET_COUNT_SUCCESS]: (state, { data }) => {
        if (data.count > 0) {
            return state.set('draftsCount', data.count);
        }
        return state.set('draftsFetched', true);
    },

    [types.DRAFT_DELETE_SUCCESS]: (state, { data }) =>
        state.merge({
            draftList: state.get('draftList').filter(id => id !== data.draftId),
            drafts: state.get('drafts').delete(data.draftId),
            draftsCount: state.get('drafts').delete(data.draftId).size,
            selection: state.get('selection').delete(data.draftId)
        }),

    // draft = { id, title, type }
    [types.DRAFT_PUBLISH]: (state, { draft }) =>
        state.setIn(['drafts', draft.id, 'publishing'], true),

    // data.draft
    [types.DRAFT_PUBLISH_SUCCESS]: (state, { data }) =>
        state.merge({
            draftList: state.get('draftList').filter(id => id !== data.draft.id),
            drafts: state.get('drafts').delete(data.draft.id)
        }),

    [types.DRAFT_PUBLISH_UPDATE]: (state, { draft }) =>
        state.setIn(['drafts', draft.id, 'publishing'], true),

    [types.DRAFT_PUBLISH_UPDATE_SUCCESS]: (state, { data }) =>
        state.setIn(['drafts', data.draft.id, 'publishing'], false),

    [types.DRAFT_PUBLISH_ERROR]: (state, { draftId }) =>
        state.setIn(['drafts', draftId, 'publishing'], false),

    [types.DRAFT_PUBLISH_UPDATE_ERROR]: (state, { draftId }) =>
        state.setIn(['drafts', draftId, 'publishing'], false),

    [types.DRAFT_RESET_ITERATOR]: state =>
        state.set('iterator', new DraftsIterator()),

    [types.ENTRIES_GET_AS_DRAFTS_SUCCESS]: (state, { data, request }) =>
        /**
         * check if entry already in store, if it`s already in store,
         * check if entry version is up to date, if not update it.
         */
        state.withMutations((mState) => {
            const { collection, lastBlock, lastIndex } = data;
            collection.forEach((entry) => {
                /**
                 * if entry is not in store, add it
                 */
                if (!mState.getIn(['drafts', entry.entryId])) {
                    mState.setIn(['drafts', entry.entryId], DraftModel.createDraft({
                        content: {
                            ...entry.content,
                            entryType: entryTypes[entry.entryType],
                        },
                        tags: DraftModel.addExistingTags(entry.tags),
                        onChain: true
                    }));
                } else {
                    mState.mergeIn(['drafts', entry.entryId], {
                        entryEth: entry.entryEth,
                        active: entry.active,
                        score: entry.score,
                        baseUrl: entry.baseUrl,
                        saved: true,
                        onChain: true
                    });
                }
                mState
                    .set('resolvingEntries', mState.get('resolvingEntries').push(entry.entryId));
            });
            mState.set('iterator', new DraftsIterator({
                lastBlock,
                lastIndex,
                moreEntries: request.limit === collection.length,
                totalLoaded: mState.getIn(['iterator', 'totalLoaded']) + collection.length
            }));
        }),

    [types.ENTRY_GET_FULL_AS_DRAFT_SUCCESS]: (state, { data }) => {
        const { entryId, content, publishDate } = data;
        const existingDraft = state.getIn(['drafts', entryId]);
        return state.withMutations((mState) => {
            if ((existingDraft && !existingDraft.get('localChanges') && content) || data.revert) {
                const { draftParts, tags, ...newDraftContent } = content;
                mState.mergeIn(['drafts', entryId], DraftModel.createDraft({
                    ...existingDraft.toJS(),
                    content: {
                        ...newDraftContent,
                        draft: editorStateFromRaw(data.content.draft),
                        latestVersion: data.revert ?
                            existingDraft.getIn(['content', 'latestVersion']) :
                            content.version,
                        entryType: content.entryType > -1 ?
                            entryTypes[content.entryType] :
                            determineEntryType(content),
                    },
                    saved: false,
                    localChanges: false,
                    tags: DraftModel.addExistingTags(tags),
                    id: entryId,
                    meta: new MetaInfo({ created: new Date(publishDate * 1000) })
                }));
                if (!mState.get('draftList').includes(entryId)) {
                    let newList = mState.get('draftList').push(entryId);
                    newList = sortByDate(mState.get('drafts'), newList);
                    mState.set('draftList', newList);
                }
            }
            mState.set('resolvingEntries',
                mState.get('resolvingEntries').delete(mState.get('resolvingEntries').indexOf(entryId))
            );
        });
    },
    [types.PROFILE_LOGOUT_SUCCESS]: () => initialState,
});

export default draftState;