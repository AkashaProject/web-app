import profileDB from './db/profile';

/**
 * Create a temporary profile in indexedDB
 * Notice: use `Table.add()` to prevent accidental update of the publishing temp profile
 *
 * @param {object} profileData - Data of the profile created
 * @param {object} currentStatus - Current status of the profile creation process
 */
export const createTempProfile = profileData =>
    profileDB.tempProfile
        .where('ethAddress')
        .equals(profileData.ethAddress)
        .first()
        .then((profile) => {
            if (profile) {
                profileDB.tempProfile.delete(profileData.ethAddress);
            }
            return profileDB.tempProfile.add({
                ...profileData
            })
                .then(ethAddress =>
                // return newly created temp profile
                    profileDB.tempProfile.where('ethAddress').equals(ethAddress).first()
                ).catch('ConstraintError', () =>
                // key already exists in the object store
                    profileDB.tempProfile.where('ethAddress').equals(profileData.ethAddress).first()
                );
        })
        .catch((err) => {
            console.error(err, 'db error!');
            return err;
        });
/**
 * update temp profile
 * handles temp profile nested updates
 * @param tempProfile <Object> with key/val that must be updated
 * @param status <Object> Optional, status of the temp profile
 * @return Promise => when resolved => profileData
 */

export const updateTempProfile = (tempProfile, status) =>
    profileDB.tempProfile
        .where('ethAddress')
        .equals(tempProfile.ethAddress)
        .modify((tmpProf) => {
            Object.keys(tempProfile).forEach((key) => {
                tmpProf[key] = tempProfile[key];
            });
            if (status && typeof status === 'object') {
                if (!tmpProf.status) tmpProf.status = {};
                Object.keys(status).forEach((key) => {
                    tmpProf.status[key] = status[key];
                });
            }
        })
        .then((updated) => {
            if (updated) {
                return profileDB.tempProfile
                    .where('ethAddress')
                    .equals(tempProfile.ethAddress)
                    .first();
            }
            return tempProfile;
        })
        .catch(err => err);
/**
 * Delete temporary profile. Called after profile was successfully created
 */
export const deleteTempProfile = ethAddress =>
    profileDB.tempProfile
        .delete(ethAddress)
        .catch(err => err);

/**
 * Get all available temporary profiles
 * @return promise
 */
export const getTempProfile = ethAddress =>
    profileDB.tempProfile
        .where('ethAddress')
        .equals(ethAddress)
        .first()
        .then(profile =>
            profile
        )
        .catch((err) => {
            console.error(err, 'db error!');
            return err;
        });
/**
 * Registry Service.
 * default open channels => ['getCurrentProfile', 'getByAddress']
 * available channels =>
 * ['manager', 'profileExists', 'registerProfile', 'getCurrentProfile', 'getByAddress']
 */
// class RegistryService extends BaseService {
//     constructor () {
//         super();
//         this.clientManager = Channel.client.registry.manager;
//     }

//     /**
//      * create a new profile
//      * Request:
//      * @param <object> {
//      *      token: String;
//      *      akashaId: string;
//      *      ipfs: IpfsProfileCreateRequest;
//      *      gas?: number;
//      * }
//      * Response:
//      * @param data = { tx: string }
//      */
//     registerProfile = ({ token, akashaId, ipfs, gas = 2000000, onError, onSuccess }) => {
//         this.openChannel({
//             clientManager: this.clientManager,
//             serverChannel: Channel.server.registry.registerProfile,
//             clientChannel: Channel.client.registry.registerProfile,
//             listenerCb: this.createListener(
//                 onError,
//                 onSuccess,
//                 Channel.client.registry.registerProfile.channelName
//             )
//         }, () => {
//             Channel.server.registry.registerProfile.send({ token, akashaId, ipfs, gas });
//         });
//     };
//     /**
//      * Get eth address of the logged profile
//      * Request: {}
//      * Response:
//      * @param data = {ethAddress: String}
//      */
//     getCurrentProfile = ({ onError, onSuccess }) => {
//         this.registerListener(
//             Channel.client.registry.getCurrentProfile,
//             this.createListener(onError, onSuccess)
//         );
//         Channel.server.registry.getCurrentProfile.send({});
//     };
//     /**
//      * return contract address for a given eth address
//      * Request:
//      *  @param ethAddress <String> eth address
//      * Response:
//      *  @param data = { profileAddress: String } -> profile contract address
//      */
//     getByAddress = ({ ethAddress, onSuccess, onError }) => {
//         this.registerListener(
//             Channel.client.registry.getByAddress,
//             this.createListener(onError, onSuccess)
//         );
//         Channel.server.registry.getByAddress.send(ethAddress);
//     };
//     /**
//      * Update temporary profile in indexedDB
//      * @param {string} akashaId
//      * @param {object} changes - Contains data of the updated profile
//      * @return promise
//      */
//
// }

// export { RegistryService };