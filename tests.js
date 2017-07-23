'use strict';

var assert = require('assert');
var clone = require('clone');
var json0 = require('ot-json0/lib/json0');
var jsondiff = require('./index.js');

var tests = [
  //tests of li/ld
  [[], ['foo']],
  [['foo'], ['bar'], [{p: [0], t: 'text0', o: [{p: 0, d: 'foo'}, {p: 0, i: 'bar'}]}]],
  [['foo', 'bar'], ['bar']],
  [['foo', 'bar', 'quux'], ['bar']],
  [[['foo', 'bar'], 'bar'], ['bar', 'bar']],
  [[['foo', 'bar'], 'bar'], []],
  [[[['foo'], 'bar'], 'quux'], ['quux']],
  [['foo', 'bar', 'quux'], ['bar', 'quux']],
  // tests for oi/od
  [{}, { foo: 'bar' }],
  [{ foo: 'bar' }, { foo: 'quux' }],
  [[{ foo: 'bar' }], [{}]],
  // big tests
  [
    [],
    ['the', { quick: 'brown', fox: 'jumped' }, 'over', { the: ['lazy', 'dog'] }]
  ],
  [
    [
      'the',
      { quick: 'brown', fox: 'jumped' },
      'over',
      { the: ['lazy', 'dog'] }
    ],
    []
  ],
  [
    [
      [
        'the',
        { quick: 'black', fox: 'jumped' },
        'over',
        { the: ['lazy', 'dog'] }
      ]
    ],
    [
      'the',
      { quick: 'brown', fox: 'leapt' },
      'over',
      { the: ['stupid', 'dog'] }
    ]
  ],
  // real-life jsonml tests
  [
    ['html', {}, ['body', {}, '\n\n', '\n\n', ['p', {}, 'Quux!']], '\n'],
    ['html', {}, ['body', {}, '\n\n', '\n\n\n\n', ['p', {}, 'Quux!']], '\n']
  ],
  [
    ['html', {}, ['body', {}, '\n\n', '\n\n', ['p', {}, 'Quux!']], '\n'],
    ['html', {}, ['body', {}, '\n\n\n\n', ['p', {}, 'Quux!']], '\n']
  ],
  [
    [
      'html',
      {},
      [
        'body',
        {},
        'foo',
        ['b', {}, 'hello'],
        'foo',
        ['b', {}],
        ['strong', {}, 'bar']
      ]
    ],
    [
      'html',
      {},
      ['body', {}, 'foo', ['b', {}], ['strong', {}, 'bar'], ['p', {}]]
    ]
  ],
  [
    [
      'html',
      {},
      '\n',
      [
        'body',
        { contenteditable: '' },
        '\n',
        ['div', {}, 'a'],
        '\n',
        ['div', {}, 'b'],
        '\n',
        ['div', {}, 'c'],
        '\n'
      ],
      '\n'
    ],
    [
      'html',
      {},
      '\n',
      [
        'body',
        { contenteditable: '' },
        '\n',
        ['div', {}, 'b'],
        '\n',
        ['div', {}, 'c'],
        '\n'
      ],
      '\n'
    ]
  ],
  [
    [
      'html',
      {},
      '\n',
      [
        'body',
        { contenteditable: 'true' },
        ['p', {}, 'foo'],
      ],
      '\n'
    ],
    [
      'html',
      {},
      '\n',
      [
        'body',
        { contenteditable: 'false' },
        ['p', {}, 'bar']
      ],
      '\n'
    ],
	[
	  {
		p: [3, 1, 'contenteditable'],
		od: 'true',
		oi: 'false'
	  }, 
	  {
		p: [3, 2, 2],
		o: [
		  {
			p: 0,
			d: 'foo'
		  },
		  {
			p: 0,
			i: 'bar'
		  }
		],
		t: 'text0'
	  }
	]
  ],
  [
    {
      value: 0
    },
    {
      value: 1
    }
  ],
  [
    {
      value: 0
    },
    {
      value: -1
    }
  ],
  [
    {
      value: 0
    },
    {
      value: ['string']
    }
  ],
  [['asdf'], ['ar']],
  [['orange'], ['the banana is an orange']],
  [['purple'], ['p1i2r3p4l5e6']],
  [['a'], ['a', 'b', 'c']],
  ['😀 ', '😀'],
  ['😀 ', ' '],
  ['😀😇😀 😀😇😀', '😀a😀 😀😀'],
  ['😀😀 😀😇😀', '😀😇😀 😀😀']
];

// Test whether jsondiff modifies the input/output (it shouldn't).
tests.forEach(function([input, output]) {
  var cinput = clone(input),
    coutput = clone(output);
  jsondiff(input, output);
  assert.deepEqual(cinput, input);
  assert.deepEqual(coutput, output);
});

// Expected ops for each test
tests.forEach(function([input, output, expectedOps]) {
  if (expectedOps) {
    var ops = jsondiff(input, output);
    // console.log(require("util").inspect(ops, { showHidden: true, depth: null }));
    expectedOps.forEach(function(expectedOp, opIndex) {
	    assert.deepEqual(ops[opIndex], expectedOp);
    });
  }
});

// Actual tests
tests.forEach(function([input, output]) {
  var ops = jsondiff(input, output);
  ops.forEach(function(op) {
    // assert.doesNotThrow(
    //   function() {
    input = json0.apply(input, [op]);
    //   },
    //   null,
    //   'json0 could not apply transformation'
    // );
  });
  assert.deepEqual(input, output);
});

console.log('No errors!');
