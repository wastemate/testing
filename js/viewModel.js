
var DateHelper = {

		getHolidays: function () {
			// from holidays.json
			var data = [{holiday:"Labor Day",date:"September 7, 2015"},{holiday:"Columbus Day",date:"October 12, 2015"},{holiday:"Veterans Day",date:"November 11, 2015"},{holiday:"Thanksgiving Day",date:"November 26, 2015"},{holiday:"Friday after Thanksgiving",date:"November 27, 2015"},{holiday:"Christmas Day",date:"December 25, 2015"},{holiday:"New Year's Day",date:"January 1, 2016"},{holiday:"Martin Luther King, Jr. Day",date:"January 18, 2016"},{holiday:"Presidents Day",date:"February 15, 2016"},{holiday:"Easter",date:"March 27, 2016"},{holiday:"Memorial Day",date:"May 30, 2016"},{holiday:"Independence Day",date:"July 4, 2016"},{holiday:"Labor Day",date:"September 5, 2016"},{holiday:"Columbus Day",date:"October 10, 2016"},{holiday:"Veterans Day",date:"November 11, 2016"},{holiday:"Thanksgiving Day",date:"November 24, 2016"},{holiday:"Friday after Thanksgiving",date:"November 25, 2016"},{holiday:"Christmas Day",date:"December 26, 2016"}];
			// parse data
			_.each( data, function( item ) {
					item.date = new Date( item.date );
			} );
			return data;
		},

		getHoliday: function( date ) {
			// return name of holiday if is one
			return _.find( DateHelper.getHolidays(), function( item ){
				return moment( date ).isSame( item.date, 'day' );
			} ) || false;
		},

		isWeekday: function( date ) {
			// moment library uses 1 ... 7 for Sun ... Sat
			var dayOfWeek = moment( date ).isoWeekday();
			return  !!( 1 <= dayOfWeek && dayOfWeek <= 5 ) ? moment( date ) : false;
		},

		isServiceDay: function( date ) {
			// moment library uses 1 ... 7 for Sun ... Sat
			// self.serviceDate: 0 ... 6 for Sun - Sat
			return !!( self.serviceDay == moment( date ).isoWeekday-1 ) ? moment( date ) : false;
		}
};


Date.prototype.toJSONLocal = function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toISOString().slice(0, 10);
};

function viewModel() {
	var self = this;

	self.showing = ko.observable("search");

	/* visibility controls */
	self.shouldShowSearch = ko.observable(false);
	self.shouldShowCategories = ko.observable(false);
	self.shouldChooseLob = ko.observable(false);
	self.shouldShowResidentialServices = ko.observable(false);
	self.shouldShowRollOffMaterials = ko.observable(false);
	self.shouldShowRollOffServices = ko.observable(false);
	self.shouldChooseStart = ko.observable(false);
	self.shouldShowDeliveryAndReview = ko.observable(false);
	self.shouldShowBillingInfo = ko.observable(false);
	self.shouldShowPaymentInfo = ko.observable(false);
	self.shouldShowConfirmation = ko.observable(false);
	self.shouldShowProcessNav = ko.observable(false);
	self.shouldShowProcessNavFooter = ko.observable(false);

	/* Recurring steps */
	self.isRecurringOrder = ko.observable(false);
	self.cartsChoosen = ko.observable(false);
	self.materialChoosen = ko.observable(false);
	self.startChoosen = ko.observable(false);
	self.addressConfirmed = ko.observable(false);
	self.paymentProcessed = ko.observable(false);

	self.requiresMaterial = ko.observable(false);

	self.address = ko.observable();
	self.categories = ko.observableArray();
	self.services = ko.observableArray();

	self.landfillServices = ko.observableArray();
	self.recyclingServices = ko.observableArray();
	self.organicsServices = ko.observableArray();
	self.rolloffServices = ko.observableArray();

	self.material = ko.observableArray();
	self.selectedMaterial = ko.observable();


	self.serviceDay = ko.observable();

	//service info
	self.serviceStartDate = ko.observable();
	self.serviceEndDate = ko.observable();
	self.serviceFirstName = ko.observable();
	self.serviceLastName = ko.observable();
	self.serviceEmail = ko.observable();
	self.servicePhone = ko.observable();

	self.serviceAddress = ko.observable();
	self.serviceCity = ko.observable();
	self.serviceStateShort = ko.observable();
	self.serviceZip = ko.observable();
	self.serviceAddressApt = ko.observable();

	self.serviceAddressAptPrint = ko.computed( function() {
		return self.serviceAddressApt() ? 'Apt/Suite ' + self.serviceAddressApt() : '';
	} );

	self.serviceAddressCityStateZip = ko.computed( function(){
		return self.serviceCity() + ', ' + self.serviceStateShort() + ' ' + self.serviceZip();
	} );

	self.serviceAddressFull = ko.computed( function() {
		return self.serviceAddress() +  ( self.serviceAddressApt() ? ' #' + self.serviceAddressApt() + ' ' : '' ) + ', ' + self.serviceCity() + ' ' + self.serviceStateShort() + ' ' + self.serviceZip();
	} );

	self.userLatLon = ko.observable();
	self.serviceMapUrl = ko.observable();

	//service cost
	self.recurringTotal = ko.observable();
	self.onetimeTotal = ko.observable();

	//billing info
	self.billingFirstName = ko.observable();
	self.billingLastName = ko.observable();
	self.billingEmail = ko.observable();
	self.billingPhone = ko.observable();

	self.billingAddress = ko.observable();
	self.billingCity = ko.observable();
	self.billingStateShort = ko.observable();
	self.billingZip = ko.observable();
	self.billingAddressApt = ko.observable();

	self.billingAddressAptPrint = ko.computed( function() {
		return self.billingAddressApt() ? 'Apt/Suite ' + self.billingAddressApt() : '';
	} );

	self.billingAddressCityStateZip = ko.computed( function(){
		return self.billingCity() + ', ' + self.billingStateShort() + ' ' + self.billingZip();
	} );

	self.billingAddressFull = ko.computed( function() {
		return self.billingAddress() +  ( self.billingAddressApt() ? self.billingAddressApt() + ' ' : '' ) + ', ' + self.billingCity() + ' ' + self.billingStateShort() + ' ' + self.billingZip();
	} );

	self.billingCard = ko.observable();
	self.billingCardExpiresMonth = ko.observable();
	self.billingCardExpiresYear = ko.observable();
	self.billingCardSecurity = ko.observable();

	self.validBillingCard = ko.observable();
	self.validBillingCardExpiration = ko.observable()
	self.validBillingCardSecurity = ko.observable();


	self.wantsAutopay = ko.observable( true );
	self.wantsPaperless = ko.observable( true );

	//new account info
	self.accountNumber = ko.observable('');


	self._billingIsSame = ko.observable( false );

	self.makeBillingSame = function() {
		self.billingAddress(self.serviceAddress());
		self.billingAddressApt(self.serviceAddressApt());
		self.billingZip(self.serviceZip());
		self.billingCity(self.serviceCity());
		self.billingStateShort(self.serviceStateShort());
		self.billingPhone(self.servicePhone());
	};

	self.toggleBillingSame = function() {


		self._billingIsSame( !self._billingIsSame() );
		console.log( 'billingIsSame', self._billingIsSame() );

		if ( self._billingIsSame() ) {
			self.makeBillingSame();
		} else {
			self.billingAddress('');
			self.billingAddressApt('');
			self.billingZip('');
			self.billingCity('');
			self.billingStateShort('');
			self.billingPhone('');
		}

	};

	self.ccExpireYearOptions = ko.computed(function(){
		var years = [];

		var d = new Date();
		for(var i = 0; i < 10; i++){
			d.setFullYear(d.getFullYear() + i);
			years.push({
				value: d.toJSON().substring(0,4)
			});
		}

		return years;
	});


	self.avaiableDeliveryDates = ko.computed(function(){

		// criteria: M-F & is not a holiday & is same day as service day

		if ( !_.isNumber( self.serviceDay() ) ) {
			return;
		}

		var getNextServiceDate = function( weeksOffset ) {

			// 0 is next soonest service date, 1 is a week after that...
			// assumed to be a weekday

			var serviceDayOfWeek = self.serviceDay();
			var daysOffset = weeksOffset * 7;
			var d = moment().day( 0 ).add( daysOffset + 7 + serviceDayOfWeek , 'days' ).toDate();

			var weekDate = {
				date: d,
				isoString: d.toJSONLocal()
			};

			return weekDate;
		};

		var numItemsReturned = 50;
		var deliveryDays = [];

		var buildArray = function() {

			var weekDate = getNextServiceDate( deliveryDays.length );

			// filter out holidays
			h = DateHelper.getHoliday( weekDate.date );
			if ( h ) {
				weekDate = null
			}

			deliveryDays.push( weekDate );

			( deliveryDays.length < numItemsReturned ) ? buildArray() : console.log( 'built list' );

		};

		buildArray();

		// remove nulls
		deliveryDays = _.compact( deliveryDays );

		console.log( deliveryDays );

		// {
		// 	date: Date(),
		// 	isoString: '2015-08-03'
		// }

		return deliveryDays;
	});

	self.selectedServices = ko.computed(function(){
		var services = [];
		var landfill = ko.utils.arrayFirst(self.landfillServices(), function(item) {
            return item.selected == true;
        });

		if(landfill){
			services.push(landfill);
		}

		var recycling = ko.utils.arrayFirst(self.recyclingServices(), function(item) {
            return item.selected == true;
        });

		if(recycling){
			services.push(recycling);
		}

		var organics = ko.utils.arrayFirst(self.organicsServices(), function(item) {
            return item.selected == true;
        });

		if(organics){
			services.push(organics);
		}

		var rolloff = ko.utils.arrayFirst(self.rolloffServices(), function(item) {
            return item.selected == true;
        });

		if(rolloff){
			services.push(rolloff);
		}

		return services;
	});

	self.humanDeliveryDay = ko.computed(function(){
		var dow = "";
		var day = self.serviceDay();

		if (Number(day) === day){
			switch(day){
				case 0:
					dow = "Sunday";
					break;
				case 1:
					dow = "Monday";
					break;
				case 2:
					dow = "Tuesday";
					break;
				case 3:
					dow = "Wednesday";
					break;
				case 4:
					dow = "Thursday";
					break;
				case 5:
					dow = "Friday";
					break;
				case 6:
					dow = "Saturday";
					break;
				default:
					dow = "";
			}
		}

		return dow;
	});

	self.selectedServicePrice = ko.computed(function(){
		var price = 0;
		var landfill = ko.utils.arrayFirst(self.landfillServices(), function(item) {
            return item.selected == true;
        });
		var recycling = ko.utils.arrayFirst(self.recyclingServices(), function(item) {
            return item.selected == true;
        });
		var organics = ko.utils.arrayFirst(self.organicsServices(), function(item) {
            return item.selected == true;
        });
		var rolloffs = ko.utils.arrayFirst(self.rolloffServices(), function(item) {
            return item.selected == true;
        });

		if(landfill){
			price += landfill.price;
		}
		if(recycling){
			price += recycling.price;
		}
		if(organics){
			price += organics.price;
		}
		if(rolloffs){
			price += rolloffs.price;
		}

		return price;
	});

	self.orderTotal = ko.computed(function(){
		var price = self.selectedServicePrice();
		if(!self.wantsAutopay()){
			price = price * 2;
		}
		return "$" + price;
	});

	self.recurringTotal = ko.computed(function(){
		return "$" + self.selectedServicePrice();
	});

	self.serviceMapUrl = ko.computed(function(){

		// generates img src for map image

		if ( !self.userLatLon() ) {
			return;
		}

		_.templateSettings.interpolate = /{{ ([\s \S]+?)}}/g;
		var compiled = _.template( 'http://api.tiles.mapbox.com/v4/{{ mapid }}/{{ pin }}-{{ label }}+{{ color }}({{ lon }},{{ lat }})/{{ lon }},{{ lat }},{{ z }}/{{ width }}x{{ height }}.{{ format }}?access_token={{ token }}' );
		return compiled({
			pin: 'pin-s',
			label: 'marker',
			color: '482',
			mapid: 'mapbox.streets',
			lon: self.userLatLon().lon,
			lat: self.userLatLon().lat,
			z: 17,
			width: 150,
			height: 150,
			format: 'jpg',
			token: 'pk.eyJ1IjoiamVkZGF3c29uIiwiYSI6ImMxYjczZWRkNzFkNWU3YzhmMTAyNzdjMjBlYThiODk2In0.HsgA69IWdvwYJyaCT7TUUg'
		});

	});

	self.loadCategory = function(data, event){
		console.log("Clicked");
		console.log(data);

		if ( data.requiresMaterial ) {
			self.requiresMaterial(true);
		}

		wastemate.getServices(data.line).then(function(services){

			//clear out all services currently in the view model arrays
			self.services([]);
			self.landfillServices([]);
			self.recyclingServices([]);
			self.organicsServices([]);
			self.rolloffServices([]);

			$.each(services, function(index, service){
				//all the services
				self.services.push(service);

				if(service.type.name == "Landfill"){
				  self.landfillServices.push(service);
				}

				if(service.type.name == "Recycling"){
				  self.recyclingServices.push(service);
				}

				if(service.type.name == "Organics"){
				  self.organicsServices.push(service);
				}

				if(service.type.name == "RollOff"){
				  self.rolloffServices.push(service);
				}

			});
			//sort the arrays!
			self.landfillServices.sort(function(left, right) { return left.name == right.name ? 0  : (left.name < right.name ? -1 : 1); });
			self.recyclingServices.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1); });
			self.organicsServices.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1); });
			self.rolloffServices.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1); });

			if ( self.rolloffServices().length ) {
				self.show("rolloff");
			} else {
				self.show("residential");
			}

		}, function(err){
			if(err){
				//most likely we need the users address before they continue.
				alert("Address required before choosing service category");
			}
		})

	};

	self.showCategories = function(data, event){
		self.show("categories");
	};

	self.loadServices = function(data, event){
		console.log("Address submitted");
		//wastemate.getServices();
	};

	self.selectMaterial = function( data, event ) {

		hasMatch = ko.utils.arrayFirst(self.material(), function(item) {
	    return item == data;
    });

		if (hasMatch) {

			self.materialChoosen( true );

			ko.utils.arrayForEach(self.material(), function(item) {
				item.selected = item == data;
				if ( item.selected ) {
					self.selectedMaterial( item );
				}
				item.summary = " material";
			});

		}

		self.material.refresh();

	};

	self.selectProductService = function(data, event){

		var hasMatch = ko.utils.arrayFirst(self.landfillServices(), function(item) {
            return item == data;
        });
		if(hasMatch){
			ko.utils.arrayForEach(self.landfillServices(), function(item) {
				item.selected = item == data;
				item.summary = " landfill cart";
			});
			self.landfillServices.refresh();
		}

		hasMatch = ko.utils.arrayFirst(self.recyclingServices(), function(item) {
            return item == data;
        });
		if(hasMatch){
			ko.utils.arrayForEach(self.recyclingServices(), function(item) {
				item.selected = item == data;
				item.summary = " recycling cart";
			});
			self.recyclingServices.refresh();
		}

		hasMatch = ko.utils.arrayFirst(self.organicsServices(), function(item) {
            return item == data;
        });
		if (hasMatch) {
			ko.utils.arrayForEach(self.organicsServices(), function(item) {
				item.selected = item == data;
				item.summary = " organics cart";
			});
			self.organicsServices.refresh();
		}

		hasMatch = ko.utils.arrayFirst(self.rolloffServices(), function(item) {
            return item == data;
        });
		if (hasMatch) {

			// reset material
			_.each( self.material(), function( m ) {
				m.selected = false;
			} );

			// reset date

			self.materialChoosen( false );

			ko.utils.arrayForEach(self.rolloffServices(), function(item) {
				item.selected = item == data;
				if ( item.selected ) {
					self.material( item.material );
				}
				item.summary = " bin";
			});

			self.rolloffServices.refresh();
		}


	};

	self.next = function(data, event) {
		switch(self.showing()){
			case "residential":
				//store selection in a pending order
				//save order should really return a promise... but this is a demo!
				self.saveOrder(event, function( err ) {

					if ( err ) {
						self.saveOrderInFlight = false;
						if ( _.isArray( err ) && err.length > 0 ) {
							// is array of errors
							// build error message string
							var msg = (function(){
								var tmp = '';
								_.each( err, function( item, index ) {
									var prefix = ( err.length > 2 && index > 0 ) ? ', ' : '';
											prefix = ( err.length > 1 && index == err.length-1 ) ? ' and ' : prefix;
									tmp += ( prefix + item );
								} );
								return tmp;
							} )();
							alert( 'Oops. Please select ' + msg + '.' );
						} else {
							// is API err
							alert( 'Oops: ' + err.toString() );
						}
						return;
					}

					var availableDates = [];
					_.each( self.avaiableDeliveryDates(), function( item ) {
						availableDates.push( moment( item.date ).toDate() );
					} );

					var invalidDates = [];
					_.times( 365, function( n ){
						var date = moment().add( n, 'days' );

						// if current day is NOT an available delivery date, add it
						var isBadDay = true;
						_.each( availableDates, function( goodDay ){
							if ( moment( date ).isSame( goodDay, 'day' ) ) {
								isBadDay = false;
							}
						} );

						if ( isBadDay ) {
							invalidDates.push( date.toDate() );
						}

					} );

        	$('#first-pickup-date-text').html( moment( self.serviceStartDate() || availableDates[0] ).format('L') );
        	$('#wma-rolloff-dropoff-text').html( moment( self.serviceStartDate() || availableDates[0] ).format('L') );
        	$('#wma-rolloff-pickup-text').html( moment( self.serviceStartDate() || availableDates[0] ).format('L') );

        	self.serviceStartDate( moment( self.serviceStartDate() || availableDates[0] ).toDate() );
        	self.serviceEndDate( moment( self.serviceStartDate() || availableDates[0] ).toDate() );

          var dp = $('#first-pickup-datepicker').datetimepicker({
              icons: {
                  date: "fa fa-calendar",
                  up: "fa fa-arrow-up",
                  down: "fa fa-arrow-down"
              },
          		format: 					'MM/dd/YY',
          		minDate: 					moment(),
              inline: 					true,
					    disabledDates: 		invalidDates,
              sideBySide: 			false,
              defaultDate: 			self.serviceStartDate() || availableDates[0]
          });

          dp.on( 'dp.change', function( e ){
          	var d = e.date;
          	self.serviceStartDate( d.toDate() );
          	$('#first-pickup-date-text').html( d.format('L') );
          	console.log( 'changed', d );
          } );

					self.cartsChoosen(true);
					self.show("chooseStart");

				});


			break;
			case "rolloff":

				var x = self.rolloffServices();
				var y = self.services();
				var z = self.material();

				_.each( self.services(), function( s ) {

					_.each( s.material, function( m ) {
						m.icon = 'http://placehold.it/100x100';
					} );

					if ( s.selected ) {
						self.cartsChoosen(true);
					}

				} );

				if ( !self.cartsChoosen() ) {
					alert( 'Please select a bin.' );
					return;
				}

				self.show("materials");


			break;
			case "materials":

				if ( !self.materialChoosen() ) {
					alert( 'Please choose a material.' );
					return;
				}

				self.saveOrder( event, function( err ) {

					if ( err ) {
						console.log( 'Could not save order.' )
						return;
					}

					self.show("deliveryAndReview");

				} );


			break;
			case "categries":
				//No next button here!! User must choose a category (Lob) to continue
			break;
			case "chooseStart":

				var when;

				try {
					when = new Date(self.serviceStartDate()).toISOString();
				} catch( e ) {
					alert( 'Please select a start date.' );
					return;
				}

				wastemate.setRecurringStartDate(when).then(function(){
					self.startChoosen(true);
					self.show("siteInfo");

			    setupMiniMap( self.userLatLon().lat, self.userLatLon().lon );


				}, function(err){
					alert("Ooops something failed :(");
					console.log(err);
				});

			break;
			case "siteInfo":

				var siteInfo = {
					firstName: self.serviceFirstName() || '',
	        lastName: self.serviceLastName() || '',
	        email: self.serviceEmail() || '',
	        phone: self.servicePhone() || '',
	        address: self.serviceAddressFull() || '',
	        street: self.serviceAddress() || '',
	        city: self.serviceCity() || '',
	        state: self.serviceStateShort() || '',
	        suite: self.serviceAddressApt() || '',
	        zip: self.serviceZip() || ''
				};

				if ( siteInfo.firstName == '' ) {
					alert( 'Oops. Missing your first name.' );
					return;
				} else if ( siteInfo.lastName == '' ) {
					alert( 'Oops. Missing your last name.' );
					return;
				} else if ( siteInfo.email == '' ) {
					alert( 'Oops. Missing your email.' );
					return;
				} else if ( siteInfo.street == '' ) {
					alert( 'Oops. Missing your street address.' );
					return;
				} else if ( siteInfo.city == '' ) {
					alert( 'Oops. Missing your city.' );
					return;
				} else if ( siteInfo.state == '' ) {
					alert( 'Oops. Missing your address.' );
					return;
				} else if ( siteInfo.zip == '' ) {
					alert( 'Oops. Missing your zip.' );
					return;
				}


				// TODO: server side email validation is better

				var validateEmail = function(email) {
				    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
				    return re.test(email);
				}

				if ( !validateEmail( siteInfo.email ) ) {
					alert( "Oops. That email isn't valid" );
					return;
				}

				var lat = self.userLatLon().lat;
				var lon = self.userLatLon().lon;


				wastemate.updateAddressLocation( lat, lon ).then( function() {

					wastemate.saveServiceInformation(siteInfo).then(
						function() {
							self.addressConfirmed(true);
							self.show("payment");
						}, function (err) {
							console.log(err);
							alert("Oops, something went wrong.");
						}
					);

				}, function( err ) {
					console.log(err);
					alert("Oops, something went wrong.");
				} );


			break;
			case "payment":

				if(self.saveOrderInFlight){
					return;
				}

		    if ( !self.validBillingCard() ) {
		    	alert( 'Ooops. Please enter a valid card number.' );
		    	return;
		    } else if ( !self.validBillingCardExpiration() ) {
		    	alert( 'Ooops. Please enter a valid expiration date.' )
		    	return;
		    } else if ( !self.validBillingCardSecurity() ) {
		    	alert( 'Ooops. Please enter a valid security code' );
		    	return;
		    } else if ( !self.billingFirstName() || self.billingFirstName() == '' ) {
		    	alert( 'Oops. Missing first name.' );
		    	return;
		    } else if ( !self.billingLastName() || self.billingLastName() == '' ) {
		    	alert( 'Ooops. Missing last name.' );
		    	return;
		    } else if ( !self.billingAddress() || self.billingAddress() == '' ) {
		    	alert( 'Ooops. Missing billing address.' )
		    	return;
		    } else if ( !self.billingStateShort || self.billingStateShort() == '' ) {
		    	alert( 'Ooops, Missing billing state.' );
		    	return;
		    } else if ( !self.billingCity || self.billingCity() == '' ) {
		    	alert( 'Ooops, Missing billing city.' );
		    	return;
		    } else if ( !self.billingZip() || self.billingZip() == '' ) {
		    	alert( 'Ooops. Missing ZIP.' );
		    	return;
		    }

				self.saveOrderInFlight = true;

				//Step 1 - Tokenize the card info
				var cardInfo = {
		          cardNumber: self.billingCard().replace(/\s/g,''),
						  ccExpiresMonth: Number(self.billingCardExpiresMonth()),
		          ccExpiresYear: Number(self.billingCardExpiresYear()),
		          securityCode: self.billingCardSecurity(),
		          fullName: self.billingFirstName() + ' ' + self.billingLastName(),
		          address: self.billingAddress(),
		          zipCode: self.billingZip()
		        };

				wastemate.tokenizeCard(cardInfo).then(
					function(cardToken) {


							wastemate._private.order.cardToken = cardToken;

							//Step 2 - Persist billing info via fire and forget
							wastemate._private.order.save();

							//TODO: store the billing information!
							/*wastemate.saveBillingSelection({
								name: self.billingFirstName() + '' + self.billingLastName()
							}).then(function(){

							}, function(err){

							});*/

							//Step 3 - Process the order!
							wastemate.processNewOrder().then(
								function(account){
									self.saveOrderInFlight = false;
									console.log(account);
									self.paymentProcessed(true);
									self.accountNumber(account.C_ID);
				    				self.show("confirmation");

								}, function(err){
									self.saveOrderInFlight = false;
									console.log(err);
									if(err){
										alert( "Oops. There was a problem processing your order." );
									}
								}
							);


					}, function(err){
						self.saveOrderInFlight = false;
						console.log(err);
						if(err){
							alert("Credit Card information did not validate")
						}
					}
				);
			break;
		}
	};

	self.saveOrderInFlight = false;
	self.saveOrder = function (event, next){


		//prevent double clicks!
		if(self.saveOrderInFlight){
			return;
		} else {
			self.saveOrderInFlight = true;
		}

		var landfillService = ko.utils.arrayFirst(self.landfillServices(), function(item) {
            return item.selected == true;
        });

		var recycleService = ko.utils.arrayFirst(self.recyclingServices(), function(item) {
            return item.selected == true;
        });

		var organicsService = ko.utils.arrayFirst(self.organicsServices(), function(item) {
            return item.selected == true;
        });

		var rolloffService = ko.utils.arrayFirst(self.rolloffServices(), function(item) {
            return item.selected == true;
        });


		var err = [];

		if( self.landfillServices().length && !landfillService ){
			err.push("a landfill cart");
		}

		if( self.recyclingServices().length && !recycleService ){
			err.push("a recycling cart");
		}

		if( self.organicsServices().length && !organicsService ){
			err.push("an organics cart");
		}

		if( self.rolloffServices().length && !rolloffService ){
			err.push("a rolloff bin");
		}

		if ( err.length > 0 ) {
			next( err );
			return;
		}

		var serviceChoices = [];
		serviceChoices.push(landfillService);
		serviceChoices.push(recycleService);
		serviceChoices.push(organicsService);
		serviceChoices.push(rolloffService);

		console.log( serviceChoices, self.selectedMaterial() );

		wastemate.saveServiceSelection( serviceChoices, [ self.selectedMaterial() ] ).then(function(){

			console.log("saved service selection");
			self.saveOrderInFlight = false;
			next();

		}, function(err){

			console.log("something went wrong");
			console.log(err);
			self.saveOrderInFlight = false;
			next( err );

		});

	};

	self.show = function(view){

		window.invalidateAllInputs();

		if ( self._billingIsSame() ) {
			self.makeBillingSame();
		}

		var hideAll = function() {
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowProcessNav(false);
				self.shouldShowProcessNavFooter(false);
				self.shouldChooseStart(false);
		};

		switch(view){
			case "loading":
				hideAll();
				self.showing("loading");
			break;
			case "search":
				hideAll();
				self.shouldShowSearch(true);
				self.showing("search");
				break;
			case "categries":
				hideAll();
				self.shouldShowCategories(true);
				self.showing("categries");
				break;
			case "residential":
				hideAll();
				self.shouldShowResidentialServices(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("residential");
				break;
			case "chooseStart":
				hideAll();
				self.shouldChooseStart(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("chooseStart");
			break;
			case "deliveryAndReview":
				hideAll();
				self.shouldShowDeliveryAndReview(true);
				self.shouldShowProcessNav(true);
				self.showing("deliveryAndReview");
				break;
			case "materials":
				hideAll();
				self.shouldShowRollOffMaterials(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("materials");
				break;
			case "rolloff":
				hideAll();
				self.shouldShowRollOffServices(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("rolloff");
				break;
			case "siteInfo":
				hideAll();
				self.shouldShowBillingInfo(true);
				self.shouldShowProcessNav(true);
				self.showing("siteInfo");
				break;
			case "payment":
				hideAll();
				self.shouldShowPaymentInfo(true);
				self.shouldShowProcessNav(true);
				self.showing("payment");
				break;
			case "confirmation":
				hideAll();
				self.shouldShowConfirmation(true);
				self.shouldShowProcessNav(true);
				self.showing("confirmation");
				break;
			default:
				hideAll();
				self.showing("");
		}
	};
};

ko.observableArray.fn.refresh = function () {
    var data = this();
    this([]);
    this(data);
};

ko.extenders.required = function(target, errorMessage){
	//add some sub-observables to our observable
    target.hasError = ko.observable();
    target.validationMessage = ko.observable();

    //define a function to do validation
    function validate(newValue) {
       target.hasError(newValue ? false : true);
       target.validationMessage(newValue ? "" : errorMessage || "This field is required");
    }

    //initial validation
    validate(target());

    //validate whenever the value changes
    target.subscribe(validate);

    //return the original observable
    return target;
};

ko.bindingHandlers.backgroundImage = {
  update: function(element, valueAccessor) {
    ko.bindingHandlers.style.update(element,
      function(){return {backgroundImage: "url('" + valueAccessor() + "')"}});
  }
};

// --------------------------------------
// --------------------------------------


// validate cc num
$('#wma-cst-crdnbr').payment( 'formatCardNumber' );


$('#wma-cst-crdnbr').on('keyup', function() {

	wma_viewModel.validBillingCard( false )

	var num = $( this ).val().replace(/\s/g, '');

	var isValid = $.payment.validateCardNumber( num );

	if ( num.length == 16 && !isValid ) {
		// done but invalid
		$( this ).css( 'border', '2px solid #FFCCCC' );

	} else if ( num.length == 16 && isValid ) {
		// done and valid
		wma_viewModel.validBillingCard( true );
		$( this ).css( 'border', '2px solid #007700' )
		$( '#wma-cst-expmm' ).focus();

	} else {
		$( this ).css( 'border', '' );
	}

	var cardType = $.payment.cardType( num );

	$( '[id^=wma-cc-]' ).css( 'opacity', 0.3 ).addClass( 'greyscale' );

	if ( cardType == 'visa' || cardType == 'amex' || cardType == 'discover' || cardType == 'mastercard') {
		$( '#wma-cc-' + cardType  ).css( 'opacity', 1 ).removeClass( 'greyscale' );
	}

	if ( !num.length ) {
		$( '[id^=wma-cc-]' ).css( 'opacity', 1 ).removeClass( 'greyscale' );
	}

});


// validate cvc num

$('#wma-cst-cvv').payment( 'formatCardCVC' );

$('#wma-cst-cvv').on('keyup', function() {

	wma_viewModel.validBillingCardSecurity( false );

	var num = $( this ).val();

	var isValid = $.payment.validateCardCVC( num );

	if ( num .length >= 3 && !isValid ) {
		// done but invalid
		$( this ).css( 'border', '2px solid #FFCCCC' );

	} else if ( num.length >= 3 && isValid ) {
		// done and valid
		wma_viewModel.validBillingCardSecurity( true );
		$( this ).css( 'border', '2px solid #007700' )

	} else {
		$( this ).css( 'background-color', '' );

 }

});

(function(){

	var onExpirationDateChange = function( isValid ){

		wma_viewModel.validBillingCardExpiration( false );

		if ( isValid ) {

			wma_viewModel.validBillingCardExpiration( true );

			$( '#wma-cst-expmm' ).css( 'border', '2px solid #007700' );
			$( '#wma-cst-expyy' ).css( 'border', '2px solid #007700' );

		} else {

			if ( $( '#wma-cst-expmm' ).val() == -1 || $( '#wma-cst-expyy' ).val() == -1 ) {
				// one of them is blank
				$( '#wma-cst-expmm' ).css( 'border', '' );
				$( '#wma-cst-expyy' ).css( 'border', '' );
			} else {

				$( '#wma-cst-expmm' ).css( 'border', '2px solid #FFCCCC' );
				$( '#wma-cst-expyy' ).css( 'border', '2px solid #FFCCCC' );

			}
		}
	};

	$( '#wma-cst-expmm' ).on( 'change', function(){

		var m = $( this ).val();
		var y = $( '#wma-cst-expyy' ).val()

		var valid = $.payment.validateCardExpiry( m, y )
		onExpirationDateChange( valid );

	} );

	$( '#wma-cst-expyy' ).on( 'change', function(){

		var m = $( '#wma-cst-expmm' ).val()
		var y = $( this ).val();

		var valid = $.payment.validateCardExpiry( m, y )
		onExpirationDateChange( valid );

	} );

})();

$( '#wma-cst-phn' ).inputmask("mask", {"mask": "(999) 999-9999"});
$( '#wma-cst-billingphn' ).inputmask("mask", {"mask": "(999) 999-9999"});

$( '#wma-cst-billsameaddr' ).on( 'change', function() {
	wma_viewModel.toggleBillingSame();
	window.invalidateAllInputs();
} );

$( '.wma-billing-input' ).on( 'keyup', function() {
	wma_viewModel._billingIsSame( false );
	$( '#wma-cst-billsameaddr' ).removeAttr( 'checked' );
} );


$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})
