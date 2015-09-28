// test suite for the top level gerber parser class
'use strict'

var Transform = require('readable-stream').Transform
var expect = require('chai').expect
var repeat = require('lodash.repeat')

var parser = require('../lib/gerber-parser')

describe('gerber parser', function() {
  describe('factory and options', function() {
    it('should return a transform stream', function() {
      var p = parser()
      expect(p).to.be.an.instanceOf(Transform)
    })

    it('should allow setting the zero suppression', function() {
      var p = parser({zero: 'L'})
      expect(p.format.zero).to.equal('L')
      p = parser({zero: 'T'})
      expect(p.format.zero).to.equal('T')
    })

    it('should allow setting the number places format', function() {
      var p = parser({places: [1, 4]})
      expect(p.format.places).to.eql([1, 4])
      p = parser({places: [3, 4]})
      expect(p.format.places).to.eql([3, 4])
    })

    it('should allow setting the filetype', function() {
      var p = parser({filetype: 'gerber'})
      expect(p.format.filetype).to.equal('gerber')
      p = parser({filetype: 'drill'})
      expect(p.format.filetype).to.equal('drill')
    })

    it('should throw with bad options to the contructor', function() {
      var p
      var badOpts = {places: 'string'}
      expect(function() {p = parser(badOpts)}).to.throw(/places/)
      badOpts = {places: [1, 2, 3]}
      expect(function() {p = parser(badOpts)}).to.throw(/places/)
      badOpts = {places: ['a', 'b']}
      expect(function() {p = parser(badOpts)}).to.throw(/places/)
      badOpts = {zero: 4}
      expect(function() {p = parser(badOpts)}).to.throw(/zero/)
      badOpts = {zero: 'F'}
      expect(function() {p = parser(badOpts)}).to.throw(/zero/)
      badOpts = {filetype: 'foo'}
      expect(function() {p = parser(badOpts)}).to.throw(/type/)
      void p
    })
  })

  describe('reading files', function() {
    var p
    beforeEach(function() {
      p = parser()
    })

    describe('determining filetype', function() {
      it('should not set any filetype with a blank line', function() {
        p.write('\n')
        expect(p.format.filetype).to.be.null
        p.write('')
        expect(p.format.filetype).to.be.null
      })

      it('should set filetype to gerber if it sees a *', function() {
        p.write('*\n')
        expect(p.format.filetype).to.equal('gerber')
      })

      it('should set filetype to drill if line ends without *', function() {
        p.write('M48\n')
        expect(p.format.filetype).to.equal('drill')
      })

      it('should ignore a star in a drill comment', function() {
        p.write('; **hey a comment**\n')
        expect(p.format.filetype).to.equal('drill')
      })

      it('should not overwrite a filetype', function() {
        p.format.filetype = 'gerber'
        p.write('G04 M48\n')
        expect(p.format.filetype).to.equal('gerber')

        p.format.filetype = 'drill'
        p.write('M04*\n')
        expect(p.format.filetype).to.equal('drill')
      })

      it('should error if unknown after 65535 characters', function(done) {
        this.timeout(1000)
        p.once('error', function(err) {
          expect(err.message).to.match(/determine filetype/)
          done()
        })
        p.write(repeat(';', 10000000))
      })

      it('should stash chunks if it cannot make a determination', function() {
        p.write('G04 this line gets split into')
        expect(p._stash).to.equal('G04 this line gets split into')
        p.write('two chunks*\n')
        expect(p._stash).to.be.empty
      })
    })

    it("should know what line it's on", function() {
      p.write(repeat('*\n', 5))
      expect(p.line).to.equal(5)
    })
  })
})
