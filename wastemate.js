/* WasteMate.js Library for interacting with the WasteMate backend
 * Created by and property of Edison Code, LLC.
 * License for use to active WasteMate.com subscribers.
 * Primary contact - Jed Dawson :: jed@edisoncode.com
 */
(function () {
  'use strict';
  var root = this;
  var previousModule = this.wastemate;
  //dependencies
  //TODO:: Promise & Parse!
  //Polyfill for Date.toISOString()
  if (!Date.prototype.toISOString) {
    (function () {
      function pad(number) {
        if (number < 10) {
          return '0' + number;
        }
        return number;
      }
      Date.prototype.toISOString = function () {
        return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
      };
    }());
  }
  var wastemate = {
    //Variables that are used internally by the app, primarily the api source and token for accessing organizational data
    _private: {
      host: 'https://manage.wastemate.com/api/',
      organizationToken: '',
      parseAppId: '',
      parseJsKey: ''
    },
    _config: {
      getLines: function () {
        return wastemate._private.host + 'lob/' + wastemate._private.organizationToken;
      },
      getServices: function (line, address) {
        return wastemate._private.host + 'services/' + wastemate._private.organizationToken + '/' + line + '?lat=' + address.lat + '&lon=' + address.lon;
      },
      updateLocation: function() {
        return wastemate._private.host + 'services/validate/' + wastemate._private.organizationToken;
      },
      getServiceDay: function (address) {
        return wastemate._private.host + 'services/dow/' + wastemate._private.organizationToken + '?lat=' + address.lat + '&lon=' + address.lon;
      },
      tokenizeCard: function (company) {
        return wastemate._private.host + 'creditCard/tokenize/' + wastemate._private.organizationToken + '/' + company;
      },
      processOrder: function () {
        return wastemate._private.host + 'order/' + wastemate._private.organizationToken;
      }
    },
    _cached: {
      cachFor: 10 * 60 * 1000,
      _lob: null,
      _lobWhen: 0,
      _services: null,
      _servicesWhen: 0,
      clear: function () {
        wastemate._cached._lob = null;
        wastemate._cached._lobWhen = 0;
        wastemate._cached._service = null;
        wastemate._cached._serviceWhen = 0;
      },
      lob: {
        get: function () {
          var now = Date.now();
          if (wastemate._cached._lob && now - wastemate._cached._lobWhen < wastemate._cached.cachFor) {
            return wastemate._cached._lob;
          } else {
            return null;
          }
        },
        set: function (lob) {
          wastemate._cached._lob = lob;
          wastemate._cached._lobWhen = Date.now();
          return lob;
        }
      },
      services: {
        get: function () {
          var now = Date.now();
          if (wastemate._cached._services && now - wastemate._cached._servicesWhen < wastemate._cached.cachFor) {
            return wastemate._cached._services;
          } else {
            return null;
          }
        },
        set: function (services) {
          wastemate._cached._services = services;
          wastemate._cached._servicesWhen = Date.now();
          return services;
        }
      }
    },
    /**
     * Set the new lat/lon for the account based on user overriding location on the map
     */
    updateAddressLocation: function(lat, lon){
      return new Promise(function(resolve, reject){

        var updateAddress = {
          oldLocation: {
            lat: wastemate._private.account.get('lat'),
            lon: wastemate._private.account.get('lon')
          },
          newLocation: {
            lat: lat,
            lon: lon
          }
        };

        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('POST', wastemate._config.updateLocation());
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 200) {

            var response = JSON.parse(req.responseText);

            if(!response.samePricing || !response.sameRouting){
              //new location results in changed prices and/or routes.
              reject(response);
            } else {
              wastemate._private.account.set('lat', lat);
              wastemate._private.account.set('lon', lon);
              wastemate._private.account.save();
              resolve(response);
            }
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error
            reject(new Error(req.errorMessage));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send(JSON.stringify(updateAddress));
      });
    },
    /**
     * Load the service categories (Residential, Commercial, Rolloff, etc.)
     */
    getServiceCategories: function () {
      return new Promise(function (resolve, reject) {
        var cache = wastemate._cached.lob.get();
        if (cache) {
          resolve(cache);
          return;
        }
        // Do the XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', wastemate._config.getLines());
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 200) {
            //store the response in cache
            // Resolve the promise with the lob object
            resolve(wastemate._cached.lob.set(JSON.parse(req.responseText)));
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error
            reject(new Error(req.statusText));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send();
      });
    },
    /**
     * Load the service options for the selected line of business & provide address
     */
    getServices: function (lob) {
      return new Promise(function (resolve, reject) {
        var cache = wastemate._cached.services.get();
        if (cache) {
          resolve(cache);
          return;
        }
        if (!wastemate._private.account) {
          reject(new Error('Account must be set before resolving services'));
          return;
        }
        var address = {
          lat: wastemate._private.account.get('lat'),
          lon: wastemate._private.account.get('lon')
        };
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', wastemate._config.getServices(lob, address));
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 200) {
            //Add the lob's encoded value to the url hash
            wastemate.URL.appendHash('line', btoa(lob));
            //store the response in cache
            // Resolve the promise with the services object
            resolve(wastemate._cached.services.set(JSON.parse(req.responseText)));
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error
            reject(new Error(req.statusText));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send();
      });
    },
    /**
     * Load the service day for recurring services
     */
    getServiceDayOfWeek: function () {
      return new Promise(function (resolve, reject) {
        if (!wastemate._private.account) {
          reject(new Error('Account must be set before resolving services'));
          return;
        }
        var address = {
          lat: wastemate._private.account.get('lat'),
          lon: wastemate._private.account.get('lon')
        };
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', wastemate._config.getServiceDay(address));
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 200) {
            // Resolve the promise with the services object
            resolve(JSON.parse(req.responseText));
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error
            reject(new Error(req.statusText));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send();
      });
    },
    /**
     * The call to WasteMate's credit card tokenizer service
     */
    tokenizeCard: function (cardInfo) {
      return new Promise(function (resolve, reject) {
        if (!wastemate._cached.services) {
          reject(new Error('Services need to be loaded before tokenization'));
          return;
        }
        //Ensure the request posts the expected wire model
        var cardWireModel = {
          cardNumber: cardInfo.cardNumber || '',
          ccExpiresMonth: cardInfo.ccExpiresMonth || 0,
          ccExpiresYear: cardInfo.ccExpiresYear || 0,
          securityCode: cardInfo.securityCode || '',
          fullName: cardInfo.fullName || '',
          address: cardInfo.address || '',
          city: cardInfo.city || '',
          state: cardInfo.state || '',
          zipCode: cardInfo.zipCode
        };
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('POST', wastemate._config.tokenizeCard(wastemate._cached._services[0].companyId));
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 200) {
            var response = JSON.parse(req.responseText);

            if(response.isError){
              reject(new Error(response.message));
              return;
            }

            // store the response in cache
            wastemate._private.cardToken = response.token;
            // Resolve the promise with the card token object
            resolve(response.token);  /* response object
              {
                creditCardToken: 'theToken', //safe to store in Parse :)
                lastFour: '4444'
              }
            */
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error (decline reason)
            // err.ExceptionMessage = "InvalidExpirationDate"
            reject(new Error(JSON.parse(req.responseText)));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send(JSON.stringify(cardWireModel));
      });
    },
    /**
     * Save the user's service selection
     */
    saveServiceSelection: function (services) {
      //create a new order for this customer @ Parse
      //the services array will have the services that the customer is requesting (multiple for resi - single for rolloff)
      var orderObj = {
        account: wastemate._private.account.id,
        //relationship to the account
        services: services,
        isOneTime: services.length > 1 ? false : true
      };
      return new Promise(function (resolve, reject) {
        var Order = Parse.Object.extend('Order');
        var order = new Order();
        order.save(orderObj).then(function (order) {
          //keep the order object around for persisting to billing software
          wastemate._private.order = order;
          //add the order id to the url hash
          wastemate.URL.appendHash('order', order.id);
          resolve(order);
        }, function (err) {
          //bubble up the error
          reject(err);
        });
      });
    },
    /**
     * Add service site information to Account
     */
    saveServiceInformation: function (serviceSite) {
      var siteinfo = {
        firstName: serviceSite.firstName || '',
        lastName: serviceSite.lastName || '',
        email: serviceSite.email || '',
        phone: serviceSite.phone || '',
        address: serviceSite.address || '',
        street: serviceSite.street || '',
        city: serviceSite.city || '',
        state: serviceSite.state || '',
        suite: serviceSite.suite || '',
        zip: serviceSite.zip || ''
      };
      return new Promise(function (resolve, reject) {
        var account = wastemate._private.account;
        account.set('serviceSite', siteinfo);
        account.save().then(function (account) {
          //update the local object to match what parse gave back to us;
          wastemate._private.account = account;
          resolve(account);
        }, function (err) {
          reject(err);
        });
      });
    },
    
    /**
     * Set the order start date
     */
    setRecurringStartDate: function (startWhen) {
      return new Promise(function (resolve, reject) {
        var order = wastemate._private.order;
        order.set('recurringStarts', startWhen);
        order.save().then(function (order) {
          wastemate._private.order = order;
          resolve(order);
        }, function (err) {
          reject(err);
        });
      });
    },
    /**
     * Set the on demand order delivery & removal dates
     */
    setOnDemandDates: function (deliverWhen, removeWhen) {
      return new Promise(function (resolve, reject) {
        var order = wastemate._private.order;
        order.set('deliverWhen', deliverWhen);
        order.set('removeWhen', removeWhen);
        order.save().then(function (order) {
          wastemate._private.order = order;
          resolve(order);
        }, function (err) {
          reject(err);
        });
      });
    },
    /**
     * Persiste the customer's billing info to a Parse object
     */
    saveBillingSelection: function (billing) {
      var billingObject = {
        account: wastemate._private.account.id,
        name: billing.name,
        street: billing.street,
        city: billing.city,
        state: billing.state,
        zip: billing.zip,
        phone: billing.phone
      };
      return new Promise(function (resolve, reject) {
        var BillingInfo = Parse.Object.extend('BillingInfo');
        var billingInfo = new BillingInfo();
        billingInfo.save(billingObject).then(function (object) {
          //keep the order object around for persisting to billing software
          wastemate._private.account.billingInfo = object;
          //TODO: resolve cyclical reference!
          resolve(object);
        }, function (err) {
          //bubble up the error
          reject(err);
        });
      });
    },
    /**
     * Finish the order
     */
    processNewOrder: function (account, order, card) {
      return new Promise(function (resolve, reject) {
        // Step 1: Trigger the RPC method @ WasteMate
        var orderObject = {
          account: account || wastemate._private.account || null,
          order: order || wastemate._private.order || null,
          card: card || wastemate._private.cardToken || null
        };
        if (!orderObject.account) {
          reject(new Error('Service and billing information (account) required before processing order.'));
          return;
        }
        if (!orderObject.order) {
          reject(new Error('Requested services (order) required before processing order.'));
          return;
        }
        if (!orderObject.card) {
          reject(new Error('Credit card token required before processing order.'));
          return;
        }
        var req = new XMLHttpRequest();
        req.open('POST', wastemate._config.processOrder());
        req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        req.onload = function () {
          // This is called even on 404 etc
          // so check the status
          if (req.status === 201 || req.status === 200) {
            var encoreAccount = JSON.parse(req.responseText);
            // store the response in cache
            wastemate._private.encoreAccount = encoreAccount;
            // Resolve the promise with the encoreAccount
            resolve(encoreAccount);  /* response object
              {
                accountNumber : '101010101',
                accountCreated : true
              }
            */
          } else {
            // Otherwise reject with the status text
            // which will hopefully be a meaningful error (decline reason)
            reject(new Error(req.statusText));
          }
        };
        // Handle network errors
        req.onerror = function () {
          reject(new Error('Network Error'));
        };
        // Make the request
        req.send(JSON.stringify(orderObject));
      });
    },
    /**
     * Establish a temporary account for this customer on Parse
     */
    createTempAccount: function (address) {
      var isMultiple = false;
      /*
      if (wastemate._private.account && !wastemate._private.account.street.equals(address.street)) {
        /* TODO/NOTE:
          * This person has already searched for another address.
          * Add a counter to track that they search for multiple addresses.
          * Eventually we need to come up with a way to prompt them from a valid phone number (confirm with twillio verification code process)
          * after they've searched for more than 5 addresses on the hauler's site (to prevent competitors from figuring out their pricing logic/teritories).
          * To do that completely, we'd need cookies or some other "browser fingerprint" type of method

        isMultiple = true;
      } else if (wastemate._private.account && wastemate._private.account.street.equals(address.street)) {
        return new Promise(function (resolve) {
          //When the address is already the same as what they've searched for in the past, kick that same object back out!
          resolve(wastemate._private.account);
        });
      }*/
      var addressObj = {
        primaryNumber: address.primaryNumber || 0,
        street: address.street || '',
        lat: address.lat || 0,
        lon: address.lon || 0,
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
        rdi: address.rdi || '',
        isTempAccount: true,
        isMultiSearcher: isMultiple
      };
      return new Promise(function (resolve, reject) {
        var Account = Parse.Object.extend('Account');
        var account = new Account();
        account.save(addressObj).then(function (object) {
          wastemate._private.account = object;
          //Stick this users's freshly minted account id in the URL hash.
          //TODO/goal: let them return refresh/return to the url in the future (with the hash) to pick up where they left off.
          wastemate.URL.setHash('account', object.id);
          resolve(object);
        }, function (err) {
          reject(err);
        });
      });
    },
    /**
     * The initialization method. Sets keys and pulls in the categories (thus verifying all is well).
     */
    initialize: function (applicationId, javascriptKey) {
      return new Promise(function (resolve, reject) {
        //Parse keys are necessary
        wastemate._private.parseAppId = applicationId;
        wastemate._private.parseJsKey = javascriptKey;
        // initialize Parse
        Parse.initialize(applicationId, javascriptKey);
        var wmaConfig = Parse.Object.extend('Config');
        var query = new Parse.Query(wmaConfig);
        query.first().then(function (config) {
          //Organization token is necessary for loading the correct hauler's data.
          wastemate._private.organizationToken = config.get('wasteMateOrg');
          //host is optional, default to hard coded host when not supplied;
          var host = config.get('wasteMateHost');
          wastemate._private.host = host || wastemate._private.host;
          //make sure the object cache is empty to start with
          wastemate._cached.clear();
          //load the service categories as part of the init process
          wastemate.getServiceCategories().then(function (serviceCategories) {
            resolve(serviceCategories);
          }, function (err) {
            reject(err);
          });
        }, function (err) {
          reject(err);
        });
      });
    }
  };
  wastemate.URL = {
    //grab the key's value from the url hash
    //example getHash('account') should return '1z3wsdf34' for a hash of '#account=1z3wsdf34'
    getHash: function (key, defaultValue) {
      var hash = window.location.hash;
      var val = hash.substring(hash.indexOf('=') + 1);
      if (val) {
        return val;
      } else {
        return defaultValue;
      }
    },
    setHash: function (key, value) {
      window.location.hash = key + '=' + value;
    },
    appendHash: function (key, value) {
      var currentHash = window.location.hash;
      if (currentHash && currentHash.length > 0) {
        window.location.hash += '&' + key + '=' + value;
      } else {
        wastemate.URL.setHash(key, value);
      }
    },
    getQuery: function (key, defaultValue) {
      var query = window.location.search;
      var val = query.substring(query.indexOf('=') + 1);
      if (val) {
        return val;
      } else {
        return defaultValue;
      }
    }
  };
  wastemate.noConflict = function () {
    root.wastemate = previousModule;
    return wastemate;
  };
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = wastemate;
    }
    exports.wastemate = wastemate;
  } else {
    root.wastemate = wastemate;
  }
}.call(this));
