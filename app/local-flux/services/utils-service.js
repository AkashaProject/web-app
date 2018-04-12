import getChannels from 'akasha-channels';

// export const backupKeys = ({ target, onSuccess, onError }) => {
//     const clientChannel = Channel.client.utils.backupKeys;
//     const serverChannel = Channel.server.utils.backupKeys;
//     this.openChannel({
//         clientManager: this.clientManager,
//         serverChannel,
//         clientChannel,
//         listenerCb: this.createListener(
//             onError,
//             onSuccess,
//             clientChannel.channelName
//         )
//     }, () => {
//         serverChannel.send({ target });
//     });
// };

export const uploadImage = (files, imgId) => {
    const serverChannel = getChannels().server.utils.uploadImage;
    const clientChannel = getChannels().client.utils.uploadImage;
    getChannels().server.utils.uploadImage.enable();

    return new Promise((resolve, reject) => {
        clientChannel.once(({ data }) => {
            if (data.error) return reject(data.error);
            if (files instanceof Uint8Array) {
                return resolve(data.collection[0].hash);
            }
            const filesArr = data.collection;
            filesArr.forEach((file) => {
                files[file.size].src = file.hash;
            });
            // console.log(files, 'the new files with ipfs hash');
            return resolve(files);
        });
        if (files instanceof Uint8Array) {
            serverChannel.send([{ source: files }]);
        } else {
            serverChannel.send(
                Object.keys(files)
                    .map(fileKey => ({
                        size: fileKey,
                        id: imgId,
                        source: files[fileKey].src
                    })));
        }
    });
};