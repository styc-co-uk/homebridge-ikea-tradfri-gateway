"use strict";
var Device   = require('./device.js');

module.exports = class AirPurifier extends Device {

    constructor(platform, device) {
        super(platform, device);

        this.log('Creating new air purifier %s (%s)...', this.name, this.id);
        this.airPurifier = new this.Service.AirPurifier(this.name, this.uuid);

        this.addService('airPurifier', this.airPurifier);
        this.enablePower();
        this.enableState();
        this.enableAuto();
        this.enableSpeed();
        this.enableAirQuality();
        this.enableControlLock();
        this.enableStatus();
    }

    deviceChanged(device) {
        super.deviceChanged();
        this.updatePower();
        this.updateState();
        this.updateAuto();
        this.updateSpeed();
        this.updateAirQuality();
        this.updateControlLock();
        this.updateStatus();
    }

    enablePower() {
        var active = this.airPurifier.getCharacteristic(this.Characteristic.Active);
        active.on('get', (callback) => {
            callback(null, this.active);
        });
        active.on('set', (value, callback) => {
            this.setPower(value, callback);
        });
        this.updatePower();
    }

    enableState() {
        var currentAirPurifierState = this.airPurifier.getCharacteristic(this.Characteristic.CurrentAirPurifierState);
        currentAirPurifierState.on('get', (callback) => {
            callback(null, this.currentAirPurifierState);
        });
        this.updateState();
    }

    enableAuto() {
        var targetAirPurifierState = this.airPurifier.getCharacteristic(this.Characteristic.TargetAirPurifierState);
        var rotationSpeed = this.airPurifier.getCharacteristic(this.Characteristic.RotationSpeed);
        targetAirPurifierState.on('get', (callback) => {
            callback(null, this.targetAirPurifierState);
        });
        targetAirPurifierState.on('set', (value, callback) => {
            this.setAuto(value, rotationSpeed, callback);
        });
        this.updateAuto();
    }

    enableSpeed() {
        var rotationSpeed = this.airPurifier.getCharacteristic(this.Characteristic.RotationSpeed);
        rotationSpeed.on('get', (callback) => {
            callback(null, this.rotationSpeed);
        });
        rotationSpeed.on('set', (value, callback) => {
            this.setSpeed(value, callback);
        });
        this.updateSpeed();
    }

    enableAirQuality() {
        var airQuality = this.airPurifier.getCharacteristic(this.Characteristic.AirQuality);
        var pm2_5Density = this.airPurifier.getCharacteristic(this.Characteristic.PM2_5Density);
        airQuality.on('get', (callback) => {
            callback(null, this.airQuality);
        });
        pm2_5Density.on('get', (callback) => {
            callback(null, this.pm2_5Density);
        });
        this.updateAirQuality();
    }

    enableControlLock() {
        var lockPhysicalControls = this.airPurifier.getCharacteristic(this.Characteristic.LockPhysicalControls);
        lockPhysicalControls.on('get', (callback) => {
            callback(null, this.lockPhysicalControls);
        });
        lockPhysicalControls.on('set', (value, callback) => {
            this.setControlLock(value, callback);
        });
        this.updateControlLock();
    }

    enableStatus() {
        var alive = this.airPurifier.addCharacteristic(this.Characteristic.StatusActive);

        alive.on('get', (callback) => {
            this.log('Purifier %s in currently %s.', this.name, this.device.alive ? 'ALIVE' : 'DEAD');
            callback(null, this.device.alive);
        });

        this.updateStatus();
    }

    setPower(value, callback) {
        this.log('Setting active to %s on air purifier \'%s\'', value ? 'ACTIVE' : 'INACTIVE', this.name);
        this.active = value;

        this.platform.gateway.operateAirPurifier(this.device, {
            fanMode: this.active
        })
        .then(() => {
            if (callback)
                callback();
        })
        .catch((error) => {
            this.log(error);
        });
    }

    setAuto(value, rotationSpeed, callback) {
        this.log('Setting control mode to %s on air purifier \'%s\'', value ? 'AUTO' : 'MANUAL', this.name);
        this.fanMode = value;
        if (value == 1) {
            this.fanMode = value;
            this.log('FANMODE 1');
        } else {
            this.fanMode = this.rotationSpeed/2;
            this.log('FANMODE 0',this.fanMode);
        };
        this.platform.gateway.operateAirPurifier(this.device, {
            fanMode: this.fanMode
        })
        .then(() => {
            if (callback)
                callback();
        })
        .catch((error) => {
            this.log(error);
        });
    }

    setSpeed(value, callback) {
        this.log('Setting speed to %s%% on air purifier \'%s\'', value, this.name);
        this.fanSpeed = value/2;

        this.platform.gateway.operateAirPurifier(this.device, {
            fanSpeed: this.fanSpeed
        })
        .then(() => {
            if (callback)
                callback();
        })
        .catch((error) => {
            this.log(error);
        });
    }

    setControlLock(value, callback) {
        this.log('Setting physical controls to %s on air purifier \'%s\'', value ? 'LOCK' : 'UNLOCK', this.name);
        this.lockPhysicalControls = value;

        this.platform.gateway.operateAirPurifier(this.device, {
            controlsLocked: this.lockPhysicalControls
        })
        .then(() => {
            if (callback)
                callback();
        })
        .catch((error) => {
            this.log(error);
        });
    }

    updatePower() {
        var purifier = this.device.airPurifierList[0];
        var active = this.airPurifier.getCharacteristic(this.Characteristic.Active);
        this.active = (purifier.fanMode != 0);
        this.log('Updating active to %s on air purifier \'%s\'', this.active ? 'ACTIVE' : 'INACTIVE', this.name);
        active.updateValue(this.active);
    }

    updateState() {
        var purifier = this.device.airPurifierList[0];
        var currentAirPurifierState = this.airPurifier.getCharacteristic(this.Characteristic.CurrentAirPurifierState);
        if (purifier.fanMode >= 1) {
            this.currentAirPurifierState = 2;
        } else {
            this.currentAirPurifierState = 0;
        } 
        this.log('PURIFIER FAN MODE', purifier.fanMode)
        this.log('PURIFIER FAN SPEED', purifier.fanSpeed)
        // this.log('Updating fan mode to %s on air purifier \'%s\'', this.fanMode, this.name);
        currentAirPurifierState.updateValue(this.currentAirPurifierState);
    }

    updateAuto() {
        var purifier = this.device.airPurifierList[0];
        var targetAirPurifierState = this.airPurifier.getCharacteristic(this.Characteristic.TargetAirPurifierState);
        this.log('fanmode',purifier.fanMode);
        if (purifier.fanMode != 0) {
            if (purifier.fanMode == 1) {
                this.targetAirPurifierState = 1;
            } else {
                this.targetAirPurifierState = 0;
            };
            this.log('Updating control mode to %s on air purifier \'%s\'', targetAirPurifierState ? 'AUTO' : 'MANUAL', this.name);
            targetAirPurifierState.updateValue(this.targetAirPurifierState);
        }
    }

    updateSpeed() {
        var purifier = this.device.airPurifierList[0];
        var rotationSpeed = this.airPurifier.getCharacteristic(this.Characteristic.RotationSpeed);
        this.rotationSpeed = purifier.fanSpeed*2;
        this.log('Updating speed to %s%% on air purifier \'%s\'', this.rotationSpeed, this.name);
        rotationSpeed.updateValue(this.rotationSpeed);
    }

    updateAirQuality() {
        var purifier = this.device.airPurifierList[0];
        var airQuality = this.airPurifier.getCharacteristic(this.Characteristic.AirQuality);
        var airQualityDesc = 'UNKNOWN';
        var pm2_5Density = this.airPurifier.getCharacteristic(this.Characteristic.PM2_5Density);
        this.pm2_5Density = purifier.airQuality;
        if (purifier.airQuality > 0 && purifier.airQuality <= 15) {
            this.airQuality = 1;
            this.airQualityDesc = 'EXCELLENT';
        } else if (purifier.airQuality <= 35) {
            this.airQuality = 2;
            this.airQualityDesc = 'GOOD';
        } else if (purifier.airQuality <= 55) {
            this.airQuality = 3;
            this.airQualityDesc = 'FAIR';
        } else if (purifier.airQuality <= 85) {
            this.airQuality = 4;
            this.airQualityDesc = 'INFERIOR';
        } else if (purifier.airQuality <= 1000) {
            this.airQuality = 5;
            this.airQualityDesc = 'POOR';
        } else {
            this.airQuality = 0;
            this.pm2_5Density = 0;
        };
        this.log('Updating PM2.5 density to %s ppm on air purifier \'%s\'', this.pm2_5Density, this.name);
        this.log('Updating air quality to %s on air purifier \'%s\'', this.airQualityDesc, this.name);
        airQuality.updateValue(this.airQuality);
        pm2_5Density.updateValue(this.pm2_5Density);
    }

    updateControlLock() {
        var purifier = this.device.airPurifierList[0];
        var lockPhysicalControls = this.airPurifier.getCharacteristic(this.Characteristic.LockPhysicalControls);
        this.lockPhysicalControls = purifier.controlsLocked;
        this.log('Updating physical controls to %s on air purifier \'%s\'', this.lockPhysicalControls ? 'LOCK' : 'UNLOCK', this.name);
        lockPhysicalControls.updateValue(this.lockPhysicalControls);
    }
        
    updateStatus() {
        var alive = this.airPurifier.getCharacteristic(this.Characteristic.StatusActive);

        this.log('Updating active status to %s on air purifier \'%s\'', this.device.alive ? 'ALIVE' : 'DEAD', this.name);
        alive.updateValue(this.device.alive);
    }

};