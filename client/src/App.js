import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import axios from 'axios';

import Loading from './components/Loading';
import RoomList from './components/RoomList';
import Room from './components/Room';

class App extends React.Component {
  state = {
    loading: true,
    rooms: [],
  };

  componentDidMount = () => {
    axios.get('/api/rooms').then(res => {
      this.setState({ loading: false, rooms: res.data });
    });
  }

  render = () => {
    if (this.state.loading) return <Loading />;

    return (
      <Switch>
        <Route exact path='/:room' component={props => <Room room={props.match.params.room} {...props} />} />
        <Route exact path='/' component={props => <RoomList rooms={this.state.rooms} {...props} />} />
        <Route path='/' render={() => <Redirect to="/" />} />
      </Switch>
    );
  };
}

export default App;
