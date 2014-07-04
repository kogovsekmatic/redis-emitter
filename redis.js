/**
 * Redis Event Emitter Module
 * @author Matic Kogovšek [kogovsek.matic@gmail.com]
 */

/**
 * Module dependencies
 */
var ee = require('../ee') // Event Emitter
    , RedisChannel = require('./redis/channel')
    , util = require('util')
    , msgpack = require('msgpack-js')
    , _ = require('underscore')
    , redis = require('../redis')
    , pub = redis.getClient('eventemitter.pub')
    , sub = redis.getClient('eventemitter.sub')
    , rcl = redis.getClient('eventemitter.client');

/**
 * Redis Event Emitter
 * @constructor
 */
function RedisEventEmitter(){
    var self = this;

    /**
     * Redis Channels
     */
    this._channels = {};

    /**
     * Subscriptions
     */
    this._subscriptions = {};

    /**
     * Check if glob style pattern
     */
    this._pattern = new RegExp('[?*]');

    /**
     * Extend EventEmitter
     */
    ee.call(this);

    /**
     * Extend channels prototype
     */
    ['encode', 'decode', 'refreshSubscriptions', '_listeners'].forEach(function(method){
        RedisChannel.prototype[method] = function(){
            return self[method].apply(self, arguments);
        }
    });

    /**
     * Listen to channel events
     */
    sub.on('message', function(channel, message){
        if(!self._channels[channel]) return; // Nobody cares

        try{
            ee.prototype.emit.apply(self._channels[channel], self.decode(message));
        }catch(err){
            console.warn(err);
            console.trace(err);
        }
    });

    sub.on('pmessage', function(pattern, channel, message){
        if(!self._channels[pattern]) return; // Nobody cares

        // Set the channel on a pattern subscription
        self._channels[pattern].channel = channel;

        try{
            ee.prototype.emit.apply(self._channels[pattern], self.decode(message));
        }catch(err){
            console.warn(err);
            console.trace(err);
        }
    });

};

/**
 * Inherit form EventEmitter
 */
util.inherits(RedisEventEmitter, ee);

/**
 * Return channel event emitter
 * @param {String} channel name
 * @return {Object} EventEmitter
 */
RedisEventEmitter.prototype.of = function(channel){
    // If array parse to string
    channel = (_.isArray(channel)) ? channel.join(this.delimiter) : channel;

    // Return Redis Channel Emitter
    if(this._channels[channel]){
        return this._channels[channel];
    }else{
        return this._channels[channel] = new RedisChannel(channel);
    }
};

/**
 * Subscribe to channel
 * @param channel
 */
RedisEventEmitter.prototype.subscribe = function(channel){
    // Check for subscription type
    if(this._pattern.test(channel)){
        sub.psubscribe(channel);
    }else{
        sub.subscribe(channel);
    }

    this._subscriptions[channel] = true;
};

/**
 * Unsubscribe to channel
 * @param channel
 */
RedisEventEmitter.prototype.unsubscribe = function(channel){
    // Check for subscription type
    if(this._pattern.test(channel)){
        sub.punsubscribe(channel);
    }else{
        sub.unsubscribe(channel);
    }

    delete this._channels[channel];
    delete this._subscriptions[channel];
};

/**
 * Refreshes subscriptions
 * @param evt
 */
RedisEventEmitter.prototype.refreshSubscriptions = function(channel){
    // Check if there is any listeners on channel
    if(this._channels[channel].listenersAny().length || this._channels[channel].listeners(['**']).length){
        if(!this._subscriptions[channel]){
            this.subscribe(channel);
        }
    }else{
       if(this._subscriptions[channel]){
            this.unsubscribe(channel);
       }
    }
};

/**
 * Checks if there are any listeners to the emitted channel
 * @type {*|void}
 * @private
 */
RedisEventEmitter.prototype._listeners = function(res, evt){
    console.log(this._channel, res, evt);
    // Channel has gone deaf
    if(res === 0){
        this.emit('deaf', this._channel, evt);
    }
};

/**
 * Encode remote communication
 * @type {encode}
 */
RedisEventEmitter.prototype.encode = (process.env.NODE_ENV == "production") ? msgpack.encode : JSON.stringify;

/**
 * Decode remote communication
 * @type {decode}
 */
RedisEventEmitter.prototype.decode = (process.env.NODE_ENV == "production") ? msgpack.decode : JSON.parse;

/**
 * Expose module
 */
module.exports = exports = new RedisEventEmitter;