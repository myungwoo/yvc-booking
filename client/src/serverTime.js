import axios from 'axios';
import moment from 'moment';

class TimeUtil {
  timeDiff = null;

  init = async () => {
    const bef = moment();
    const { time: datetimeStr } = (await axios.get('/api/server/info')).data;
    const aft = moment();
    const serverNow = moment(moment(datetimeStr)-(aft-bef)/2);
    this.timeDiff = serverNow - moment();
  };

  getNow = () => {
    if (this.timeDiff === null) return moment();
    return moment(moment() + this.timeDiff);
  };
}

const serverTime = new TimeUtil();
export default serverTime;
