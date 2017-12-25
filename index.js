const computeSeconds = function (h, m, s, f) {
  return (h | 0) * 3600 + (m | 0) * 60 + (s | 0) + (f | 0) / 1000;
};

// Try to parse input as a time stamp.
const parseTimeStamp = function (input) {
  const m = input.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/);
  if (!m) {
    return null;
  }
  if (m[3]) {
    // Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
    return computeSeconds(m[1], m[2], m[3].replace(':', ''), m[4]);
  }
  else if (parseInt(m[1]) > 59) {
    // Timestamp takes the form of [hours]:[minutes].[milliseconds]
    // First position is hours as it's over 59.
    return computeSeconds(m[1], m[2], 0, m[4]);
  }
  else {
    // Timestamp takes the form of [minutes]:[seconds].[milliseconds]
    return computeSeconds(0, m[1], m[2], m[4]);
  }
};

export default class WebvttCore {
  constructor (text) {
    this.cues_ = [];
    if (text) {
      this.parse(text);
    }
  }

  // open for overriding
  contentParser (raw) {
    return raw;
  }

  parse (text) {
    if (typeof text != 'string') {
      return;
    }

    const lines = text.split(/\r?\n/g);
    if (lines.length <= 0) {
      return;
    }

    if (lines[0].toLowerCase() === 'webvtt') {
      lines.splice(0, 2);
    }

    var tempLines = [];
    const cues = lines.reduce((result, line) => {
        const len = result.length;
        const pre = result[len - 1];
        var end = null;
        line = line.trim();

        if (end = parseTimeStamp(line)) {
          let start = 0;
          if (pre) {
            pre.raw = tempLines.join('\n');
            pre.content = this.contentParser(pre.raw);
            tempLines = [];
            start = pre.end;
          }
          result.push({
            start: start,
            end: end,
            raw: '',
            content: null
          });
        } else if (pre) {
          const preLine = tempLines[tempLines.length - 1];
          if (preLine === undefined || preLine.length >= 1) {
            tempLines.push(line);
          }
        }
        return result;
    }, []);
    this.cues_ = this.cues_.concat(cues);
  }

  getCue(seconds) {
    const len = this.cues_.length;

    if (seconds < 0) {
      return;
    }
    if (len <= 0) {
      return;
    }

    if (seconds > this.cues_[len - 1].end) {
      return;
    }

    var min = 0;
    var max = len;
    var result = null;
    var mid = null;
    var i = null;
    var cue = null;
    do {
      mid = Math.floor((max - min) / 2);
      i = min + mid;
      cue = this.cues_[i];
      if (seconds > cue.end) {
        min = i;
      }
      else if (seconds < cue.start) {
        max = i;
      }
      else if (seconds <= cue.end && seconds >= cue.start) {
        result = cue;
        break;
      }
    } while (mid);

    return result;
  }

  getCues() {
    return this.cues_;
  }
}
