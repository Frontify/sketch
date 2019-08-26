let deepExtend = function(out) {
  out = out || {};

  for (let i = 1; i < arguments.length; i++) {
    let obj = arguments[i];

    if (!obj)
      continue;

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

export default deepExtend;
