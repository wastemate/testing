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
	self.startChoosen = ko.observable(false);
	self.addressConfirmed = ko.observable(false);
	self.paymentProcessed = ko.observable(false);
	
	self.address = ko.observable();
	self.categories = ko.observableArray();
	self.services = ko.observableArray();

	self.landfillServices = ko.observableArray();
	self.recyclingServices = ko.observableArray();
	self.organicsServices = ko.observableArray();
	
	self.serviceDay = ko.observable();
	
	//service info
	self.serviceStartDate = ko.observable();
	self.serviceFirstName = ko.observable();
	self.serviceLastName = ko.observable();
	self.serviceEmail = ko.observable();
	self.servicePhone = ko.observable();
	self.serviceAddress = ko.observable();
	self.serviceCityStateZip = ko.observable();
	self.serviceAddressApt = ko.observable();
	self.serviceZip = ko.observable();
	
	//service cost
	self.recurringTotal = ko.observable();
	self.onetimeTotal = ko.observable();
	
	//billing info
	self.billingFirstName = ko.observable();
	self.billingLastName = ko.observable();
	self.billingEmail = ko.observable();
	self.billingPhone = ko.observable();
	self.billingAddress = ko.observable();
	self.billingAddressApt = ko.observable();
	self.billingZip = ko.observable();
	
	self.billingCard = ko.observable();
	self.billingCardExpiresMonth = ko.observable();
	self.billingCardExpiresYear = ko.observable();
	self.billingCardSecurity = ko.observable();
	
	//new account info
	self.accountNumber = ko.observable('');
	
	self.billingCopiedFromService = false;
	
	self.billingIsSame = function(){
		if(!self.billingCopiedFromService){
			self.billingAddress(self.serviceAddress());
			self.billingAddressApt(self.serviceAddressApt());
			self.billingZip(self.serviceZip());
			self.billingCopiedFromService = true;
		} else {
			self.billingCopiedFromService = false;
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
		var deliveryDays = [];
		var day = self.serviceDay();
		
		if (Number(day) === day){
			var deliveryDay = 
			{
				date: new Date().getNextWeekDay(day), //calculate the next occurance of the service day
				isoString: ""
			};
			
			for(var i = 0; i < 5; i++ ){
				deliveryDay.isoString = deliveryDay.date.toJSONLocal();
				deliveryDays.push(deliveryDay);
				//create new object
				deliveryDay = {
					date: new Date(deliveryDay.date),
					isoString: ""
				};
				deliveryDay.date = deliveryDay.date.getNextWeekDay(day); //interate to the next possibility //setDate(deliveryDay.date.getDate() + 1)
			}
		}
		
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
		
		if(landfill){
			price += landfill.price;
		}
		if(recycling){
			price += recycling.price;
		}
		if(organics){
			price += organics.price;
		}
		return "$" + price;
	});
	
	self.loadCategory = function(data, event){
		console.log("Clicked");
		console.log(data);
		
		wastemate.getServices(data.line).then(function(services){
			
			//clear out all services currently in the view model arrays
			self.services([]);
			self.landfillServices([]);
			self.recyclingServices([]);
			self.organicsServices([]);
			
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
			});
			//sort the arrays!
			self.landfillServices.sort(function(left, right) { return left.name == right.name ? 0  : (left.name < right.name ? -1 : 1); });
			self.recyclingServices.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1); });
			self.organicsServices.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1); });
			
			self.show("residential");
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
	
	self.selectLandfillSerivce = function (data, event){
		//console.log(data);
		ko.utils.arrayForEach(self.landfillServices(), function(item) {
			item.selected = item == data;
			item.summary = " landfill cart";
		});
		self.landfillServices.refresh();
	};
	
	self.selectRecycleSerivce = function (data, event){
		//console.log(data);
		ko.utils.arrayForEach(self.recyclingServices(), function(item) {
			item.selected = item == data;
			item.summary = " recycling cart";
		});
		self.recyclingServices.refresh();
	};
	
	self.selectOrganicsSerivce = function (data, event){
		//console.log(data);
		ko.utils.arrayForEach(self.organicsServices(), function(item) {
			item.selected = item == data;
			item.summary = " organics cart";
		});
		self.organicsServices.refresh();
	};
	
	self.next = function(data, event) {
		switch(self.showing()){
			case "residential":
				//store selection in a pending order
				//save order should really return a promise... but this is a demo!
				self.saveOrder(event);
				self.cartsChoosen(true);
				//query backend for service day
				self.show("chooseStart");
			break;
			case "chooseStart":
				var when = new Date(self.serviceStartDate()).toISOString();
				wastemate.setRecurringStartDate(when).then(function(){
					self.startChoosen(true);
					self.show("siteInfo");	
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
			        address: self.serviceAddress() || '',
			        suite: self.serviceAddressApt() || '',
			        zip: self.serviceZip() || ''
				};
				
				wastemate.saveServiceInformation(siteInfo).then(
					function() {
						self.addressConfirmed(true);
						self.show("payment");		
					}, function (err) {
						console.log(err);
						alert("Oops, something went wrong.");
					}
				);
			break;
			case "payment":
				//Step 1 - Tokenize the card info
				var cardInfo = {
		          cardNumber: self.billingCard(),
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
								console.log(account);
								self.paymentProcessed(true);
								self.accountNumber(account.C_ID);
			    				self.show("confirmation");
							}, function(err){
								console.log(err);
								if(err.ExceptionMessage){
									alert(err.ExceptionMessage);
								}
							}	
						);
					}, function(err){
						// :(
						console.log(err);
						if(err.ExceptionMessage){
							alert(err.ExceptionMessage);
						}
					}
				);
			break;
		}
	};
	
	self.saveOrderInFlight = false;
	self.saveOrder = function (event){
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
		
		if(!landfillService){
			alert("Please select a waste service");
			return;
		}
		
		if(!recycleService){
			alert("Please select a recycling service");
			return;
		}
		
		if(!organicsService){
			alert("Please select an organics service");
			return;
		}
		
		var serviceChoices = [];
		serviceChoices.push(landfillService);
		serviceChoices.push(recycleService);
		serviceChoices.push(organicsService);
		
		console.log(serviceChoices);
		
		wastemate.saveServiceSelection(serviceChoices).then(function(){
			console.log("saved service selection");
			self.saveOrderInFlight = false;
			
		}, function(err){
			console.log("something went wrong");
			console.log(err);
			
			self.saveOrderInFlight = false;
		});;
	};
	
	self.show = function(view){
		switch(view){
			case "search":
				self.shouldShowSearch(true);
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
				self.showing("search");
				break;
			case "categries":
				self.shouldShowSearch(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldChooseStart(false);
				self.shouldShowCategories(true);
				self.shouldShowProcessNav(false);
				self.shouldShowProcessNavFooter(false);
				self.showing("categries");
				break;
			case "residential":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldChooseStart(false);
				self.shouldShowResidentialServices(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("residential");
				break;
			case "chooseStart":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldChooseStart(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("chooseStart");
			break;
			case "deliveryAndReview":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowDeliveryAndReview(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("deliveryAndReview");
				break;
			case "materials":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowRollOffMaterials(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("materials");
				break;
			case "rolloff":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowRollOffServices(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(true);
				self.showing("rolloff");
				break;
			case "siteInfo":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldChooseStart(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowBillingInfo(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(false);
				self.showing("siteInfo");
				break;
			case "payment":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowConfirmation(false);
				self.shouldShowPaymentInfo(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(false);
				self.showing("payment");
				break;
			case "confirmation":
				self.shouldShowSearch(false);
				self.shouldShowCategories(false);
				self.shouldShowResidentialServices(false);
				self.shouldShowRollOffMaterials(false);
				self.shouldShowRollOffServices(false);
				self.shouldShowDeliveryAndReview(false);
				self.shouldShowBillingInfo(false);
				self.shouldShowPaymentInfo(false);
				self.shouldShowConfirmation(true);
				self.shouldShowProcessNav(true);
				self.shouldShowProcessNavFooter(false);
				self.showing("confirmation");
				break;
			default:
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
				self.showing("");
		}
	};
};

ko.observableArray.fn.refresh = function () {
    var data = this();
    this([]);
    this(data);
};