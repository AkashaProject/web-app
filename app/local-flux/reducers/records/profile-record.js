import { List, Map, Record, Collection } from 'immutable';
import { genId } from '../../../utils/dataModule';

export const AethBalance = Record({
    bonded: null,
    cycling: null,
    free: null,
    total: null
});

export const EssenceBalance = Record({
    aethValue: null,
    total: null
});
export const EssenceIterator = Record({
    lastBlock: null,
    lastIndex: null
});
export const ManaBalance = Record({
    remaining: null,
    spent: null,
    total: null
});

export const Balance = Record({
    aeth: new AethBalance(),
    essence: new EssenceBalance(),
    eth: null,
    mana: new ManaBalance(),
});

const CyclingRecord = Record({
    collection: [],
    total: null
});

export const CyclingStates = Record({
    available: new CyclingRecord(),
    pending: new CyclingRecord()
});

const ManaBurned = Record({
    comments: 0,
    entriesTotal: 0,
    votes: 0
});

export const ProfileRecord = Record({
    about: '',
    akashaId: '',
    avatar: null,
    backgroundImage: {},
    baseUrl: '',
    commentsCount: '0',
    donationsEnabled: false,
    entriesCount: '0',
    essence: null,
    ethAddress: null,
    firstName: '',
    followersCount: null,
    followingCount: null,
    ipfsHash: '',
    karma: null,
    lastName: '',
    links: [],
    profile: null,
    subscriptionsCount: null,
});

export const LoggedProfile = Record({
    akashaId: null,
    ethAddress: null,
    expiration: null,
    token: null
    // token: genId(),
});

const Flags = Record({
    ethAddressPending: false,
    fetchingEssenceIterator: false,
    fetchingFollowers: new Map(),
    fetchingFollowings: new Map(),
    fetchingLocalProfiles: false,
    fetchingLoggedProfile: false,
    fetchingMoreEssenceIterator: false,
    fetchingMoreFollowers: new Map(),
    fetchingMoreFollowings: new Map(),
    fetchingProfileList: false,
    karmaRankingPending: false,
    localProfilesFetched: false,
    loginPending: false,
    pendingListProfiles: new Map(),
    pendingProfiles: new Map(),
    resolvingIpfsHash: new Map(),
});

const Interests = Record({
    tag: new List(),
    profile: new List()
});

export const ProfileExistsRecord = Record({
    exists: null,
    idValid: null,
    normalisedId: null
});

export const ProfileState = Record({
    allFollowings: new List(),
    balance: new Balance(),
    byEthAddress: new Map(),
    byId: new Map(),
    canCreateTags: false,
    cyclingStates: new CyclingStates(),
    essenceEvents: new Collection.Set([]),
    essenceIterator: new EssenceIterator(),
    errors: new List(), // to be removed
    exists: new Map(),
    faucet: null,
    fetchingFullLoggedProfile: false, // to be removed
    flags: new Flags(),
    followers: new Map(),
    followersList: new List(), // to be removed
    followings: new Map(),
    followingsList: new List(), // to be removed
    interests: new Interests(),
    isFollower: new Map(),
    karmaRanking: new Map(),
    lastFollower: new Map(),
    lastFollowing: new Map(),
    localProfiles: new List(),
    loggedProfile: new LoggedProfile(),
    loginErrors: new List(),
    manaBurned: new ManaBurned(),
    moreFollowers: new Map(),
    moreFollowings: new Map(),
    profiles: new List(), // to be removed
    publishingCost: new Map(),
});
