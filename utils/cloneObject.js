module.exports = function (err) {
  const clonedError = {};

  // Copy enumerable properties
  for (let key in err) {
    if (Object.prototype.hasOwnProperty.call(err, key)) {
      clonedError[key] = err[key];
    }
  }

  // Copy non-enumerable properties
  Object.getOwnPropertyNames(err).forEach((key) => {
    clonedError[key] = err[key];
  });

  return clonedError;
};
