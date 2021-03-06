import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popover, Button } from 'antd';
import { tagMessages, generalMessages } from '../locale-data/messages';
import Icon from './icon';
import clickAway from '../utils/clickAway';

const tagCreatorKeycodes = [
    13, // enter
    9, // tab
    32, // space
    188, // ,
    186, // ;
];

class TagEditor extends Component {
    constructor (props) {
        super(props);
        const { intl, isUpdate, tags } = this.props;
        this.initialInputWidth = this._getTextWidth(
            `${intl.formatMessage(tagMessages.addTag)} ${intl.formatMessage(tagMessages.tagsLeft, {
                value: 10 - tags.size
            })}`).width + 20;
        let tagInputWidth = this.initialInputWidth;

        if (isUpdate) {
            tagInputWidth = this._getTextWidth(`
                ${intl.formatMessage(tagMessages.cannotEditTags)}
            `).width + 20;
        }

        this.state = {
            partialTag: '',
            tagInputWidth,
            selectedSuggestionIndex: 0,
        };
        this._rootNodeRef = React.createRef();
    }
    componentClickAway = () => {
        const { partialTag } = this.state;
        if (partialTag.length > 1 && partialTag.length <= 32) {
            this._createTag(this.state.partialTag);
            return this.tagInput.blur();
        }
        return this.setState({
            partialTag: '',
            tagInputWidth: this.initialInputWidth
        }, () => {
            this.props.searchResetResults();
        });
    }

    _getTextWidth = (text) => {
        let txtNode = document.createElement('div');
        document.body.appendChild(txtNode);
        txtNode.style.position = 'absolute';
        txtNode.style.left = -10000;
        txtNode.style.top = -10000;

        txtNode.innerText = text;

        const res = {
            width: Math.round(txtNode.clientWidth),
        };
        document.body.removeChild(txtNode);
        txtNode = null;
        return res;
    }

    componentWillReceiveProps (nextProps) {
        const { isUpdate, intl } = nextProps;
        if (isUpdate) {
            this.setState({
                tagInputWidth: this._getTextWidth(`
                    ${intl.formatMessage(tagMessages.cannotEditTags)}
                `).width + 20
            });
        }
    }

    _getTagInputPopoverContent = () => {
        const { tagSuggestions, tags, tagErrors } = this.props;
        if (tagErrors) {
            return (
              <div className="tag-editor__error-popover">
                <div className="tag-editor__error-popover-text">
                  {tagErrors}
                </div>
              </div>
            );
        }
        const selectionIndex = this.state.selectedSuggestionIndex;
        /* eslint-disable react/no-array-index-key */
        return this._getFilteredSuggestions(tagSuggestions, tags).map((tag, index) => (
          <div
            key={`suggested-${tag}-${index}`}
            onClick={() => { this._createTag(tag); }}
            className={
              `tag-editor__suggestion-item ${tag}
               tag-editor__suggestion-item${selectionIndex === index ? '_selected' : ''}`
            }
          >
            {tag}
          </div>
        ));
        /* eslint-enable react/no-array-index-key */
    }
    _getFilteredSuggestions = (suggestions, tags) =>
        suggestions.filter(tag => !tags.has(tag) && !tag.includes(' '))

    _getTagStatus = (tag, status) => {
        const { intl, canCreateTags } = this.props;
        const cannotBeUsed = !canCreateTags && (!status.checking && !status.exists);
        const mustCreate = canCreateTags && (!status.checking && !status.exists);
        return (
          <div
            className="tag-editor__tag-item-popover-content"
          >
            <p className="tag-editor__tag-item-popover-message">
              {cannotBeUsed && intl.formatMessage(tagMessages.notEnoughKarma)}
              {mustCreate && intl.formatMessage(tagMessages.tagNotCreated)}
            </p>
            <div
              className="tag-editor__tag-item-popover-actions"
            >
              {cannotBeUsed &&
                <Button
                  onClick={this._deleteTag(tag)}
                  size="small"
                  className="tag-editor__tag-item-popover-actions-button"
                >
                  {intl.formatMessage(generalMessages.cancel)}
                </Button>
              }

            </div>
          </div>
        );
    }

    _forceTagInputFocus = () => {
        this.setState({
            inputHasFocus: true
        }, () => {
            this.tagInput.focus();
        });
    }

    _createTag = (tagName) => {
        const { intl, tags } = this.props;
        if (tagName.length > 1) {
            this.props.onTagAdd(tagName.toLowerCase().trim().replace('#', ''));
            this.setState({
                partialTag: '',
                selectedSuggestionIndex: 0,
                tagInputWidth: this._getTextWidth(`
                ${intl.formatMessage(tagMessages.addTag)} ${intl.formatMessage(tagMessages.tagsLeft, {
                    value: 10 - tags.size
                })}`).width + 20
            }, () => {
                this.props.searchResetResults();
                this.props.onChange();
                if(
                    this.tagInput.scrollIntoViewIfNeeded &&
                    typeof this.tagInput.scrollIntoViewIfNeeded === 'function'
                ) {
                    this.tagInput.scrollIntoViewIfNeeded();
                } else {
                    this.tagInput.scrollIntoView();
                }
            });
        }
    }

    _deleteTag = tagName =>
        () => {
            const { intl, tags } = this.props;
            this.props.onTagRemove(tagName);
            this.props.onChange();
            this.setState({
                tagInputWidth: this._getTextWidth(`
                ${intl.formatMessage(tagMessages.addTag)} ${intl.formatMessage(tagMessages.tagsLeft, {
                    value: 10 - tags.size
                })}`).width + 20
            });
        }

    _incrementSuggestionSelectionIndex = () => {
        const { tagSuggestions, tags } = this.props;
        const maxIncrement = this._getFilteredSuggestions(tagSuggestions, tags).size;
        this.setState((prevState) => {
            if (prevState.selectedSuggestionIndex === maxIncrement - 1) {
                return {
                    selectedSuggestionIndex: 0
                };
            }
            return {
                selectedSuggestionIndex: prevState.selectedSuggestionIndex + 1
            };
        });
    }

    _decrementSuggestionSelectionIndex = () => {
        const { tagSuggestions, tags } = this.props;
        const { size } = this._getFilteredSuggestions(tagSuggestions, tags);
        this.setState((prevState) => {
            if (prevState.selectedSuggestionIndex === 0) {
                return {
                    selectedSuggestionIndex: size - 1
                };
            }
            return {
                selectedSuggestionIndex: prevState.selectedSuggestionIndex - 1
            };
        });
    }
    /* eslint-disable no-fallthrough, consistent-return */
    _handleSpecialKeyPress = (ev) => {
        const pressedKey = ev.keyCode;
        const { tags } = this.props;
        const { tagSuggestions } = this.props;
        const { selectedSuggestionIndex } = this.state;
        const suggestionsVisible = this._getSuggestionsPopoverVisibility();
        const filteredSuggestions = this._getFilteredSuggestions(tagSuggestions, tags);
        // detect tag creation keycodes
        if (tagCreatorKeycodes.includes(pressedKey) && this.state.partialTag.length) {
            // if enter is pressed and suggestions are open,
            // create the selected tag instead partialTag
            if ((pressedKey === 13 || pressedKey === 9) && suggestionsVisible) {
                const selectedTag = filteredSuggestions.get(selectedSuggestionIndex);
                return this._createTag(selectedTag);
            }
            this._createTag(this.state.partialTag);
            ev.preventDefault();
        } else {
            switch (pressedKey) {
                case 38: // arrow up
                    this._decrementSuggestionSelectionIndex();
                    break;
                case 40: // arrow down
                    this._incrementSuggestionSelectionIndex();
                    break;
                case 8: // backspace
                    if (this.state.partialTag.length === 0) {
                        this._deleteTag(tags.takeLast(1).keySeq().first())();
                    }
                    break;
                default:
                    break;
            }
        }
    }
    /* eslint-enable no-fallthrough, consistent-return */
    _handleTagInputChange = (ev) => {
        const { tags, intl } = this.props;
        const tag = ev.target.value.trim().toLowerCase().replace('#', '');
        const alphaValid = /[a-z0-9.-]+$/.test(tag);
        const specialCharsValid = !tag.includes('.-') &&
            !tag.includes('-.') &&
            !tag.includes('--') &&
            !tag.includes('..');
        const isValid = specialCharsValid && alphaValid && !tag.startsWith('.') && !tag.startsWith('_');
        if (this.state.partialTag.length === 32 && ev.target.value.length > 32) {
            return;
        }
        this.setState((prevState) => {
            if (isValid) {
                return {
                    partialTag: tag,
                    tagInputWidth: this._getTextWidth(tag).width + 20,
                };
            }
            if (tag.length === 0) {
                return {
                    partialTag: '',
                    tagInputWidth: this._getTextWidth(`
                    ${intl.formatMessage(tagMessages.addTag)} ${intl.formatMessage(tagMessages.tagsLeft, {
                        value: 10 - tags.size
                    })}`).width + 20
                };
            }
            return {
                partialTag: prevState.partialTag,
                tagInputWidth: this._getTextWidth(prevState.partialTag).width + 20,
            };
        }, () => {
            if (this.state.partialTag.length >= 1) {
                this.props.searchTags(this.state.partialTag.trim().toLowerCase().replace('#', ''), true);
            } else {
                this.props.searchResetResults();
            }
            this.props.onChange();
        });
    }
    _handleTagInputPaste = (ev) => {
        const { partialTag } = this.state;
        const text = ev.clipboardData.getData('text');
        ev.preventDefault();
        if (`${partialTag}${text}`.length <= 32) {
            return this.setState({
                partialTag: `${partialTag}${text}`,
                tagInputWidth: this._getTextWidth(`${partialTag}${text}`).width + 20
            });
        }
        return this.setState({
            partialTag: `${partialTag}${text}`.slice(0, 32),
            tagInputWidth: this._getTextWidth(`${partialTag}${text}`.slice(0, 32)).width + 20
        });
    }
    _changeInputFocus = focusState =>
        (ev) => {
            const suggestionsVisible = this._getSuggestionsPopoverVisibility();
            if (!focusState && suggestionsVisible) {
                return ev.preventDefault();
            }
            return this.setState({
                inputHasFocus: focusState
            });
        }
    /* eslint-disable complexity */
    _handleTagStatusPopover = (tag, status) =>
        (visible) => {
            const { tags, canCreateTags } = this.props;
            const cannotBeUsed = !canCreateTags && (!status.checking && !status.exists);
            const mustCreate = canCreateTags && (!status.checking && !status.exists);
            if (!visible && cannotBeUsed) {
                return this._deleteTag(tags.findLastKey(val => !val.exists))();
            }
            if (!visible && mustCreate) {
                return this.setState({
                    tagStatusPopoverOpen: ''
                });
            }
            if (visible && mustCreate) {
                return this.setState({
                    tagStatusPopoverOpen: tag
                });
            }
            return null;
        }

    _getTooltipContainer = () => {
        if (this._rootNodeRef.current) {
            return this._rootNodeRef.current;
        } else if (document.getElementById('tag-editor')) {
            return document.getElementById('tag-editor');
        }
        return document.body;
    }

    /* eslint-disable react/no-array-index-key */
    _getTagList = () => {
        const { tags, canCreateTags, isUpdate } = this.props;
        // return tags
        return tags.map((status, tag) => {
            let popoverOpen = (!status.checking && !status.exists);
            if (typeof this.state.tagStatusPopoverOpen === 'string') {
                popoverOpen = this.state.tagStatusPopoverOpen === tag;
            }
            return (
              <Popover
                key={`${tag}`}
                placement="topLeft"
                content={
                  this._getTagStatus(tag, status)
                }
                overlayClassName="tag-editor__tag-item-popover"
                visible={popoverOpen}
                onVisibleChange={this._handleTagStatusPopover(tag, status)}
                trigger="click"
                getTooltipContainer={this._getTooltipContainer}
              >
                <div
                  className={
                    `flex-center-y tag-editor__tag-item
                    tag-editor__tag-item${(canCreateTags && (!status.checking && !status.exists)) ?
                        '_should-register' : ''}
                    tag-editor__tag-item${(!canCreateTags && (!status.checking && !status.exists)) ?
                        '_cannot-add' : ''}`
                  }
                >
                  { tag }
                  {(canCreateTags || status.exists) && !isUpdate &&
                    <span
                      className="tag-item__delete-button"
                      onClick={this._deleteTag(tag)}
                    >
                      <Icon type="close" />
                    </span>
                  }
                  {!canCreateTags && (!status.checking && !status.exists) &&
                    <span className="tag-item__info-button" >
                      <Icon type="question" />
                    </span>
                  }
                </div>
              </Popover>
            );
        }).toIndexedSeq();
    }
    _getSuggestionsPopoverVisibility = () => {
        const { tagSuggestionsCount, tagSuggestions, tags } = this.props;
        const { inputHasFocus } = this.state;

        return (tagSuggestionsCount > 0 &&
            inputHasFocus && this._getFilteredSuggestions(tagSuggestions, tags).size > 0);
    }
    _getInputPlaceholder = () => {
        const { isUpdate, intl, tags } = this.props;
        if (!isUpdate) {
            return `${intl.formatMessage(tagMessages.addTag)} ${intl.formatMessage(tagMessages.tagsLeft, {
                value: 10 - tags.size
            })}`;
        }
        return intl.formatMessage(tagMessages.cannotEditTags)
    }
    render () {
        const { tagInputWidth } = this.state;
        const { tags, canCreateTags, isUpdate, tagErrors } = this.props;
        const suggestionsPopoverVisible = this._getSuggestionsPopoverVisibility();

        return (
          <div
            id="tag-editor"
            className={`tag-editor ${this.props.className}`}
            onClick={this._forceTagInputFocus}
            ref={this._rootNodeRef}
          >
            {this._getTagList()}
            <Popover
              content={this._getTagInputPopoverContent()}
              placement="topLeft"
              visible={(tagErrors && tagErrors.length > 0) || suggestionsPopoverVisible}
              overlayClassName="tag-editor__suggestions-container"
              getPopupContainer={this._getTooltipContainer}
            >
              <input
                ref={(node) => { this.tagInput = node; }}
                type="text"
                className="tag-editor__input"
                placeholder={this._getInputPlaceholder()}
                onKeyDown={this._handleSpecialKeyPress}
                onChange={this._handleTagInputChange}
                onPaste={this._handleTagInputPaste}
                style={{
                  width: tagInputWidth,
                }}
                value={this.state.partialTag}
                onFocus={this._changeInputFocus(true)}
                disabled={
                    (tags.size &&
                    (!tags.every(tStatus => tStatus.exists && !tStatus.checking) && !canCreateTags)) ||
                    (tags.size >= 10) ||
                    isUpdate
                }
              />
            </Popover>
          </div>
        );
    }
}

TagEditor.propTypes = {
    canCreateTags: PropTypes.bool.isRequired,
    className: PropTypes.string,
    intl: PropTypes.shape(),
    isUpdate: PropTypes.bool,    
    onChange: PropTypes.func,
    onTagAdd: PropTypes.func.isRequired,
    onTagRemove: PropTypes.func.isRequired,
    searchResetResults: PropTypes.func,
    searchTags: PropTypes.func,
    tagErrors: PropTypes.string,
    tags: PropTypes.shape(),
    tagSuggestions: PropTypes.shape(),
    tagSuggestionsCount: PropTypes.number,
};

export default clickAway(TagEditor);
