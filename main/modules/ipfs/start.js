import * as Promise from 'bluebird';
import IpfsConnector from '@akashaproject/ipfs-js-connector';
import { defaultPath, IPFS_PEER_ID, generalSettings, BASE_URL } from '../../config/settings';
const execute = Promise.coroutine(function* (data) {
    if (IpfsConnector.getInstance().serviceStatus.process) {
        throw new Error('IPFS is already running');
    }
    IpfsConnector.getInstance().setIpfsFolder(data.hasOwnProperty('storagePath') ? data.storagePath : defaultPath);
    yield IpfsConnector.getInstance().start();
    IpfsConnector.getInstance()
        .api
        .apiClient
        .bootstrap
        .add(IPFS_PEER_ID, (err) => {
        if (err) {
            console.log('add ipfs peer err ', err);
        }
    });
    generalSettings.set(BASE_URL, 'https://ipfs.io/ipfs/');
    return { started: true };
});
export default { execute, name: 'startService' };
//# sourceMappingURL=start.js.map