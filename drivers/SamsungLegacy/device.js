'use strict';

const Homey = require('homey');
const macaddress = require('macaddress');

const SamDevice = require('../../lib/SamDevice');
const SamsungLegacy = require('../../lib/samsung_legacy');
const ip = require('ip');

module.exports = class SamsungLegacyDevice extends SamDevice {

    async onInit() {
        super.onInit('Samsung Legacy');

        let settings = await this.getSettings();
        this._samsung = new SamsungLegacy({
            device: this,
            name: "homey",
            ip_address: settings.ipaddress,
            mac_address: settings.mac_address,
            port: 55000,
            api_timeout: 2000,
            delay_keys: settings.delay_keys || 100,
            delay_channel_keys: settings.delay_channel_keys || 1250,
            ip_address_homey: ip.address(),
            appString: 'iphone..iapp.samsung',
            tvAppString: 'iphone.UN60D6000.iapp.samsung'
        });

        let self = this;
        macaddress.one(function (err, mac) {
            self._samsung.config()["mac_address_homey"] = mac;
            self.log(`Found MAC address for Homey -> ${mac}`, self._samsung.config());
        });
    }

    onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
        if (changedKeysArr.includes('ipaddress')) {
            this.updateIPAddress(newSettingsObj.ipaddress);
        }
        if (changedKeysArr.includes('poll_interval')) {
            this.addPollDevice(newSettingsObj.poll_interval);
        }
        if (changedKeysArr.includes('delay_keys')) {
            this._samsung.config()["delay_keys"] = newSettingsObj.delay_keys;
        }
        if (changedKeysArr.includes('delay_channel_keys')) {
            this._samsung.config()["delay_channel_keys"] = newSettingsObj.delay_channel_keys;
        }
        callback(null, true);
    }

    async checkIPAddress(ipaddress) {
        let info = await this._samsung.pingPort(ipaddress);
        if (info) {
            this.log('TV set available');
            this.setAvailable();
        } else {
            this.log('TV set unavailable');
            this.setUnavailable('TV not found. Check IP address.');
        }
    }

    async pollDevice() {
        if (this._is_powering_onoff !== undefined) {
            return;
        }
        let onOff = await this._samsung.apiActive();
        if (onOff && this.getAvailable() === false) {
            this.setAvailable();
        }
        if (onOff !== this.getCapabilityValue('onoff')) {
            this.setCapabilityValue('onoff', onOff).catch(console.error);
        }
        if (onOff) {
            this.log('pollDevice: TV is on');
        }
    }

};
