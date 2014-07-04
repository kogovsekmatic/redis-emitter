redis-emitter
=============

nodejs redis eventemitter

    // Listen to personal masters channel
    ree.of('workforce:workers:' + this._workforceId).onAny(function(){
        arguments = Array.prototype.slice.call(arguments);
        arguments.unshift(['channel', this.channel].concat(this.event));
        ee.prototype.emit.apply(workforce, arguments);
    });
    
    ree.of(['eventstream', stream, workforce.workers[this.roundIndex++ % this.roundLength]]).send(event);
    
    ree.of('workforce:balancer').emit(['master', 'died'], self._workforceId);
