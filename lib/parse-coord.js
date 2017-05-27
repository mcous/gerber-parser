// cordinate parser function
// takes in a string with X_____Y_____I_____J_____ and a format object
// returns an object of {x: number, y: number, etc} for coordinates it finds
'use strict'

// convert to normalized number
var normalize = require('./normalize-coord')

var MATCH = [
  {coord: 'x', test: /X([+-]?[\d\.]+)/},
  {coord: 'y', test: /Y([+-]?[\d\.]+)/},
  {coord: 'i', test: /I([+-]?[\d\.]+)/},
  {coord: 'j', test: /J([+-]?[\d\.]+)/},
  {coord: 'a', test: /A([\d\.]+)/}
]

var parse = function(coord, format) {
  if (coord == null) {
    return {}
  }

  if ((format.zero == null) || (format.places == null)) {
    throw new Error('cannot parse coordinate with format undefined')
  }

  // pull out the x, y, i, and j
  var parsed = MATCH.reduce(function(result, matcher) {
    var coordMatch = coord.match(matcher.test)

    if (coordMatch) {
      result[matcher.coord] = normalize(coordMatch[1], format)
    }

    return result
  }, {})

  return parsed
}

var reTRAILING_X = /X0+[1-9]+Y\d+/
var reTRAILING_Y = /X\d+Y0+[1-9]+/
var reLEADING_X = /X[1-9]+0+Y\d+/
var reLEADING_Y = /X\d+Y[1-9]+0+/

parse.detectZero = function(coord) {
  if (reLEADING_X.test(coord) || reLEADING_Y.test(coord)) {
    return 'L'
  }

  if (reTRAILING_X.test(coord) || reTRAILING_Y.test(coord)) {
    return 'T'
  }

  return null
}

module.exports = parse
