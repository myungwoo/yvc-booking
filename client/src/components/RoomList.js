import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import { Grid, Typography, Card, CardContent, CardActions, Button } from '@material-ui/core';

import moment from 'moment';

const styles = theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(6),
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(1),
  },
  card: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
  },
  cardContent: {
    textAlign: 'center',
    paddingBottom: 0,
  },
  cardAction: {
    paddingTop: 0,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
  rightActionButton: {
    marginLeft: 'auto',
  },
});

const datetimeStrToHumanString = (datetimeStr) => (
  moment(datetimeStr).format('YYYY년 MM월 DD일 HH시 mm분')
);

class RoomList extends React.Component {
  constructor(props) {
    super(props);
    const availableSeatCounts = {};
    this.props.rooms.forEach(room => {
      availableSeatCounts[room.name] = room.availableSeatCount;
    });
    this.state = { availableSeatCounts };
  }

  componentDidMount = () => {
    this.ws = new WebSocket(`ws://${window.location.host}/ws/`);
    this.ws.onmessage = evt => {
      const data = JSON.parse(evt.data);
      const availableSeatCounts = {...this.state.availableSeatCounts};
      availableSeatCounts[data.room] = data.availableSeatCount;
      this.setState({ availableSeatCounts });
    };
  };

  componentWillUnmount = () => {
    this.ws.close();
  };

  moveToRoom = (room) => () => {
    this.props.history.push(`/${room.name}`);
  };

  render = () => {
    const { classes, rooms } = this.props;
    const { availableSeatCounts } = this.state;
    return (
      <Grid container className={classes.root}>
        <Grid item xs={12} className={classes.title}>
          <Typography variant="h4">YVC 좌석 예약 시스템</Typography>
        </Grid>
        <Grid item xs={12} md={3}></Grid>
        <Grid item xs={12} md={6}>
          {rooms.map((room, idx) => (
            <Card key={idx} className={classes.card} variant="outlined" onClick={this.moveToRoom(room)}>
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h6" component="h5">
                  {room.title}
                </Typography>
                <Typography variant="body2" component="p" gutterBottom>
                  예약 시작 시간: {datetimeStrToHumanString(room.startTime)}<br />
                  예약 끝나는 시간: {datetimeStrToHumanString(room.endTime)}
                </Typography>
                <Typography variant="body2" component="p">
                  실시간 잔여 좌석: {availableSeatCounts[room.name]} / {room.seatCount}
                </Typography>
              </CardContent>
              <CardActions className={classes.cardAction}>
                <Button color="primary" className={classes.rightActionButton}>예약하기</Button>
              </CardActions>
            </Card>
          ))}
        </Grid>
        <Grid item xs={12} md={3}></Grid>
      </Grid>
    );
  };
}

RoomList.propTypes = {
  classes: PropTypes.object.isRequired,
  rooms: PropTypes.object.isRequired,
};

export default withStyles(styles)(RoomList);
