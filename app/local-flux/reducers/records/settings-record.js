import { List, Record } from 'immutable';
import { License } from './license-record';

export const GethSettings = Record({
    autodag: null,
    cache: '',
    datadir: null,
    fast: null,
    ipcpath: null,
    mine: null,
    minerthreads: null,
    networkid: null,
    syncmode: 'fast',
});

export const PortsRecord = Record({
    apiPort: null,
    gatewayPort: null,
    swarmPort: null
});

export const IpfsSettings = Record({
    ports: new PortsRecord(),
    storagePath: null,
});

export const HiddenContent = Record({
    checked: true,
    value: -30
});

export const NotificationsPreference = Record({
    feed: true,
    donations: true,
    comments: true,
    votes: true
});

export const PasswordPreference = Record({
    remember: false,
    time: null
});

export const UserSettings = Record({
    ethAddress: null,
    lastBlockNr: null,
    latestMention: null,
    defaultLicense: License(),
    hideCommentContent: new HiddenContent(),
    hideEntryContent: new HiddenContent(),
    notificationsPreference: new NotificationsPreference(),
    passwordPreference: new PasswordPreference(),
    trustedDomains: new List(),
    termsAccepted: false
});

export const GeneralSettings = Record({
    theme: 'light',
    configurationSaved: false,
    darkTheme: false,
    locale: 'en'
});

const Flags = Record({
    generalSettingsPending: false,
    savingGethSettings: false,
    savingIpfsSettings: false,
    savingUserSettings: false
});

export const SettingsRecord = Record({
    geth: new GethSettings(),
    defaultGethSettings: new GethSettings(),
    ipfs: new IpfsSettings(),
    defaultIpfsSettings: new IpfsSettings(),
    flags: new Flags(),
    userSettings: new UserSettings(),
    general: new GeneralSettings(),
});
