'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var redux = require('redux');
var invariant = _interopDefault(require('invariant'));
var isPlainObject = _interopDefault(require('lodash/isPlainObject'));
var isFunction = _interopDefault(require('lodash/isFunction'));
var isObject = _interopDefault(require('lodash/isObject'));
var isString = _interopDefault(require('lodash/isString'));
var map = _interopDefault(require('lodash/map'));

function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  /* $$hashKey is added by angular when using ng-repeat, we ignore that*/
  var keysA = Object.keys(objA).filter(function (k) {
    return k !== '$$hashKey';
  });
  var keysB = Object.keys(objB).filter(function (k) {
    return k !== '$$hashKey';
  });

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  var hasOwn = Object.prototype.hasOwnProperty;
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}

function wrapActionCreators(actionCreators) {
  return function (dispatch) {
    return redux.bindActionCreators(actionCreators, dispatch);
  };
}

var assign$1 = Object.assign;
var defaultMapStateToTarget = function defaultMapStateToTarget() {
  return {};
};
var defaultMapDispatchToTarget = function defaultMapDispatchToTarget(dispatch) {
  return { dispatch: dispatch };
};

function Connector(store) {
  return function (mapStateToTarget, mapDispatchToTarget) {

    var finalMapStateToTarget = mapStateToTarget || defaultMapStateToTarget;

    var finalMapDispatchToTarget = isPlainObject(mapDispatchToTarget) ? wrapActionCreators(mapDispatchToTarget) : mapDispatchToTarget || defaultMapDispatchToTarget;

    invariant(isFunction(finalMapStateToTarget), 'mapStateToTarget must be a Function. Instead received %s.', finalMapStateToTarget);

    invariant(isPlainObject(finalMapDispatchToTarget) || isFunction(finalMapDispatchToTarget), 'mapDispatchToTarget must be a plain Object or a Function. Instead received %s.', finalMapDispatchToTarget);

    var slice = getStateSlice(store.getState(), finalMapStateToTarget, false);
    var isFactory = isFunction(slice);

    if (isFactory) {
      finalMapStateToTarget = slice;
      slice = getStateSlice(store.getState(), finalMapStateToTarget);
    }

    var boundActionCreators = finalMapDispatchToTarget(store.dispatch);

    return function (target) {

      invariant(isFunction(target) || isObject(target), 'The target parameter passed to connect must be a Function or a object.');

      //Initial update
      updateTarget(target, slice, boundActionCreators);

      var unsubscribe = store.subscribe(function () {
        var nextSlice = getStateSlice(store.getState(), finalMapStateToTarget);
        if (!shallowEqual(slice, nextSlice)) {
          slice = nextSlice;
          updateTarget(target, slice, boundActionCreators);
        }
      });
      return unsubscribe;
    };
  };
}

function updateTarget(target, StateSlice, dispatch) {
  if (isFunction(target)) {
    target(StateSlice, dispatch);
  } else {
    assign$1(target, StateSlice, dispatch);
  }
}

function getStateSlice(state, mapStateToScope) {
  var shouldReturnObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var slice = mapStateToScope(state);

  if (shouldReturnObject) {
    invariant(isPlainObject(slice), '`mapStateToScope` must return an object. Instead received %s.', slice);
  } else {
    invariant(isPlainObject(slice) || isFunction(slice), '`mapStateToScope` must return an object or a function. Instead received %s.', slice);
  }

  return slice;
}

function digestMiddleware($rootScope) {
    return function (store) {
        return function (next) {
            return function (action) {
                var res = next(action);
                $rootScope.$evalAsync(res);
                return res;
            };
        };
    };
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var isArray = Array.isArray;
var assign = Object.assign;

function ngReduxProvider() {
  var _reducer = undefined;
  var _middlewares = undefined;
  var _storeEnhancers = undefined;
  var _initialState = undefined;
  var _reducerIsObject = undefined;

  this.createStoreWith = function (reducer, middlewares, storeEnhancers, initialState) {
    invariant(isFunction(reducer) || isObject(reducer), 'The reducer parameter passed to createStoreWith must be a Function or an Object. Instead received %s.', typeof reducer === 'undefined' ? 'undefined' : _typeof(reducer));

    invariant(!storeEnhancers || isArray(storeEnhancers), 'The storeEnhancers parameter passed to createStoreWith must be an Array. Instead received %s.', typeof storeEnhancers === 'undefined' ? 'undefined' : _typeof(storeEnhancers));

    _reducer = reducer;
    _reducerIsObject = isObject(reducer);
    _storeEnhancers = storeEnhancers;
    _middlewares = middlewares || [];
    _initialState = initialState;
  };

  this.$get = function ($injector) {
    var resolveMiddleware = function resolveMiddleware(middleware) {
      return isString(middleware) ? $injector.get(middleware) : middleware;
    };

    var resolvedMiddleware = map(_middlewares, resolveMiddleware);

    var resolveStoreEnhancer = function resolveStoreEnhancer(storeEnhancer) {
      return isString(storeEnhancer) ? $injector.get(storeEnhancer) : storeEnhancer;
    };

    var resolvedStoreEnhancer = map(_storeEnhancers, resolveStoreEnhancer);

    if (_reducerIsObject) {
      var getReducerKey = function getReducerKey(key) {
        return isString(_reducer[key]) ? $injector.get(_reducer[key]) : _reducer[key];
      };

      var resolveReducerKey = function resolveReducerKey(result, key) {
        return assign({}, result, _defineProperty({}, key, getReducerKey(key)));
      };

      var reducersObj = Object.keys(_reducer).reduce(resolveReducerKey, {});

      _reducer = redux.combineReducers(reducersObj);
    }

    var finalCreateStore = resolvedStoreEnhancer ? redux.compose.apply(undefined, _toConsumableArray(resolvedStoreEnhancer))(redux.createStore) : redux.createStore;

    //digestMiddleware needs to be the last one.
    resolvedMiddleware.push(digestMiddleware($injector.get('$rootScope')));

    var store = _initialState ? redux.applyMiddleware.apply(undefined, _toConsumableArray(resolvedMiddleware))(finalCreateStore)(_reducer, _initialState) : redux.applyMiddleware.apply(undefined, _toConsumableArray(resolvedMiddleware))(finalCreateStore)(_reducer);

    return assign({}, store, { connect: Connector(store) });
  };

  this.$get.$inject = ['$injector'];
}

var index = angular.module('ngRedux', []).provider('$ngRedux', ngReduxProvider).name;

module.exports = index;
