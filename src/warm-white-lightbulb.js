"use strict";
var GeneralBulb = require('./generalbulb.js');

const COLOR_MIN = 140;
const COLOR_MAX = 500;

module.exports = class WarmWhiteLightbulb extends GeneralBulb {

    constructor(platform, device) {
        super(platform, device);

        this.enableColorTemperature();
    }

    deviceChanged() {
        super.deviceChanged();
        this.updateColorTemperature();
    }

    enableColorTemperature() {
        let brightness = this.lightbulb.addCharacteristic(this.Characteristic.Brightness);
        let colorTemperature = this.lightbulb.addCharacteristic(this.Characteristic.ColorTemperature);

        colorTemperature.on('get', (callback) => {
            callback(null, this.colorTemperature);
        });
        colorTemperature.on('set', (value, callback) => {
            this.setColorTemperature(value, this.brightness, callback);
        });

        brightness.on('get', (callback) => {
            callback(null, this.brightness);
        });
        brightness.on('set', (value, callback) => {
            this.setColorTemperature(this.colorTemperature, value, callback);
        });

        this.updateColorTemperature();
    }

    updateColorTemperature() {
        let light = this.device.lightList[0];
        let brightness = this.lightbulb.getCharacteristic(this.Characteristic.Brightness);
        let colorTemperature = this.lightbulb.getCharacteristic(this.Characteristic.ColorTemperature);

        this.brightness = light.dimmer;
        this.colorTemperature = COLOR_MIN + ((COLOR_MAX - COLOR_MIN) * (light.colorTemperature / 100));

        this.log('Updating brightness to %s%% and color temperature to %s%% on lightbulb \'%s\'', this.brightness, light.colorTemperature, this.name);
        brightness.updateValue(this.brightness);
        colorTemperature.updateValue(this.colorTemperature);
    }

    setColorTemperature(colorTemperature, brightness, callback) {
        this.brightness = brightness;

        // Make sure it is between MIN and MAX
        colorTemperature = Math.max(Math.min(colorTemperature, COLOR_MAX), COLOR_MIN);
        this.colorTemperature = colorTemperature;
        let percent = parseInt(100 * (this.colorTemperature - COLOR_MIN) / (COLOR_MAX - COLOR_MIN));

        this.log('Setting brightness to %s%% and color temperature to %s%% on lightbulb \'%s\'', brightness, percent, this.name);

        this.platform.gateway.operateLight(this.device, {
            dimmer: this.brightness,
            colorTemperature: percent
        })
        .then(() => {
            if (callback)
                callback();
        });
    }
};
