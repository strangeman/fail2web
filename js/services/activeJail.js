'use strict';

module.exports = 'fail2web.activeJail';

var angular = require('angular'),
    _       = require('lodash');

angular.module(module.exports, [require('./globalConfig'),
                                require('./global')]).
  service('activeJail', ['$http', 'globalConfig', 'global', 'notifications', function($http, globalConfig, global, notifications) {
    var activeJail = {name: null,
                      currentView: '',
                      testfail_regex: {},
                      data: {} };
    return {
      set: function(name) {
        activeJail.name = name;
        this.refresh(false);
        this.setCurrentView('Overview');
      },
      setCurrentView: function(view) {
        if (['Overview', 'failedIPs', 'failRegexes'].indexOf(view) === -1) {
          throw view + ' is not a valid currentView';
        }
        if (view === 'failedIPs') {
          global.refreshBans();
        }
        activeJail.currentView = view;
      },
      get: function() {
        return activeJail;
      },
      refresh: function(alerts) {
        globalConfig.then(function(config) {
          $http({method: 'GET', url: config.fail2rest + 'jail/' + activeJail.name}).
            success(function(data) {
              if (alerts && activeJail.data.ip_list) {
                _.forEach(_.difference(activeJail.data.ip_list, data.ip_list), function(ip) {
                  notifications.add({message: ip + ' has been unbanned', type: 'warning'});
                });
                _.forEach(_.difference(data.ip_list, activeJail.data.ip_list), function(ip) {
                  notifications.add({message: ip + ' has been banned', type: 'warning'});
                });
              }
              activeJail.testfail_regex = {};
              activeJail.data = data;
          }.bind(this)).
            error(notifications.fromHTTPError);
        }.bind(this));
      },
      banIPAddress: function(ipAddress) {
        globalConfig.then(function(config) {
          $http({method: 'POST', data: {ip: ipAddress }, url: config.fail2rest + 'jail/' + activeJail.name + '/ban'}).
          success(function() {
            if (activeJail.data.ip_list.indexOf(ipAddress) === -1) {
                activeJail.data.ip_list.push(ipAddress);
                activeJail.data.currently_banned += 1;
                activeJail.data.total_banned  += 1;
            }
          }).
          error(notifications.fromHTTPError);
        });
      },
      unBanIPAddress: function(ipAddress) {
        globalConfig.then(function(config) {
          $http({ method: 'POST', data: {ip: ipAddress }, url: config.fail2rest + 'jail/' + activeJail.name + '/unban'}).
          success(function() {
            var index = activeJail.data.ip_list.indexOf(ipAddress);
            if (index !== -1) {
              activeJail.data.ip_list.splice(index, 1);
              activeJail.data.currently_banned -= 1;
            }
          }).
          error(notifications.fromHTTPError);
        });
      },
      deletefail_regex: function(regex) {
        globalConfig.then(function(config) {
          $http({method: 'DELETE', data: {fail_regex: regex}, url: config.fail2rest + 'jail/' + activeJail.name + '/failregex'}).
          success(function() {
            var index = activeJail.data.fail_regexes.indexOf(regex);
            if (index !== -1) {
              activeJail.data.fail_regexes.splice(index, 1);
            }
          }).
          error(notifications.fromHTTPError);
        });
      },
      addfail_regex: function(regex) {
        globalConfig.then(function(config) {
          $http({method: 'POST', data: {fail_regex: regex}, url: config.fail2rest + 'jail/' + activeJail.name + '/failregex'}).
          success(function() {
            activeJail.data.fail_regexes.push(regex);
          }).
          error(notifications.fromHTTPError);
        });
      },
      testfail_regex: function(failRegex) {
        globalConfig.then(function(config) {
          $http({method: 'POST', data: {fail_regex: failRegex}, url: config.fail2rest + 'jail/' + activeJail.name + '/testfailregex'}).
          success(function(data) {
            activeJail.testfail_regex = data;
          }).
          error(notifications.fromHTTPError);
        });
      }
    };
}]);
