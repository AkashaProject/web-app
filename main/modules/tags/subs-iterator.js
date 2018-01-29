import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
const execute = Promise.coroutine(function* (data) {
    let currentId = (data.start) ? data.start : yield contracts.instance.subs.subsFirst(data.akashaId);
    if (currentId === '0') {
        return { collection: [], akashaId: data.akashaId };
    }
    let currentName;
    let counter = 0;
    const maxResults = (data.limit) ? data.limit : 10;
    const results = [];
    if (!data.start) {
        currentName = yield contracts.instance.tags.getTagName(currentId);
        results.push({ tagId: currentId, tagName: currentName });
        counter = 1;
    }
    while (counter < maxResults) {
        currentId = yield contracts.instance.subs.subsNext(data.akashaId, currentId);
        if (currentId === '0') {
            break;
        }
        currentName = yield contracts.instance.tags.getTagName(currentId);
        results.push({ tagId: currentId, tagName: currentName });
        counter++;
    }
    return { collection: results, akashaId: data.akashaId, limit: maxResults };
});
export default { execute, name: 'tagSubIterator' };
//# sourceMappingURL=subs-iterator.js.map