import React, { Component } from 'react';
import firebase from '../../firebase';
import uuidv4 from 'uuid/v4';
import styles from './MessageForm.module.scss';
import Icon from '@material-ui/core/Icon';
import PropTypes from 'prop-types';
import FileUploadModal from './FileUploadModal';
import ProgressBar from './ProgressBar';
import Tooltip from '@material-ui/core/Tooltip';

class MessageForm extends Component {
  state = {
    storageRef: firebase.storage().ref(),
    uploadTask: null,
    percentUploaded: 0,
    message: '',
    user: this.props.currentUser,
    room: this.props.currentRoom,
    messagesRef: firebase.database().ref('messages'),
    fileUploadModalIsOpen: false,
  };

  openModal = () => {
    this.setState({ fileUploadModalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ fileUploadModalIsOpen: false });
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  /**
   * message 객체를 반환합니다. message 객체는 file의 유무에 따라 사진 혹은 텍스트를 가지고 있습니다.
   * @return message obj
   * @param fileUrl
   */
  createMessage = (fileUrl = null) => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL,
      },
    };
    if (fileUrl !== null) {
      message.image = fileUrl;
    } else {
      message.content = this.state.message;
    }
    return message;
  };

  /**
   * message 객체를 현재 방 id의 밑으로 저장합니다.
   * messages: {
   *  roomId : {
   *    messageId : {
   *      content: string,
   *      id: string,
   *      users: array
   *    }
   *  }
   * }
   */
  sendMessage = (event) => {
    if (event.key === 'Enter') {
      const { currentRoom, scrollDown } = this.props;
      const { message, messagesRef } = this.state;

      if (message) {
        messagesRef
          .child(currentRoom.id)
          .push()
          .set(this.createMessage())
          .then(() => {
            this.setState({ message: '' });
            scrollDown();
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
  };

  /**
   * 구글 storage에 image를 업로드합니다.
   */
  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.room.id;
    const ref = this.state.messagesRef;
    const filePath = `images/${uuidv4()}.jpg`;

    this.setState(state => ({
      uploadTask: state.storageRef.child(filePath).put(file, metadata),
    }),
    () => {
      this.state.uploadTask.on(
        'state_changed',
        (snap) => {
          const percentUploaded = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100,
          );
          this.setState({ percentUploaded });
        },
        (err) => {
          console.error(err);
          this.setState({ uploadTask: null });
        },
        () => {
          this.state.uploadTask.snapshot.ref
            .getDownloadURL()
            .then((downloadUrl) => {
              this.sendFileMessage(downloadUrl, ref, pathToUpload);
            })
            .catch((err) => {
              console.error(err);
              this.setState({
                uploadTask: null,
              });
            });
        },
      );
    });
  };

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref.child(pathToUpload)
      .push()
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({ percentUploaded: 0 });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  render() {
    const { fileUploadModalIsOpen, percentUploaded, room } = this.state;
    return (
      <div className={styles['message-form']}>
        <div className={styles['message-form-content']}>
          <button
            disabled={!room}
            type="button"
            className={styles['upload-button']}
            onClick={this.openModal}
          >
            <Tooltip title="사진 업로드">
              <Icon className={styles['upload-icon']}>
              add_to_photos
              </Icon>
            </Tooltip>
          </button>
          <input
            disabled={!room}
            placeholder={room ? '메세지를 적어주세요' : '방을 생성해주세요'}
            onKeyPress={this.sendMessage}
            onChange={this.handleChange}
            className={styles['message-input']}
            id="message"
            value={this.state.message}
            name="message"
            type="text"
            autoComplete="off"
          />
        </div>
        <ProgressBar completed={percentUploaded} />
        <FileUploadModal
          isOpen={fileUploadModalIsOpen}
          closeModal={this.closeModal}
          uploadFile={this.uploadFile}
        />
      </div>
    );
  }
}

MessageForm.propTypes = {
  scrollDown: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  currentRoom: PropTypes.object,
};
export default MessageForm;
