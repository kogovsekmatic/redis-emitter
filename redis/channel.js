/**
 * Redis Channel Module
 * @author Matic Kogovšek [kogovsek.matic@gmail.com]
 */

/**
 * Module dependencies
 */
var ee = require('../../ee') // Event Emitter
    , util = require('util')
    , _ = require('underscore')
    , redis = require('../../redis')
    , pub = redis.getClient('eventemitter.pub');

/**
 * Redis Channel
 * @constructor
 */
function RedisChannel(channel){
    /**
     * Subscribed channel
     */
    this._channel = channel;

    /**
     * Emittet by channel
     */
    this.channel = channel;

    /**
     * Extend EventEmitter
     */
    ee.call(this);
};

/**
 * Inherit form EventEmitter
 */
util.inherits(RedisChannel, ee);

/**
 * Emit to channel
 * @param evt
 * @param cb
 */
RedisChannel.prototype.emit = function(event, a1, a2, a3, a4, a5){

    // Ignore newListener events
    if (event === 'newListener' && !this.newListener) {
        if (!this._events.newListener) { return false; }
    }

    var len = arguments.length;
    switch (len) {
        case 1:
            return pub.publish(this._channel, this.encode([event]));
            break;
        case 2:
            return pub.publish(this._channel, this.encode([event, a1]));
            break;
        case 3:
            return pub.publish(this._channel, this.encode([event, a1, a2]));
            break;
        case 4:
            return pub.publish(this._channel, this.encode([event, a1, a2, a3]));
            break;
        case 5:
            return pub.publish(this._channel, this.encode([event, a1, a2, a3, a4]));
            break;
        case 6:
            return pub.publish(this._channel, this.encode([event, a1, a2, a3, a4, a5]));
            break;
        default:
            for (i = 0, args = new Array(len); i < len; i++) {
                args[i] = arguments[i];
            }
            return pub.publish(this._channel, this.encode(args));
    }
};

/**
 * Wrap event array modifiers
 */
['off', 'removeListener', 'removeAllListeners', 'on', 'once', 'onAny', 'offAny'].forEach(function(method){
    RedisChannel.prototype[method] = function(){
        ee.prototype[method].apply(this, arguments);
        this.refreshSubscriptions(this._channel);
    }
});

/**
 * Expose module
 */
module.exports = exports = RedisChannel;