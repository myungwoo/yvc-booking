import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import RoomList from './components/RoomList';
import Room from './components/Room';

class App extends React.Component {
  render = () => {
    return (
      <Switch>
        <Route exact path='/:room' component={props => <Room room={props.match.params.room} {...props} />} />
        <Route exact path='/' component={RoomList} />
        <Route path='/' render={() => <Redirect to="/" />} />
      </Switch>
    );
  };
}

export default App;
