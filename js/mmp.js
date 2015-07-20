var mmp = angular.module('mapMyPub', ['ngAnimate']);

mmp.controller('AppCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
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
  
  var mapOptions = {
    center: new google.maps.LatLng(45.7674631, 4.8335123),
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.map = new google.maps.Map(document.getElementById('mmpMap'), mapOptions);
}]);