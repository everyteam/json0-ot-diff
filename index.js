'use strict';

var equal = require('deep-equal');
var json0 = require('ot-json0/lib/json0');
var jsdiff = require('diff');

var optimize = function(ops) {
  /*
	Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
	after each other, and then consolidate them.
	 */
  for (var i = 0, l = ops.length - 1; i < l; ++i) {
    var a = ops[i],
      b = ops[i + 1];

    // The ops must have same path.
    if (!equal(a.p.slice(0, -1), b.p.slice(0, -1))) {
      continue;
    }

    // The indices must be successive.
    if (a.p[a.p.length - 1] + 1 !== b.p[b.p.length - 1]) {
      continue;
    }

    // The first operatin must be an insertion and the second a deletion.
    if (!a.li || !b.ld) {
      continue;
    }

    // The object we insert must be equal to what we delete next.
    if (!equal(a.li, b.ld)) {
      continue;
    }

    delete a.li;
    delete b.ld;
  }

  ops = ops.filter(function(op) {
    return Object.keys(op).length > 1;
  });

  return ops;
};

var diff = function(input, output, path = []) {
  // If the last element of the path is a string, that means we're looking at a key, rather than
  // a number index. Objects use keys, so the target for our insertion/deletion is an object.
  var isObject = typeof path[path.length - 1] === 'string';

  // If input and output are equal, no operations are needed.
  if (equal(input, output)) {
    return [];
  }

  // If there is no output, we need to delete the current data (input).
  if (typeof output === 'undefined') {
    var op = { p: path };
    op[isObject ? 'od' : 'ld'] = input;
    return [op];
  }

  // If there is no input, we need to add the new data (output).
  if (typeof input === 'undefined') {
    var op = { p: path };
    op[isObject ? 'oi' : 'li'] = output;
    return [op];
  }

  if (typeof output === 'number' && typeof input === 'number') {
    var op = { p: path };
    op['na'] = output - input;
    return [op];
  }

  // This should do a string OT operation instead of what it is doing.
  if (typeof output === 'string' && typeof input === 'string') {
    var ops = [];
    var d = jsdiff.diffChars(input, output);
    var idx = 0;
    for (var i = 0; i < d.length; i++) {
      if (d[i].removed) {
        ops.push({ p: idx, d: d[i].value });
      } else if (d[i].added) {
        ops.push({ p: idx, i: d[i].value });
        idx += [...d[i].value].length;
      } else {
        idx += [...d[i].value].length;
      }
    }
    return [{ p: path, t: 'text0', o: ops }];
  }

  if (isScalar(input) || isScalar(output)) {
    var op = { p: path };
    op[isObject ? 'od' : 'ld'] = input;
    op[isObject ? 'oi' : 'li'] = output;
    return [op];
  }

  if (Array.isArray(output)) {
    var ops = [];
    var l = Math.max(input.length, output.length);
    var ops = [];
    var offset = 0;
    for (var i = 0; i < l; ++i) {
      var newOps = diff(input[i], output[i], [...path, i + offset]);
      newOps.forEach(function(op) {
        var opParentPath = op.p.slice(0, -1);
        if (equal(path, opParentPath)) {
          if ('ld' in op && !('li' in op)) offset--;
        }
        ops.push(op);
      });
    }
    return ops;
  }

  var ops = [];
  var keys = Array.from(
    new Set([...Object.keys(input), ...Object.keys(output)])
  ).sort();

  keys.forEach(function(key) {
    var newOps = diff(input[key], output[key], [...path, key]);
    ops = ops.concat(newOps);
  });
  return ops;
};

var optimizedDiff = function(input, output) {
  return optimize(diff(input, output));
};

var isScalar = function(o) {
  return (
    typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean'
  );
};

module.exports = optimizedDiff;
