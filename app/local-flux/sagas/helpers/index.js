import { eventChannel } from 'redux-saga';
import getChannels from 'akasha-channels';
import { put, select, take } from 'redux-saga/effects';
import { tap } from 'ramda';
import { selectAction, selectLoggedEthAddress } from '../../selectors';

export const actionChannels = {};
export const enabledChannels = [];

// this function creates an event channel from a given ipc client channel
export function createActionChannel (channel) {
    return eventChannel((emit) => {
        const handler = (resp) => {
            tap(emit, resp);
        };
        channel.on(handler);

        const unsubscribe = () => {
            channel.removeListener(handler);
        };

        return unsubscribe;
    });
}

export function createActionChannels () {
    const modules = Object.keys(getChannels().client);
    modules.forEach((module) => {
        const channels = Object.keys(getChannels().client[module]);
        actionChannels[module] = {};
        channels.forEach((channel) => {
            actionChannels[module][channel] = createActionChannel(getChannels().client[module][channel]);
        });
    });
}

export function enableChannel (channel) {
    return new Promise((resolve) => {
        if (enabledChannels.indexOf(channel.channel) !== -1) {
            return resolve();
        }
        enabledChannels.push(channel.channel);
        channel.enable();
        return resolve();
    });
}

export function* isLoggedProfileRequest (actionId) {
    const action = yield select(state => selectAction(state, actionId));
    const loggedEthAddress = yield select(selectLoggedEthAddress);
    return action && action.get('ethAddress') === loggedEthAddress;
}

export function* registerListener ({ channel, successAction, errorAction }) {
    while (true) {
        const resp = take(channel);
        if (resp.error && errorAction) {
            yield put(errorAction());
        } else if (successAction) {
            yield put(successAction());
        }
    }
}
