"use strict";
var GeneralBulb = require('./generalbulb.js');

module.exports = class MonoLightbulb extends GeneralBulb {

    constructor(platform, device) {
        super(platform, device);

        this.enableBrightness();
    }

    deviceChanged(device) {
        super.deviceChanged();
        this.updateBrightness();
    }

    enableBrightness() {
        var brightness = this.lightbulb.addCharacteristic(this.Characteristic.Brightness);

        brightness.on('get', (callback) => {
            callback(null, this.brightness);
        });

        brightness.on('set', (value, callback) => {
            this.setBrightness(value, callback);
        });

        this.updateBrightness();
    }

    setBrightness(value, callback) {
        this.log('Setting brightness to %s on lightbulb \'%s\'', value, this.name);
        this.brightness = value;

        this.platform.gateway.operateLight(this.device, {
            dimmer: this.brightness
        })
        .then(() => {
            if (callback)
                callback();
        });
    }

    updateBrightness() {
        var light = this.device.lightList[0];
        var brightness = this.lightbulb.getCharacteristic(this.Characteristic.Brightness);

        this.brightness = light.dimmer;

        this.log('Updating brightness to %s%% on lightbulb \'%s\'', this.brightness, this.name);
        brightness.updateValue(this.brightness);
    }
};
