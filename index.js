'use strict';

var SPI = require('spi');
var gpio = require('onoff').Gpio;

module.exports = (function() {
  var irqPin = 183;

  var irq = new Gpio(183, 'out');
  var spi;

  var nrf = {};

  Object.defineProperty(nrf, 'spiDev', {
    set: function(y) {
      spi = new SPI.Spi(y);
      spi.maxSpeed(10000000);
      spi.open();
    }
  });

})
