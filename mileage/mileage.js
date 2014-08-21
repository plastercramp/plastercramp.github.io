var mileageApp = angular.module("mileageApp", []);

mileageApp.factory("mileage", function($q) {
	var addresses = {};
	var distances = {};
	
	var maxaddress = 0;
	
	var service = new google.maps.DistanceMatrixService();
	var geocoder = new google.maps.Geocoder();
	
	function updateRow(id, address, deferred) {
		service.getDistanceMatrix(
		  {
		    origins: [address],
		    destinations: Object.keys(addresses).map(function(id) { return addresses[id]; }),
		    travelMode: google.maps.TravelMode.DRIVING,
		    unitSystem: google.maps.UnitSystem.IMPERIAL
		  }, function(data) {
			if (typeof(data["status"]) !== "undefined") {
				console.log(data["status"]);
				setTimeout(updateRow(id, address, callback), 100);
			}
			else {
				console.log(data);
				ids = Object.keys(addresses);
				for (i = 0; i < ids.length; i++) {
					if (data["rows"][0]["elements"][i]["status"] === "ZERO_RESULTS") {
						distances[id][ids[i]] = "no routes";
					}
					else {
						distances[id][ids[i]] = data["rows"][0]["elements"][i]["distance"]["text"];
					}
				}
				updateColumn(id, address, deferred);
			}
		});
	}
	
	function updateColumn(id, address) {
		service.getDistanceMatrix(
		  {
		    origins: Object.keys(addresses).map(function(id) { return addresses[id]; }),
		    destinations: [address],
		    travelMode: google.maps.TravelMode.DRIVING,
		    unitSystem: google.maps.UnitSystem.IMPERIAL
		  }, function(data) {
			if (typeof(data["status"]) !== "undefined") {
				console.log(data["status"]);
				setTimeout(updateColumn(id, address, callback), 100);
			}
			else {
				console.log(data);
				ids = Object.keys(addresses);
				for (i = 0; i < ids.length; i++) {
					if (data["rows"][i]["elements"][0]["status"] === "ZERO_RESULTS") {
						distances[ids[i]][id] = "no routes";
					}
					else {
						distances[ids[i]][id] = data["rows"][i]["elements"][0]["distance"]["text"];
					}
				}
				deferred.resolve();
			}
		});
	}
	
	return {
		addAddress: function(address) {
			deferred = $q.defer();
			
			geocoder.geocode({
				address: address
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					id = maxaddress;
					maxaddress++;
					addresses[id] = address;
					distances[id] = {};
					updateRow(id, address, deferred);
				}
				else {
					deferred.reject("NOT FOUND");
				}
			});
			
			return deferred.promise;
		},
		removeAddress: function(id) {
			delete addresses[id];
			delete distances[id];
			for (index in distances) {
				delete distances[index][id];
			}
		},
		listAddresses: function(callback) {
			callback(addresses);
		},
		listDistances: function(callback) {
			callback(distances);
		}
	}	
});

mileageApp.controller("MileageController", function($scope, mileage) {
	mileage.listAddresses(function(addresses) {
		$scope.addresses = addresses;
	});
	
	mileage.listDistances(function(distances) {
		$scope.distances = distances;
	});
	
	$scope.addAddress = function() {
		promise = mileage.addAddress($scope.enteredAddress);
		
		promise.then(function() {
			$scope.enteredAddress = "";
		},
		function() {
			alert("invalid address");
		});
	}
	
	$scope.removeAddress = function(id) {
		mileage.removeAddress(id);
	}
});