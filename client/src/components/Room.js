import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

import {
  Grid, Typography, Card, CardContent, Fab,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button, TextField,
  Snackbar,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import axios from 'axios';
import md5 from 'md5';
import moment from 'moment';

import Loading from './Loading';
import SeatTable from './SeatTable';

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
    marginBottom: theme.spacing(2),
  },
  textCenter: {
    textAlign: 'center',
  },
  fab: {
    margin: theme.spacing(2),
    position: 'fixed',
    bottom: 6,
    right: 6,
  },
});

const datetimeStrToHumanString = (datetimeStr) => (
  moment(datetimeStr).format('YYYY년 MM월 DD일 HH시 mm분')
);

class Room extends React.Component {
  state = {
    loading: true,
    subLoading: false,
    dialogMode: 'create',
    dialogOpen: false,
    currentPosition: 'A1',
    snackbarOpen: false,
    snackbarMessage: '',
    snackbarAlertSeverity: 'success',
    currentServerTime: serverTime.getNow(),
  };

  loadBookings = async withLoading => {
    if (withLoading) this.setState({ loading: true });
    try{
      const res = await axios.get(`/api/rooms/${this.props.room}`);
      const { bookings, ...room } = res.data;
      if (serverTime.getNow() < moment(room.startTime) && !this.props.adminMode) return this.redirect('/');
      this.setState({
        loading: false,
        room,
        bookings,
      });
    }catch(err){
      if (err.response && err.response.status === 404) return this.redirect('/');
    }
  };

  makeWebSocket = () => {
    this.ws = new WebSocket(`${window.location.protocol.startsWith('https') ? 'wss' : 'ws'}://${window.location.host}/ws/${this.props.room}`);
    this.ws.onopen = () => {
      this.loadBookings(false);
      console.log('JVCBooking:: WebSocket connected.'); // eslint-disable-line no-console
    };
    this.ws.onmessage = evt => {
      const bookings = JSON.parse(evt.data);
      this.setState({ bookings });
    };
    this.ws.onclose = evt => {
      if (evt.reason === 'unmount'){
        console.log('JVCBooking:: WebSocket closed.'); // eslint-disable-line no-console
        return;
      }
      console.log('JVCBooking:: WebSocket closed. Try reconnecting...'); // eslint-disable-line no-console
      setTimeout(this.makeWebSocket, 300);
    };
  };

  componentDidMount = async () => {
    this.makeWebSocket();
    this.timer = setInterval(() => {
      this.setState({ currentServerTime: serverTime.getNow() });
    }, 100);
  };

  componentWillUnmount = () => {
    if (this.ws) this.ws.close(1000, 'unmount');
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  redirect = url => {
    this.props.history.replace(url);
  };
  moveTo = url => () => {
    if (this.props.adminMode) url = '/admin' + url;
    this.props.history.push(url);
  };

  handleDialogOpen = position => {
    const { bookings } = this.state;
    const booking = bookings.filter(e => e.position === position)[0];
    if (booking === undefined){
      this.setState({ dialogOpen: true, dialogMode: 'create', currentPosition: position, txtName: '', txtPassword1: '', txtPassword2: '' });
      return;
    }
    this.setState({ dialogOpen: true, dialogMode: 'modify', currentPosition: position, txtName: booking.booker, txtPassword: '', txtPassword1: '', txtPassword2: '' });
  };
  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };
  handleDialogConfirm = isDelete => () => {
    const { room } = this.props;
    const { dialogMode: mode, txtName: name, txtPassword: password, txtPassword1: password1, txtPassword2: password2, currentPosition: position } = this.state;
    if (name === '')
      return this.openSnackbar('예약자 이름이 비어있습니다.', 'error');
    if (mode === 'create'){
      if (password1 === '')
        return this.openSnackbar('비밀번호가 비어있습니다.', 'error');
      if (password1 !== password2){
        this.openSnackbar('비밀번호와 비밀번호 확인이 다릅니다.', 'error');
        return;
      }
      this.setState({ subLoading: true });
      const hashedPassword = md5(password1);
      axios.post(`/api/rooms/${room}/${position}${this.props.adminMode ? '?adminMode' : ''}`, {
        booker: name,
        simplePassword: hashedPassword,
      }).then(res => {
        this.setState({ subLoading: false });
        if (res.status === 201){
          this.openSnackbar('예약이 정상적으로 완료되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        this.setState({ subLoading: false });
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'startTime')
            this.openSnackbar('예약 시작 시간이 아직 되지 않았습니다.', 'error');
          if (err.response.data.reason === 'endTime')
            this.openSnackbar('예약 가능 시간이 지났습니다.', 'error');
          if (err.response.data.reason === 'exists')
            this.openSnackbar('이미 예약된 좌석입니다.', 'error');
        }
      });
    }
    else if (mode === 'modify' && !isDelete){
      if (password === '')
        return this.openSnackbar('비밀번호가 비어있습니다.', 'error');
      this.setState({ subLoading: true });
      const hashedPassword = md5(password);
      let hashedNewPassword = undefined;
      if (password1 !== ''){
        if (password1 !== password2){
          this.openSnackbar('비밀번호와 비밀번호 확인이 다릅니다.', 'error');
          return;
        }
        hashedNewPassword = md5(password1);
      }
      axios.put(`/api/rooms/${room}/${position}${this.props.adminMode ? '?adminMode' : ''}`, {
        booker: name,
        simplePassword: hashedPassword,
        newSimplePassword: hashedNewPassword,
      }).then(res => {
        this.setState({ subLoading: false });
        if (res.status === 200){
          this.openSnackbar('예약이 정상적으로 수정되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        this.setState({ subLoading: false });
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'password')
            this.openSnackbar('비밀번호가 틀렸습니다.', 'error');
          if (err.response.data.reason === 'startTime')
            this.openSnackbar('예약 시작 시간이 아직 되지 않았습니다.', 'error');
          if (err.response.data.reason === 'endTime')
            this.openSnackbar('예약 가능 시간이 지났습니다.', 'error');
        }
      });
    }
    else if (mode === 'modify' && isDelete){
      if (password === '')
        return this.openSnackbar('비밀번호가 비어있습니다.', 'error');
      this.setState({ subLoading: true });
      const hashedPassword = md5(password);
      axios.delete(`/api/rooms/${room}/${position}${this.props.adminMode ? '?adminMode' : ''}`, {
        headers: {
          Authorization: `SimplePassword ${hashedPassword}`
        },
      }).then(res => {
        this.setState({ subLoading: false });
        if (res.status === 200){
          this.openSnackbar('예약이 정상적으로 삭제되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        this.setState({ subLoading: false });
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'password')
            this.openSnackbar('비밀번호가 틀렸습니다.', 'error');
          if (err.response.data.reason === 'startTime')
            this.openSnackbar('예약 시작 시간이 아직 되지 않았습니다.', 'error');
          if (err.response.data.reason === 'endTime')
            this.openSnackbar('예약 가능 시간이 지났습니다.', 'error');
        }
      });
    }
  };

  handleTextChange = name => evt => {
    this.setState({ [name]: evt.target.value });
  };

  openSnackbar = (message, severity) => {
    this.setState({ snackbarOpen: true, snackbarMessage: message, snackbarAlertSeverity: severity });
  };
  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    this.setState({ snackbarOpen: false });
  };

  render = () => {
    const { classes } = this.props;
    const { room, bookings } = this.state;
    if (this.state.loading) return <Loading />;
    return (
      <Grid container className={classes.root}>
        <Grid item xs={12} className={classNames(classes.title, classes.textCenter)}>
          <Typography variant="h4">JVC 좌석 예약 시스템</Typography>
          {this.props.adminMode && <Typography variant="h5" gutterBottom>관리자 모드</Typography>}
          <Typography variant="h6" color="textSecondary">{room.title}</Typography>
          <Typography variant="body2" color="textSecondary">예약 종료 시간: {datetimeStrToHumanString(room.endTime)}</Typography>
          <Typography variant="body2" color="textSecondary">예배 시작 시간: {datetimeStrToHumanString(room.eventTime)}</Typography>
          <Typography variant="body2" color="textSecondary">
            현재 서버 시간:
            {this.state.currentServerTime.format('YYYY년 MM월 DD일 HH시 mm분 ss초')}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent className={classes.cardContent}>
              <Typography gutterBottom variant="body1" component="p" className={classes.textCenter}>
                실시간 잔여 좌석: {room.seatCount-bookings.length} / {room.seatCount}
              </Typography>
              <SeatTable layout={room.layout} bookings={bookings} onClick={this.handleDialogOpen} />
            </CardContent>
          </Card>
        </Grid>
        <Dialog
          open={this.state.dialogOpen}
          onClose={this.handleDialogClose}
          aria-labelledby="form-dialog-title"
          fullWidth
        >
          <DialogTitle id="form-dialog-title">좌석 {this.state.dialogMode === 'create' ? '예약하기' : '수정/삭제하기'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              선택 좌석: {this.state.currentPosition}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="이름"
              type="text"
              value={this.state.txtName}
              onChange={this.handleTextChange('txtName')}
              fullWidth
              required
              inputProps={{ maxLength: 8 }}
              helperText={
                this.state.dialogMode === 'create' ? '작성한 이름으로 예악됩니다.' : '예약자 이름을 수정할 수 있습니다.'
              }
            />
            {this.state.dialogMode === 'modify' && <TextField
              margin="dense"
              id="password"
              label="비밀번호"
              type="password"
              value={this.state.txtPassword}
              onChange={this.handleTextChange('txtPassword')}
              fullWidth
              required
              inputProps={{ maxLength: 15 }}
              helperText="예약시 작성한 비밀번호를 입력하세요."
            />}
            <TextField
              margin="dense"
              id="password1"
              label={
                this.state.dialogMode === 'create' ?
                  '비밀번호' :
                  '수정할 비밀번호'
              }
              type="password"
              value={this.state.txtPassword1}
              onChange={this.handleTextChange('txtPassword1')}
              fullWidth
              required={this.state.dialogMode === 'create'}
              inputProps={{ maxLength: 15 }}
              helperText={
                this.state.dialogMode === 'create' ?
                  '작성한 비밀번호를 통해 예약을 수정 혹은 삭제할 수 있습니다.' :
                  '비밀번호를 수정하지 않을 경우 비워주세요.'
              }
            />
            <TextField
              margin="dense"
              id="password2"
              label={
                this.state.dialogMode === 'create' ?
                  '비밀번호 확인' :
                  '수정할 비밀번호 확인'
              }
              value={this.state.txtPassword2}
              onChange={this.handleTextChange('txtPassword2')}
              type="password"
              fullWidth
              required={this.state.dialogMode === 'create'}
              inputProps={{ maxLength: 15 }}
            />
          </DialogContent>
          <DialogActions>
            {this.state.dialogMode === 'modify' && <Button onClick={this.handleDialogConfirm(true)} color="secondary">
              삭제
            </Button>}
            <Button onClick={this.handleDialogClose} color="primary">
              취소
            </Button>
            <Button onClick={this.handleDialogConfirm(false)} color="primary">
              {this.state.dialogMode === 'create' ? '예약' : '수정'}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={this.state.snackbarOpen} autoHideDuration={6000} onClose={this.handleSnackbarClose}>
          <Alert onClose={this.handleSnackbarClose} severity={this.state.snackbarAlertSeverity}>
            {this.state.snackbarMessage}
          </Alert>
        </Snackbar>
        <Fab color="primary" aria-label="back" className={classes.fab} onClick={this.moveTo('/')}>
          <ArrowBackIcon />
        </Fab>
        {this.state.subLoading && <Loading />}
      </Grid>
    );
  };
}

Room.defaultProps = {
  adminMode: false,
};

Room.propTypes = {
  classes: PropTypes.object.isRequired,
  room: PropTypes.string.isRequired,
  adminMode: PropTypes.bool.isRequired,
};

export default withStyles(styles)(Room);
