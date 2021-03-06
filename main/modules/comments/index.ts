import addComment from './add-comment';
import commentsCount from './comments-count';
import getComment from './get-comment';
import removeComment from './remove-comment';
import commentsIterator from './comments-iterator';
import commentsParentIterator from './comments-parent-iterator';
import getProfileComments from './get-profile-comments';
import resolveCommentsIpfsHash from './resolve-comments-ipfs-hash';
import downvoteComment from './downvote-comment';
import upvoteComment from './upvote-comment';
import voteOf from './vote-of';
import getScore from './get-score';

const exported: any = [
    addComment,
    commentsCount,
    getComment,
    removeComment,
    commentsIterator,
    commentsParentIterator,
    getProfileComments,
    resolveCommentsIpfsHash,
    downvoteComment,
    upvoteComment,
    voteOf,
    getScore
];

export default exported;
