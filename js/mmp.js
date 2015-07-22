var mmp = angular.module('mapMyPub', ['ngAnimate', 'ngResource']);

mmp.controller('AppCtrl', ['$scope', '$timeout', 'Beers', 'Breweries', 'Categories', 'selectedBeer', function ($scope, $timeout, Beers, Breweries, Categories, selectedBeer) {
  /**
   * Beers properties
   * *
  Beers.query(function (data) {
    $scope.beers = data;
  });
  
  $scope.beer = {
    id: '0'
  };
  $scope.beers = [];
  $scope.breweries = [];
  
  Breweries.query({ verb: null }, function (data) {
    $scope.breweries = data;
    $scope.brewery = $scope.breweries[0];
  });
  
  $scope.getBreweryBeers = function () {
    if ($scope.brewery.id === '0') {
      $scope.brewery = {
        id: '0'
      };
      Beers.query(function (data) {
        $scope.beers = data;
      });
    }
    else {
      Breweries.get({ id: $scope.brewery.id, verb: null }, function (data) {
        $scope.brewery = data;
      });
      Breweries.query({ id: $scope.brewery.id, verb: 'beers' }, function (data) {
        $scope.beers = data;
        $scope.beer = data[0] || { id: '0' };
      });
    }
  };
  */
  
  $scope.selectedBeer = selectedBeer;
  $scope.$watch('selectedBeer.get()', function (newVal, oldVal) {
    console.log($scope.selectedBeer.get());
  });
  
  
  /**
   * PrefPane manager
   * */
  var animationDelay = 160;
  
  $scope.prefPane = {
    template: null,
    active: false
  };
  
  $scope.setPrefPane = function (e) {
    if ($scope.prefPane.active) {
      $scope.closePrefPane();
      $timeout(function () {
        $scope.openPrefPane(e);
      }, animationDelay);
    }
    else
      $scope.openPrefPane(e);
  }
  
  $scope.openPrefPane = function (e) {
    $scope.prefPane = {
      template: 'templates/' + e.currentTarget.id + '.html',
      active: true
    };
  };
  
  $scope.closePrefPane = function () {
    $scope.prefPane = {
      template: null,
      active: false
    };
  };
  
  /**
   * Google Maps API properties
   * */
  var mapOptions = {
    center: new google.maps.LatLng(45.7674631, 4.8335123),
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.map = new google.maps.Map(document.getElementById('mmpMap'), mapOptions);
}]);

mmp.controller('AddBeerCtrl', ['$scope', '$timeout', 'Beers', 'Breweries', 'Categories', function ($scope, $timeout, Beers, Breweries, Categories) {
  
  $scope.brewery = { 
    name: ''
  };
  $scope.beer = {
    name: '',
    description: ''
  };
  
  $scope.breweries = [];
  
  $scope.setFormBrewery = function (brewery) {
    $scope.brewery = brewery;
    $scope.breweries = [];
  };
  
  $scope.getBreweries = function () {
    var term = $scope.brewery.name.trim();
    
    $scope.breweries = [];
    
    if (!!term) {
      Breweries.query({ verb: 'find', term: term }, function (data) {
        $scope.breweries = data;
      });
    }
  };
  
  
  Categories.query({ verb: null }, function (data) {
    $scope.categories = data;
  });
}]);

mmp.controller('FindBeerCtrl', ['$scope', 'Beers', 'selectedBeer', function ($scope, Beers, selectedBeer) {

  $scope.beerInput = selectedBeer.get();
  
  $scope.beer = selectedBeer.get();
  
  $scope.beers = [];
  
  $scope.setFormBeer = function (beer) {
    $scope.beerInput = beer;
    $scope.beer = angular.copy(beer);
    selectedBeer.set(angular.copy(beer));
    $scope.beers = [];
  };
  
  $scope.getBeers = function () {
    var term = $scope.beerInput.name.trim();
    
    $scope.beers = [];
    
    if (!!term) {
      Beers.query({ verb: 'find', term: term }, function (data) {
        $scope.beers = data;
      });
    }
  };
}]);

mmp.factory('Beers', function ($resource) {
  return $resource("/api/beers/:id/:verb/:term");
});

mmp.factory('Breweries', function ($resource) {
  return $resource("/api/breweries/:id/:verb/:term");
});

mmp.factory('Categories', function ($resource) {
  return $resource("/api/categories/:id/:verb");
});

mmp.service('selectedBeer', function () {
  var selected = {};
  this.set = function (beer) {
    selected = beer;
  };
  this.get = function () {
    return selected;
  };
});