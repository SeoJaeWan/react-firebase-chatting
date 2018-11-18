import React, { Component } from 'react';
import SidePanel from './SidePanel/SidePanel';
import RoomList from './RoomList/RoomList';
import styles from './App.module.scss';
import '../styles/main.scss';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';

export class App extends Component {
  render() {
    const { currentUser } = this.props;
    return (
      <div className={styles.App}>
        <SidePanel
          currentUser={currentUser}
        />
        <RoomList
          currentUser={currentUser}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
});

App.propTypes = {
  currentUser: PropTypes.object,
};

export default connect(mapStateToProps)(App);
