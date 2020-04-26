import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import { Grid, Typography, Card, CardContent, CardActions, Button, Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { red, blue } from '@material-ui/core/colors';

import axios from 'axios';
import moment from 'moment';

import Loading from './Loading';

import serverTime from '../serverTime';

const styles = theme => ({
  root: {
    flexGrow: 1,
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0.5),
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(6),
    },
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
  state = {
    loading: true,
    snackbarOpen: false,
    snackbarMessage: '',
    snackbarAlertSeverity: 'success',
    currentServerTime: serverTime.getNow(),
  };

  componentDidMount = async () => {
    const { data: rooms } = await axios.get('/api/rooms');
    const availableSeatCounts = {};
    rooms.forEach(room => {
      availableSeatCounts[room.name] = room.availableSeatCount;
    });
    this.setState({ loading: false, rooms, availableSeatCounts });

    this.makeWebSocket = () => {
      this.ws = new WebSocket(`${window.location.protocol.startsWith('https') ? 'wss' : 'ws'}://${window.location.host}/ws/`);
      this.ws.onopen = () => {
        console.log('YVCBooking:: WebSocket connected.'); // eslint-disable-line no-console
      };
      this.ws.onmessage = evt => {
        const data = JSON.parse(evt.data);
        const availableSeatCounts = {...this.state.availableSeatCounts};
        availableSeatCounts[data.room] = data.availableSeatCount;
        this.setState({ availableSeatCounts });
      };
      this.ws.onclose = () => {
        console.log('YVCBooking:: WebSocket closed. Try reconnecting...'); // eslint-disable-line no-console
        this.makeWebSocket();
      };
    };
    this.makeWebSocket();
    this.timer = setInterval(() => {
      this.setState({ currentServerTime: serverTime.getNow() });
    }, 100);
  };

  componentWillUnmount = () => {
    if (this.ws) this.ws.close();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  moveToRoom = (room) => () => {
    this.props.history.push(`/${room.name}`);
  };

  openSnackbar = (message, severity) => () => {
    this.setState({ snackbarOpen: true, snackbarMessage: message, snackbarAlertSeverity: severity });
  };
  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    this.setState({ snackbarOpen: false });
  };

  render = () => {
    const { classes } = this.props;
    const { rooms, availableSeatCounts } = this.state;
    const now = serverTime.getNow();
    if (this.state.loading) return <Loading />;
    return (
      <Grid container className={classes.root}>
        <Grid item xs={12} className={classes.title}>
          <Typography variant="h4" gutterBottom>YVC 좌석 예약 시스템</Typography>
          <Typography variant="body2" color="textSecondary">
            현재 서버 시간:
            {this.state.currentServerTime.format('YYYY년 MM월 DD일 HH시 mm분 ss초')}
          </Typography>
        </Grid>
        <Grid item xs={12} md={3}></Grid>
        <Grid item xs={12} md={6}>
          {rooms.map((room, idx) => (
            <Card
              key={idx}
              className={classes.card}
              variant="outlined"
              onClick={
                now >= moment(room.startTime) ? this.moveToRoom(room) : this.openSnackbar('예약 시작 시간이 아직 되지 않았습니다.', 'error')
              }
            >
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h6" component="h5">
                  {room.title}
                </Typography>
                {now > moment(room.endTime) && <Typography variant="body2" component="p" gutterBottom style={{ color: blue[800] }}>
                  예배가 이미 시작했습니다.
                </Typography>}
                {now < moment(room.startTime) && <Typography variant="body2" component="p" gutterBottom style={{ color: red[800] }}>
                  예약 가능 시간이 아닙니다.
                </Typography>}
                <Typography variant="body2" component="p" gutterBottom>
                  {now < moment(room.startTime) && [`예약 시작 시간: ${datetimeStrToHumanString(room.startTime)}`, <br key={1} />]}
                  예배 시작 시간: {datetimeStrToHumanString(room.endTime)}
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
        <Snackbar open={this.state.snackbarOpen} autoHideDuration={6000} onClose={this.handleSnackbarClose}>
          <Alert onClose={this.handleSnackbarClose} severity={this.state.snackbarAlertSeverity}>
            {this.state.snackbarMessage}
          </Alert>
        </Snackbar>
      </Grid>
    );
  };
}

RoomList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(RoomList);
