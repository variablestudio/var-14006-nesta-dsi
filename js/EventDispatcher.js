var EventDispatcher = {
  extend: function(context) {
    var subscribers = {};

    var dispatcherInterface = {
      addEventListener: function(type, handler) {
        if (!subscribers[type]) {
          subscribers[type] = [];
        }
        return subscribers[type].push(handler);
      },
      removeEventListener: function(type, handler) {
        var idx;

        idx = subscribers[type].indeOf(handler);
        if (idx > -1) {
          return subscribers[type].splice(idx, 1);
        }
      },
      fire: function(type, arg) {
        if (subscribers[type]) {
          for(var i =0; i<subscribers[type].length; i++) {
            subscribers[type][i].call(this, arg);
          }
        }
      }
    };

    for (var methodName in dispatcherInterface) {
      context[methodName] = dispatcherInterface[methodName];
    }
    return context;
  }
};