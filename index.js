'use strict';

var SPI = require('pi-spi');
var gpio = require('onoff').Gpio;
var sleep = require('teddybear');
// var _r = require('./magicNums.js');

//var rstPin = 13;
//var irqPin = 12;
//var slp_trPin = 183;

var rst;// = new gpio(rstPin, 'out');
var irq;// = new gpio(irqPin, 'out');
var slp_tr;// = new gpio(slp_trPin, 'out');

var spi;
var spiDev = "/dev/spidev5.1";

module.exports = {
  _r: require('./magicNums.js'),

  setSpiDev: function(spidev, rstPin, slp_trPin, irqPin) {
    this.spiDev = spidev;
    this.spi = SPI.initialize(spiDev);
    this.spi.clockSpeed(2000000);

    // set up pins
    this.rst = new gpio(rstPin, 'out');
    this.irq = new gpio(irqPin, 'in', 'rising');
    this.slp_tr = new gpio(slp_trPin, 'out');

    this.rst.writeSync(0);
    this.slp_tr.writeSync(0);
  },

  spiTransfer: function(data, cb) {
    var txBuf = new Buffer(data);
    var rxBuf;

    this.spi.transfer(txBuf, txBuf.length, function(e,d) {
      if (e) console.error(e);
      cb(e,d);
    });
  },

  readRegister: function(register, cb) {
    var regCMD = 0x80 | register;
    var txCmd = Buffer([regCMD, 0x00]);
    this.spiTransfer(txCmd, function(e,d) {
      cb(e,d[1]);
    });
  },

  readFrame: function(cb) {
    var len = 0;
    var cmdBuf = new Buffer([0x20, 0x00]);
    module.exports.spiTransfer(cmdBuf, function(e,d) {
      cmdBuf = new Buffer(d[1]);
      cmdBuf.fill(0x00);
      module.exports.spiTransfer(cmdBuf, function(e,d) {
        cb(d);
      });
      if (e) console.error(e);
    });
  },

  writeRegister: function(register, value) {
    var regCMD = 0xC0 | register;
    var txCmd = Buffer([regCMD, value]);
    this.spiTransfer(txCmd, function(e,d) {
      if (e) console.error(e);
    });
  },

  initializeRadio: function() {
    // set up interrupt handler
    this.setupInterrupt();

    // reset the radio
    this.rst.writeSync(0);
    sleep(50); // wait 50 ms
    this.rst.writeSync(1);
    sleep(50); // and another 50 ms

    // set channel
    this.writeRegister(0x08, 0x0C); // channel 12, xbee default

  },

  setTRXState: function(state) {

  },

  setIEEEAddress: function(address) {
    for (var i = 0; i < 8; i++) {
      // console.error("WRITE: " + address[i].toString());
      this.writeRegister(module.exports._r.REGISTERS['REG_IEEE_ADDR_0'] + i, address[i]);
    }
  },

  readIEEEAddress: function(cb) {
    var addrBuf = "";
    for (var i = 0; i < 8; i++) {
      this.readRegister(module.exports._r.REGISTERS['REG_IEEE_ADDR_0'] + i, function(e,d) {
        if (e) console.error("Read Error: " + e);
        addrBuf += d;
        // console.error("READ:" + d.toString());
      });
    }
    cb(addrBuf);
  },

  setShortAddress: function(address) {
    this.writeRegister(module.exports._r.REGISTERS['REG_SHORT_ADDR_0'], address[0]);
    this.writeRegister(module.exports._r.REGISTERS['REG_SHORT_ADDR_1'], address[1]);
  },

  setPANID: function(panID) {
    this.writeRegister(module.exports._r.REGISTERS['REG_PAN_ID_0'], panID[0]);
    this.writeRegister(module.exports._r.REGISTERS['REG_PAN_ID_1'], panID[1]);
  },

  setPromiscuousMode: function(enable) {

  },

  setupInterrupt: function() {
    this.irq.watch(function() {
      module.exports.readRegister(module.exports._r.REGISTERS['REG_IRQ_STATUS'], function(e,d) {
        if (d === 12) {
          module.exports.readFrame(function(data) {
            console.log(new Date().getTime());
            console.log(data);
          });
        }
      });
    });
  }
};

function test() {
  //module.exports.readRegister(0x0F, function(e,d) {
  //  console.error(d);
  //});
}
