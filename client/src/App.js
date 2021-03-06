import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import Loading from './components/Loading';
import RoomList from './components/RoomList';
import Room from './components/Room';

import serverTime from './serverTime';

class App extends React.Component {
  state = {
    loading: true,
  };

  componentDidMount = async () => {
    await serverTime.init();
    this.setState({ loading: false });
  };

  render = () => {
    if (this.state.loading) return <Loading />;
    return (
      <Switch>
        <Route exact path='/admin/:room' component={props => <Room adminMode room={props.match.params.room} {...props} />} />
        <Route exact path='/admin' component={props => <RoomList adminMode {...props} />} />
        <Route exact path='/:room' component={props => <Room room={props.match.params.room} {...props} />} />
        <Route exact path='/' component={RoomList} />
        <Redirect to="/" />
      </Switch>
    );
  };
}

export default App;
