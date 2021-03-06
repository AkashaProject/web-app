import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Comment, CommentEditor, OptimisticComment } from '../';
import { actionAdd } from '../../local-flux/actions/action-actions';
import { commentsMoreIterator } from '../../local-flux/actions/comments-actions';
import { selectEntry, selectEntryCommentsForParent, selectFullEntry, selectLoggedProfileData,
    selectMoreComments, selectProfile } from '../../local-flux/selectors';
import { entryMessages } from '../../locale-data/messages';
import { getDisplayName } from '../../utils/dataModule';

class CommentThread extends Component {
    componentDidUpdate (prevProps) {
        if (this.props.replyTo && prevProps.replyTo !== this.props.replyTo &&
                this.commentEditorRef) {
            if(typeof this.commentEditorRef.baseNodeRef.scrollIntoViewIfNeeded === 'function') {
                this.commentEditorRef.baseNodeRef.scrollIntoViewIfNeeded(false);
            } else {
                this.commentEditorRef.baseNodeRef.scrollIntoView();
            }
        }
    }

    shouldComponentUpdate (nextProps) {
        const { comment, pendingComments, replies, replyTo } = nextProps;
        if (
            !comment.equals(this.props.comment) ||
            !pendingComments.equals(this.props.pendingComments) ||
            !replies.equals(this.props.replies) ||
            replyTo !== this.props.replyTo
        ) {
            return true;
        }
        return false;
    }

    getEditorRef = (editor) => {
        this.commentEditorRef = editor && editor.refs.clickAwayableElement;
    };

    loadMoreReplies = () => {
        const { comment, entryId } = this.props;
        this.props.commentsMoreIterator({ entryId, parent: comment.commentId });
    }

    renderOptimisticComments = () => {
        const { containerRef, comment, loggedProfileData, pendingComments } = this.props;
        const optimisticComments = pendingComments.filter(action =>
            action.getIn(['payload', 'parent']) === comment.commentId
        );

        return optimisticComments
            .toArray()
            .map(commAction => (
              <OptimisticComment
                comment={commAction}
                containerRef={containerRef}
                key={commAction.id}
                loggedProfileData={loggedProfileData}
              />
            ));
    };

    renderReplies = () => {
        const { containerRef, context, entryId, entryTitle, ethAddress, highlightComment, onlyReply,
            replies } = this.props;
        if (onlyReply) {
            const comment = replies.find(comm => comm.commentId === onlyReply);
            return comment && (
              <Comment
                commentId={comment.commentId}
                containerRef={containerRef}
                context={context}
                entryId={entryId}
                entryTitle={entryTitle}
                ethAddress={ethAddress}
                isHighlighted={comment.commentId === highlightComment}
                key={comment.commentId}
              />
            );
        }

        return replies.map(comment => (
          <Comment
            commentId={comment.commentId}
            containerRef={containerRef}
            context={context}            
            entryId={entryId}
            entryTitle={entryTitle}
            ethAddress={ethAddress}
            isHighlighted={comment.commentId === highlightComment}
            key={comment.commentId}
          />
        ));
    };

    renderEditor = () => {
        const { author, containerRef, comment, entryId, entryTitle, ethAddress, intl, loggedProfileData,
            onReplyClose } = this.props;
        const name = getDisplayName({
            akashaId: author.get('akashaId'),
            ethAddress: author.get('ethAddress')
        });
        return (
          <div>
            <CommentEditor
              actionAdd={this.props.actionAdd}
              containerRef={containerRef}
              entryId={entryId}
              entryTitle={entryTitle}
              ethAddress={ethAddress}
              intl={intl}
              isReply
              loggedProfileData={loggedProfileData}
              onClose={onReplyClose}
              parent={comment.commentId}
              placeholder={intl.formatMessage(entryMessages.writeReplyTo, { name })}
              ref={this.getEditorRef}
            />
          </div>
        );
    };

    render () {
        const { comment, containerRef, context, entryId, entryTitle, ethAddress, highlightComment, intl,
            moreReplies, onReply, replies, replyTo } = this.props;
        const isHighlighted = highlightComment && highlightComment === comment.commentId;

        return (
          <div className="comment-thread">
            <Comment
              commentId={comment.commentId}
              containerRef={containerRef}
              context={context}
              entryId={entryId}
              entryTitle={entryTitle}
              ethAddress={ethAddress}              
              isHighlighted={isHighlighted}
              key={comment.commentId}
              onReply={onReply}
              showReplyButton
            >
              {!!replies.size && this.renderReplies()}
              {this.renderOptimisticComments()}
              {moreReplies &&
                <div className="content-link comment-thread__replies-button" onClick={this.loadMoreReplies}>
                  {intl.formatMessage(entryMessages.loadMoreReplies)}
                </div>
              }
              {replyTo === comment.commentId && this.renderEditor()}
            </Comment>
          </div>
        );
    }
}

CommentThread.propTypes = {
    actionAdd: PropTypes.func.isRequired,
    author: PropTypes.shape(),
    comment: PropTypes.shape().isRequired,
    commentsMoreIterator: PropTypes.func.isRequired,
    containerRef: PropTypes.shape(),
    context: PropTypes.string,
    entryId: PropTypes.string,
    entryTitle: PropTypes.string,
    ethAddress: PropTypes.string,
    highlightComment: PropTypes.string,
    loggedProfileData: PropTypes.shape(),
    intl: PropTypes.shape(),
    moreReplies: PropTypes.bool,
    onlyReply: PropTypes.string,
    onReply: PropTypes.func.isRequired,
    onReplyClose: PropTypes.func.isRequired,
    pendingComments: PropTypes.shape(),
    replies: PropTypes.shape().isRequired,
    replyTo: PropTypes.string,
};

function mapStateToProps (state, ownProps) {
    const { comment, entryId } = ownProps;
    const entry = entryId ?
        selectEntry(state, entryId) :
        selectFullEntry(state);

    return {
        author: selectProfile(state, comment.author.ethAddress),
        entryTitle: entry && entry.getIn(['content', 'title']),
        ethAddress: entry && entry.getIn(['author', 'ethAddress']),
        loggedProfileData: selectLoggedProfileData(state),
        moreReplies: selectMoreComments(state, comment.commentId),
        replies: selectEntryCommentsForParent(state, entryId, comment.commentId),
    };
}

export default connect(
    mapStateToProps,
    {
        actionAdd,
        commentsMoreIterator,
    }
)(injectIntl(CommentThread));
