import * as Promise from 'bluebird';
import IpfsConnector from '@akashaproject/ipfs-js-connector';

const execute = Promise.coroutine(function*() {
    yield IpfsConnector.getInstance().stop();
    return { stopped: true };
});

export default { execute, name: 'stopService' };