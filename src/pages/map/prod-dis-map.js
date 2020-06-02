app.controller("bodyCtl", ["$scope", "ApiService", "DataService", "DatePickerService", "UtilsService", "CacheService", function($scope, ApiService, DataService, DatePickerService, UtilsService, CacheService) {
	var loading;
	var user = CacheService.get("user");
	$scope.isLoad = false;
	$scope.domData = {
		menu: {
			location: "全国"
		},
		activeMap: true,
		selectType: "",
		locationView: "",
		showType: "map",
		stateColor: {
			4: "3399FF",
			7: "E60303",
			3: "FFCC00",
			11: "6699CC",
			9: "999966"
		},
		province: "全国",
		city: "全国",
		disValue: -1,
		data: [],
		active: 4,
		prodInfo:""
	};

	var data = CacheService.get("map-state-" + user.UserID);

	$scope.domData.active = data ? data.value : 4;

	window.hideLoading = function() {
		loading && (loading.close());
	};
	window.showLoading = function() {
		if(loading) {
			loading.close();
			loading = "";
		}
		loading = plus.nativeUI.showWaiting("请稍后...", {
			width: '100px',
			height: '100px',
			back: 'transmit'
		});
	};

	$scope.event = {
		chooseType: function(type) {
			if($scope.domData.active != type) {
				CacheService.set("map-state-" + user.UserID, {
					value: type
				}, true);
				$scope.domData.active = type;
				subViews[$scope.domData.showType].chooseType(type);
			}
		},
		chooseLocation: function() {
			$scope.domData.locationView.show("zoom-fade-out");
		},
		chooseProd: function() {
			UtilsService.openWindow({
                id: "problib-index.html",
                url: "../problib/index.html?state=selsku&isall=true",
                extras: {
                    selectObj: $scope.domData.prodInfo,
                    callback: 'selectProdCallback'
                }
            })
		},
		clearProd:function(){
			$scope.domData.prodInfo="";
			subViews.map.refresh();
		},
		chooseView: function() {
			$scope.domData.activeMap = !$scope.domData.activeMap;

			if($scope.domData.activeMap) {
				subViews.map.obj.show();
				subViews.list.obj.hide();
			} else {
				subViews.map.obj.hide();
				subViews.list.obj.show();
			}
		}
	};
	
	window.setCitys=function(province,city){
		$scope.domData.province =province;
		$scope.domData.city = city;
		$scope.domData.menu.location =city;
		$scope.$apply();
		
		$scope.domData.locationView.evalJS("setCitys('" + province + "','" + city + "')")
	};

	window.selectProdCallback = function(res) {
		$scope.domData.prodInfo = res ;
		$scope.$apply();

		subViews.map.refresh();
	};

	window.locationBack = function(data) {
		var keys = Object.getOwnPropertyNames(data);
		for(var i = 0; i < keys.length; i++) {
			$scope.domData[keys[i]] = data[keys[i]];
		}
		if(data.disValue) {
			$scope.domData.menu.location = "周围" + data.disValue + "公里";
		} else {
			$scope.domData.menu.location = data.city;
		}

		$scope.$apply();

		subViews.map.refresh();
	};

	window.setData = function(data) {
		$scope.domData.data = data;
		$scope.$apply();
	};

	var subViews = {
		init: function() {
			var _this = this;
			setTimeout(function(){
				_this.map.init();
			},100);
			this.createLocation();
		},
		map: {
			obj: "",
			init: function() {
				this.obj = createSubPage("prod-dis-map-container.html", "prod-dis-container.html", "80px", {
					prodInfo: "",
					province: $scope.domData.province,
					city: $scope.domData.city
				});
				plus.webview.currentWebview().append(this.obj);
			},
			refresh: function() {

				var data = {
					province: $scope.domData.province,
					city: $scope.domData.city,
					prodInfo: $scope.domData.prodInfo
				};

				this.obj.evalJS("refresh(" + JSON.stringify(data) + ")");
			},
			chooseType: function(value, have) {
				this.obj.evalJS("chooseType(" + value + "," + have + ")");
			}
		},
		createLocation: function() {
			var styles = {
				background: 'transparent',
				zindex: 10
			};
			if(mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
				styles.hardwareAccelerated = false;
			}
			$scope.domData.locationView = plus.webview.create("../menus/location.html?isfujin=false", "location.html", styles, {
				callback: "locationBack"
			});
		},
		list: {
			obj: "",
			init: function() {
				this.obj = createSubPage("eq-map-list.html", "eq-map-list.html", "120px", {
					disValue: $scope.domData.disValue,
					cPath: "",
					active: $scope.domData.active
				});
				plus.webview.currentWebview().append(this.obj);
			},
			refresh: function() {

				var data = {
					disValue: $scope.domData.disValue,
					province: $scope.domData.province,
					city: $scope.domData.city,
					cPath: $scope.domData.selectType ? $scope.domData.selectType.CPath : ""
				};

				this.obj.evalJS("refresh(" + JSON.stringify(data) + ")");
			},
			chooseType: function(value, have) {
				this.obj.evalJS("chooseType(" + value + "," + have + ")");
			}
		}
	};

	function createSubPage(url, id, top, extras) {
		var styles = {
			popGesture: "none",
			top: top,
			bottom: "0px"
		};
		if(mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
			styles.hardwareAccelerated = false;
		}
		var win = plus.webview.create(url, id, styles, extras);

		return win;
	};

	subViews.init();

	$scope.isLoad = true;

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});