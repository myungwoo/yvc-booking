import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { green, yellow, blueGrey, red, grey, pink } from '@material-ui/core/colors';

const firstRowCellHeight = 20;
const cellHeight = 50;
const cellWidth = 60;

const styles = {
  root: {
    overflowX: 'auto',
    // overflow: 'auto',
    maxWidth: '100%',
    // maxHeight: 'calc(100vh - 240px)',
  },
  stageBox: {
    display: 'table-cell',
    textAlign: 'center',
    verticalAlign: 'middle',
    borderRadius: 5,
    background: grey[300],
    height: cellHeight,
    fontWeight: 'bold',
  },
  row: {
    textAlign: 'center',
    display: 'block',
    whiteSpace: 'nowrap',
  },
  rowWrapper: {
    padding: 0,
    display: 'inline-block',
  },
  firstRow: {
    height: `${firstRowCellHeight}px !important`,
  },
  cell: {
    display: 'inline-block',
    width: cellWidth,
    height: cellHeight,
    margin: 3,
  },
  header: {
    display: 'table-cell',
    verticalAlign: 'middle',
    fontWeight: 'bold',
    fontSize: 18,
    width: cellWidth,
    height: cellHeight,
  },
  textBottom: {
    verticalAlign: 'bottom !important',
  },
  seat: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  noSeat: {
    background: '#eee',
  },
  invalidSeat: {
    background: '#555',
  },
  staffSeat: {
    background: blueGrey[200],
  },
  spareSeat: {
    background: yellow[400],
    cursor: 'pointer',
  },
  unavailableSeat: {
    background: green[100],
  },
  availableSeat: {
    background: green[400],
    cursor: 'pointer',
  },
  momSeat: {
    background: pink[200],
    cursor: 'pointer',
  },
  bookedSeat: {
    background: red[200],
    cursor: 'pointer',
  },
  seatText: {
    display: 'table-cell',
    verticalAlign: 'middle',
    fontSize: 14,
    // fontWeight: 'bold',
    width: cellWidth,
    height: cellHeight,
    whiteSpace: 'pre-line',
  },
};

const isBookableSeat = c => 'opj'.includes(c);

class SeatTable extends React.Component {
  getSeatChar = position => {
    const { layout } = this.props;
    const res = /^([A-Z])(\d+)$/.exec(position);
    if (res === null) return null;
    let [r, c] = res.slice(1, 3);
    r = r.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    c = Number(c);
    const row = layout[r-1];
    if (row === undefined) return null;
    return row[c-1];
  };

  getSeatClassName = position => {
    const { classes, bookings } = this.props;
    const val = this.getSeatChar(position);
    if (val === undefined) return null;
    if (val === 'x') return classes.invalidSeat;
    if (val === 's') return classes.staffSeat;
    if (val === ' ') return classes.noSeat;
    if (val === 'p') return classes.spareSeat;
    if (val === '-') return classes.unavailableSeat;
    if (val === 'j') return classes.momSeat;
    if (bookings.filter(booking => booking.position === position).length > 0)
      return classes.bookedSeat;
    return classes.availableSeat;
  };

  getSeatText = position => {
    const { bookings } = this.props;
    const val = this.getSeatChar(position);
    if (val === undefined) return null;
    if (val === 'x') return '';
    if (val === 's') return '스태프';
    if (val === ' ') return '';
    if (val === '-') return '';
    const booking = bookings.filter(booking => booking.position === position)[0];
    if (booking !== undefined){
      if (val === 'p') return `간이의자\n${booking.booker}`;
      if (val === 'j') return `자모실\n${booking.booker}`;
      return booking.booker;
    }
    if (val === 'p') return '간이의자\n예약가능';
    if (val === 'j') return '자모실\n예약가능';
    return '예약 가능';
  };

  onClick = position => () => {
    this.props.onClick(position);
  };

  render = () => {
    const { classes, layout } = this.props;
    const rowCount = layout.length;
    const colCount = layout[0].length;
    return (
      <div className={classes.root}>
        <div className={classes.row}>
          <div className={classes.rowWrapper}>
            <div className={classNames(classes.cell, classes.firstRow)}></div>
            <div style={{ display: 'inline-block', height: cellHeight, width: (cellWidth + 6) * colCount }}>
              <div className={classes.stageBox} style={{ width: (cellWidth + 6) * colCount }}>
                앞
              </div>
            </div>
          </div>
        </div>
        <div className={classes.row}>
          <div className={classes.rowWrapper}>
            <div className={classNames(classes.cell, classes.firstRow)}></div>
            {Array(colCount).fill(0).map((_, idx) => (
              <div className={classNames(classes.cell, classes.firstRow)} key={idx}>
                <div className={classNames(classes.header, classes.textBottom, classes.firstRow)}>{idx+1}</div>
              </div>
            ))}
          </div>
        </div>
        {Array(rowCount).fill(0).map((_, row) => (
          <div className={classes.row} key={row}>
            <div className={classes.rowWrapper}>
              <div className={classes.cell}>
                <div className={classes.header}>{String.fromCharCode(65+row)}</div>
              </div>
              {Array(colCount).fill(0).map((_, col) => (
                <div
                  key={col}
                  className={classNames(classes.cell, classes.seat, this.getSeatClassName(`${String.fromCharCode(65+row)}${col+1}`))}
                  onClick={isBookableSeat(this.getSeatChar(`${String.fromCharCode(65+row)}${col+1}`)) ? this.onClick(`${String.fromCharCode(65+row)}${col+1}`) : undefined}
                >
                  <div className={classes.seatText}>
                    {this.getSeatText(`${String.fromCharCode(65+row)}${col+1}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
}

SeatTable.propTypes = {
  classes: PropTypes.object.isRequired,
  layout: PropTypes.arrayOf(String).isRequired,
  bookings: PropTypes.arrayOf(Object).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default withStyles(styles)(SeatTable);
