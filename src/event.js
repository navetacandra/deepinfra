class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName='', listener=(data)=>{}) {
    if(!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  emit(eventName='', data=undefined) {
    if(!!this.events[eventName]) {
      this.events[eventName].forEach(listener => {
        listener(data);
      });
    }
  }
}

exports.EventEmitter = EventEmitter;
