import {List} from 'immutable';
import * as types from '../constants';
import {createReducer} from './create-reducer';
import {
    GeneralSettings,
    GethSettings,
    HiddenContent,
    IpfsSettings,
    NotificationsPreference,
    PasswordPreference,
    PortsRecord,
    SettingsRecord,
    UserSettings
} from './records';


const initialState = new SettingsRecord();

const getUserSettings = (state, record) => {
    const data = Object.assign({}, record);
    const preference = new PasswordPreference(data.passwordPreference);
    const hideComment = new HiddenContent(data.hideCommentContent);
    const hideEntry = new HiddenContent(data.hideEntryContent);
    const notifPreferences = new NotificationsPreference(data.notificationsPreference);
    if (!data.defaultLicense) {
        data.defaultLicense = state.getIn(['userSettings', 'defaultLicense']);
    }
    if (data.trustedDomains) {
        data.trustedDomains = new List(data.trustedDomains);
    }
    return new UserSettings(data).merge({
        hideCommentContent: hideComment,
        hideEntryContent: hideEntry,
        notificationsPreference: notifPreferences,
        passwordPreference: preference
    });
};

const mergeUserSettings = (state, record) => {
    const data = Object.assign({}, record);
    const changes = {};
    if (data.passwordPreference) {
        changes.passwordPreference = new PasswordPreference(data.passwordPreference);
    }
    if (data.hideCommentContent) {
        changes.hideCommentContent = new HiddenContent(data.hideCommentContent);
    }
    if (data.hideEntryContent) {
        changes.hideEntryContent = new HiddenContent(data.hideEntryContent);
    }
    if (data.notificationsPreference) {
        changes.notificationsPreference = new NotificationsPreference(data.notificationsPreference);
    }
    if (data.trustedDomains) {
        changes.trustedDomains = new List(data.trustedDomains);
    }
    return state.get('userSettings').merge(data).merge(changes);
};

const settingsState = createReducer(initialState, {

    [types.GETH_SETTINGS_SUCCESS]: (state, { data }) => {
        const defaultSettings = new GethSettings().toJS();
        const newSettings = {};
        Object.keys(data).forEach((key) => {
            if (key !== 'name' && data[key] !== defaultSettings[key]) {
                newSettings[key] = data[key];
            }
        });

        return state.merge({
            geth: state.get('geth').merge(newSettings),
        });
    },

    [types.IPFS_SETTINGS_SUCCESS]: (state, {data}) => {
        const defaultSettings = new IpfsSettings().toJS();
        const newSettings = {};
        Object.keys(data).forEach((key) => {
            if (key !== 'ports' && key !== 'name' && data[key] !== defaultSettings[key]) {
                newSettings[key] = data[key];
            }
        });

        return state.merge({
            ipfs: state.get('ipfs').merge(newSettings),
        });
    },

    [types.GETH_SAVE_SETTINGS]: state =>
        state.merge({
            flags: state.get('flags').merge({savingGethSettings: true})
        }),

    [types.GETH_SAVE_SETTINGS_SUCCESS]: (state, {data}) =>
        state.merge({
            flags: state.get('flags').merge({savingGethSettings: false}),
            geth: state.get('geth').merge(data)
        }),

    [types.GETH_SAVE_SETTINGS_ERROR]: state =>
        state.merge({
            flags: state.get('flags').merge({savingGethSettings: false})
        }),

    [types.IPFS_SAVE_SETTINGS]: state =>
        state.merge({
            flags: state.get('flags').merge({savingIpfsSettings: true})
        }),

    [types.IPFS_SAVE_SETTINGS_SUCCESS]: (state, {data}) =>
        state.merge({
            flags: state.get('flags').merge({savingIpfsSettings: false}),
            ipfs: state.get('ipfs').merge(data)
        }),

    [types.IPFS_SAVE_SETTINGS_ERROR]: state =>
        state.merge({
            flags: state.get('flags').merge({savingIpfsSettings: false})
        }),

    // [types.SAVE_LATEST_MENTION_SUCCESS]: (state, { data }) =>
    //     state.merge({
    //         userSettings: state.get('userSettings').merge({
    //             latestMention: data
    //         })
    //     }),

    // [types.SAVE_LATEST_MENTION_ERROR]: (state, { error }) =>
    //     state.merge({
    //         errors: state.get('errors').push(new ErrorRecord(error)),
    //     }),

    // [types.CHANGE_THEME]: (state, action) => state.updateIn(['general', 'theme'], () => action.theme),

    [types.GENERAL_SETTINGS]: state =>
        state.setIn(['flags', 'generalSettingsPending'], true),

    [types.GENERAL_SETTINGS_SUCCESS]: (state, {data}) =>
        state.merge({
            general: new GeneralSettings(data),
            flags: state.get('flags').set('generalSettingsPending', false)
        }),

    [types.GENERAL_SETTINGS_ERROR]: state =>
        state.setIn(['flags', 'generalSettingsPending'], false),

    [types.GENERAL_SETTINGS_SAVE_SUCCESS]: (state, {data}) =>
        state.merge({
            general: state.get('general').merge(data)
        }),

    [types.GETH_GET_OPTIONS_SUCCESS]: (state, action) => {
        const gethSettings = Object.assign({}, state.get('geth').toJS());
        const initialSettings = new GethSettings().toJS();

        Object.keys(gethSettings).forEach((key) => {
            if (gethSettings[key] === initialSettings[key]) {
                gethSettings[key] = action.data[key];
            }
        });

        if (!action.data.syncmode) {
            gethSettings.syncmode = initialSettings.syncmode;
        }

        return state.merge({
            geth: new GethSettings(gethSettings),
            defaultGethSettings: new GethSettings(action.data)
        });
    },

    [types.IPFS_GET_CONFIG_SUCCESS]: (state, action) => {
        const ipfsSettings = Object.assign({}, state.get('ipfs').toJS());
        if (ipfsSettings.ports) {
            delete ipfsSettings.ports;
        }
        const initialSettings = new IpfsSettings().toJS();

        Object.keys(ipfsSettings).forEach((key) => {
            if (key !== 'ports' && ipfsSettings[key] === initialSettings[key]) {
                ipfsSettings[key] = action.data[key];
            }
        });

        return state.merge({
            ipfs: new IpfsSettings(ipfsSettings),
            defaultIpfsSettings: new IpfsSettings(action.data)
        });
    },

    [types.IPFS_GET_PORTS_SUCCESS]: (state, {data}) => {
        const ports = {
            apiPort: Number(data.apiPort),
            gatewayPort: Number(data.gatewayPort),
            swarmPort: Number(data.swarmPort)
        };
        return state.merge({
            ipfs: state.get('ipfs').merge({
                ports: new PortsRecord(ports)
            })
        });
    },

    [types.IPFS_RESET_PORTS]: state =>
        state.merge({
            ipfs: state.get('ipfs').merge({
                ports: new PortsRecord()
            })
        }),

    [types.PROFILE_LOGOUT_SUCCESS]: state =>
        state.set('userSettings', new UserSettings()),

    [types.USER_SETTINGS_CLEAR]: state =>
        state.set('userSettings', new UserSettings()),

    [types.USER_SETTINGS_REQUEST]: state =>
        state.set('userSettings', new UserSettings()),

    [types.USER_SETTINGS_SUCCESS]: (state, {data}) =>
        state.set('userSettings', getUserSettings(state, data)),

    [types.USER_SETTINGS_SAVE]: state =>
        state.setIn(['flags', 'savingUserSettings'], true),

    [types.USER_SETTINGS_SAVE_ERROR]: state =>
        state.setIn(['flags', 'savingUserSettings'], false),

    [types.USER_SETTINGS_SAVE_SUCCESS]: (state, {data}) =>
        state.merge({
            flags: state.get('flags').set('savingUserSettings', false),
            userSettings: mergeUserSettings(state, data)
        }),

    [types.USER_SETTINGS_ADD_TRUSTED_DOMAIN_SUCCESS]: (state, {data}) =>
        state.merge({
            userSettings: mergeUserSettings(state, data)
        }),

    [types.CLEAN_STORE]: state =>
        state.merge({
            userSettings: new UserSettings()
        }),
});

export default settingsState;
