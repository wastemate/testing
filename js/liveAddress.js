
var liveaddress = {};

function wireUpLiveAddress(inputId, apiKey){
	//TODO: remove hardcoded city & state filtering
	
	liveaddress = $.LiveAddress({
	  	key: apiKey,
	  	debug: false,
		waitForStreet: true,
	  	addresses: [{
	  		street: inputId
	  	}],
	    cityFilter:"Paso Robles,Atascadero,Creston,Santa Margarita,Pozo,San Luis Obispo,Morro Bay,Cambria,Cayucus,Los Osos,San Miguel,Shandon",
	    stateFilter:"CA"
	});
	
	liveaddress.on("AddressAccepted", function(event, data, previousHandler){
		if (data.response.chosen) {
			var lat = data.response.chosen.metadata.latitude;
			var lon = data.response.chosen.metadata.longitude;
			console.log(lat, lon);
			
			var chosen = data.response.chosen;
			
			console.log(chosen);
			
			var address = {
				primaryNumber : chosen.components.primary_number,
				street : chosen.delivery_line_1,
				city: chosen.components.city_name,
				state: chosen.components.state_abbreviation,
				zip: chosen.components.zipcode,
				rdi: chosen.metadata.rdi,
				lat: lat,
				lon: lon
			};
			
			console.log(address);
			
			//Set the viewModel params based on the address
			wma_viewModel.address(address);
			wma_viewModel.serviceAddress(address.street);
      		wma_viewModel.serviceCityStateZip(address.city + ", " + address.state + " " + address.zip);
      		wma_viewModel.serviceZip(address.zip);
			
			//Kick off the background process to store this address @ Parse for later referencing
			wastemate.createTempAccount(address).then(function(account){
				console.log("Account stored with parse");
				console.log(account);
				
				//Grab the site service day while we're at it
				wastemate.getServiceDayOfWeek().then(function(serviceDays){
					
					if(serviceDays.length === 0){
						alert("Oh drats, we don't have your address configured for online sign up. Call our office to speak to a human. 238-2381");
						wma_viewModel.address("");
						wma_viewModel.serviceAddress("");
		      			wma_viewModel.serviceCityStateZip("");
		      			wma_viewModel.serviceZip("");
					  	return;
					}
					
					//service days should be an array 
					var service = serviceDays[0];
					wma_viewModel.serviceDay(service.dow);
					console.log(serviceDays);				
				}, function(err){
					console.log("Error loading service day!");
					console.log(err);
					
					alert("Oh drats, we don't have your address configured for online sign up. Call our office to speak to a human. 238-2381");
					wma_viewModel.address("");
					wma_viewModel.serviceAddress("");
	      			wma_viewModel.serviceCityStateZip("");
	      			wma_viewModel.serviceZip("");
				});
			});
			
			
		}
		previousHandler(event, data);
	});
}