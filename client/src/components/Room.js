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

import Loading from './Loading';
import SeatTable from './SeatTable';

const styles = theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(6),
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

class Room extends React.Component {
  state = {
    loading: true,
    dialogMode: 'create',
    dialogOpen: false,
    currentPosition: 'A1',
    snackbarOpen: false,
    snackbarMessage: '',
    snackbarAlertSeverity: 'success',
  };

  componentDidMount = () => {
    this.ws = new WebSocket(`ws://${window.location.host}/ws/${this.props.room}`);
    this.ws.onmessage = evt => {
      const bookings = JSON.parse(evt.data);
      this.setState({ bookings });
    };
    axios.get(`/api/rooms/${this.props.room}`).then(res => {
      const { bookings, ...room } = res.data;
      this.setState({
        loading: false,
        room,
        bookings,
      });
    }).catch(err => {
      console.error(err);
      const { response: res } = err;
      if (res.status === 404) this.redirect('/');
    });
  };

  componentWillUnmount = () => {
    this.ws.close();
  };

  redirect = url => {
    this.props.history.replace(url);
  };
  moveTo = url => () => {
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
    if (mode === 'create'){
      if (password1 !== password2){
        this.openSnackbar('비밀번호와 비밀번호 확인이 다릅니다.', 'error');
        return;
      }
      const hashedPassword = md5(password1);
      axios.post(`/api/rooms/${room}/${position}`, {
        booker: name,
        simplePassword: hashedPassword,
      }).then(res => {
        if (res.status === 201){
          this.openSnackbar('예약이 정상적으로 완료되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'time')
            this.openSnackbar('예약 가능 시간이 아닙니다.', 'error');
        }
      });
    }
    else if (mode === 'modify' && !isDelete){
      const hashedPassword = md5(password);
      let hashedNewPassword = undefined;
      if (password1 !== ''){
        if (password1 !== password2){
          this.openSnackbar('비밀번호와 비밀번호 확인이 다릅니다.', 'error');
          return;
        }
        hashedNewPassword = md5(password1);
      }
      axios.put(`/api/rooms/${room}/${position}`, {
        booker: name,
        simplePassword: hashedPassword,
        newSimplePassword: hashedNewPassword,
      }).then(res => {
        if (res.status === 200){
          this.openSnackbar('예약이 정상적으로 수정되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'password')
            this.openSnackbar('비밀번호가 틀렸습니다.', 'error');
          if (err.response.data.reason === 'time')
            this.openSnackbar('예약 가능 시간이 아닙니다.', 'error');
        }
      });
    }
    else if (mode === 'modify' && isDelete){
      const hashedPassword = md5(password);
      axios.delete(`/api/rooms/${room}/${position}`, {
        headers: {
          Authorization: `SimplePassword ${hashedPassword}`
        },
      }).then(res => {
        if (res.status === 200){
          this.openSnackbar('예약이 정상적으로 삭제되었습니다.', 'success');
          this.setState({ dialogOpen: false });
        }
      }).catch(err => {
        if (err.response && err.response.status === 403){
          if (err.response.data.reason === 'password')
            this.openSnackbar('비밀번호가 틀렸습니다.', 'error');
          if (err.response.data.reason === 'time')
            this.openSnackbar('예약 가능 시간이 아닙니다.', 'error');
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
          <Typography variant="h4">YVC 좌석 예약 시스템</Typography>
          <Typography variant="h6" color="textSecondary">{room.title}</Typography>
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
              helperText="예약시 작성한 비밀번호를 입력하세요."
            />}
            <TextField
              margin="dense"
              id="password1"
              label="비밀번호"
              type="password"
              value={this.state.txtPassword1}
              onChange={this.handleTextChange('txtPassword1')}
              fullWidth
              helperText={
                this.state.dialogMode === 'create' ?
                  '작성한 비밀번호를 통해 예약을 수정 혹은 삭제할 수 있습니다.' :
                  '비밀번호를 수정할 경우 작성하세요.'
              }
            />
            <TextField
              margin="dense"
              id="password2"
              label="비밀번호 확인"
              value={this.state.txtPassword2}
              onChange={this.handleTextChange('txtPassword2')}
              type="password"
              fullWidth
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
      </Grid>
    );
  };
}

Room.propTypes = {
  classes: PropTypes.object.isRequired,
  room: PropTypes.string.isRequired,
};

export default withStyles(styles)(Room);
