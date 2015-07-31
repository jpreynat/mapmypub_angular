Beers = new Mongo.Collection('beers');
Breweries = new Mongo.Collection('breweries');
BreweriesGeocode = new Mongo.Collection('breweriesgeocode');
Categories = new Mongo.Collection('categories');
Pubs = new Mongo.Collection('pubs');
Styles = new Mongo.Collection('styles');

Meteor.startup(function () {
// code to run on server at startup
});

Meteor.publish('breweries', function () {
	return Breweries.find({}, { sort: [[ 'name', 'asc' ]], fields: { id: 1, name: 1 }});
});

Meteor.publish('beers', function () {
	return Beers.find({}, { fields: { id: 1, name: 1 } });
});

Meteor.publish('pubs', function () {
	return Pubs.find({});
});

Meteor.methods({
	geoCode: function (address) {
	  var geocoder = new GeoCoder();
	  var result = geocoder.geocode(address);
	  //console.log(result);

	  // set result to object with error property if no matching (i.e. length != 1)
	  if (result.length !== 1) {
	  	result = { error: 'No matching address found' };
	  }
	  return result;
	},
	addPub: function (details) {
		var newPub = {
			name: details.name,
			address: details.address
			/*
			// address contains :
			city: "Lyon"
			country: "France"
			countryCode: "FR"
			latitude: 45.7671106
			longitude: 4.8366184
			state: "Rhône-Alpes"
			stateCode: "RA"
			streetName: "Rue Pizay"
			streetNumber: "24"
			zipcode: "69001"
			*/
		};
	}
});