app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "ProdService", "Loading", "CacheService", "AuthService", "$Modal", "MapService", "LocationService", "UtilsService", function($scope, ApiService, DataService, ProdService, Loading, CacheService, AuthService, $Modal, MapService, LocationService, UtilsService) {

	//地址详细信息
	$scope.location = {
		type: 0, //0自动定位，1手动选择
		province: "",
		city: "",
		district: "",
		address: "",
		lng: "",
		lat: ""
	};
	$scope.isAdroid = mui.os.android;
	$scope.loaded = false;
	var userId = "";

	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				up: {
					contentinit: '正在加载...',
					contentrefresh: '正在加载...',
					callback: pullupRefresh //上拉加载具体业务实现
				}
			}
		});
		setTimeout(function() {
			//没有搜索的时候禁用上拉事件
			mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
		}, 50);
	})

	//上拉加载
	function pullupRefresh() {
		Loading.show();
		$scope.loaded = "temp";
		setTimeout(function() {
			MapService.search($scope.search.text, $scope.location.city, 20, $scope.search.pageIdx++, true).then(function(res) {
				Loading.hide();
				res.results = res.results.filter(function(item) {
					return item.hasOwnProperty("address");
				});
				$scope.loaded = true;
				$scope.search.result = $scope.search.result.concat(res.results);
				mui('#pullrefresh').pullRefresh().endPullupToRefresh($scope.search.result.length >= res.total);
			}, function(error) {
				$scope.loaded = true;
				Loading.hide();
			});
		}, 500)
	}

	$scope.search = {
		text: "",
		history: [],
		result: [],
		pageIdx: 0,
		getHistory: function() {
			var temp = CacheService.get(userId + "_addr_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_addr_search");
		},
		doSearch: function() {
			if(!$scope.search.text) {
				mui.toast("请输入搜索名称！");
				return;
			}

			var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
			if(containSpecial.test($scope.search.text)) {
				mui.toast("请输入正确的名称！");
				return;
			}

			if(isEmojiCharacter($scope.search.text)) {
				mui.toast("请输入正确的名称！");
				return;
			}

			//关闭键盘
			document.activeElement.blur();

			var idx = $scope.search.history.indexOf($scope.search.text);
			if(idx >= 0) {
				$scope.search.history.splice(idx, 1);
			} else if($scope.search.history.length == 10) {
				$scope.search.history.splice(9, 1);
			}

			$scope.search.history = [$scope.search.text].concat($scope.search.history);
			CacheService.set(userId + "_addr_search", $scope.search.history, true);
			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();

			$scope.search.pageIdx = 0;
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		clearText: function() {
			//mui('#pullrefresh').pullRefresh().scrollTo(0,0,1);
			$scope.search.text = '';
			$scope.search.result = [];
			$scope.loaded = false;
			$scope.search.pageIdx = 0;
		}
	};

	function isEmojiCharacter(substring) {
		for(var i = 0; i < substring.length; i++) {
			var hs = substring.charCodeAt(i);
			if(0xd800 <= hs && hs <= 0xdbff) {
				if(substring.length > 1) {
					var ls = substring.charCodeAt(i + 1);
					var uc = ((hs - 0xd800) * 0x400) + (ls - 0xdc00) + 0x10000;
					if(0x1d000 <= uc && uc <= 0x1f77f) {
						return true;
					}
				}
			} else if(substring.length > 1) {
				var ls = substring.charCodeAt(i + 1);
				if(ls == 0x20e3) {
					return true;
				}
			} else {
				if(0x2100 <= hs && hs <= 0x27ff) {
					return true;
				} else if(0x2B05 <= hs && hs <= 0x2b07) {
					return true;
				} else if(0x2934 <= hs && hs <= 0x2935) {
					return true;
				} else if(0x3297 <= hs && hs <= 0x3299) {
					return true;
				} else if(hs == 0xa9 || hs == 0xae || hs == 0x303d || hs == 0x3030 ||
					hs == 0x2b55 || hs == 0x2b1c || hs == 0x2b1b ||
					hs == 0x2b50) {
					return true;
				}
			}
		}
	}

	//修改城市
	$scope.changeCity = function() {
		$Modal.modal({
			size: "small",
			region: "middle",
			footer: false,
			autoClose: true,
			params: {
				location: $scope.location
			},
			template: "<md-select-city loct='params.location' callback='getCity'></md-select-city>",
			controller: ['$scope', function($scope) {
				$scope.getCity = function(res) {
					if(res.result) {
						res.location.lng = res.location.lng;
						res.location.lat = res.location.lat;
						$scope.$modal.resolve(res);
						$scope.$modal.close();
					} else {
						$scope.$modal.close();
					}
				}
			}]
		}).show().then(function(res) {
			$scope.location = res.location;
			CacheService.set(userId + "_city_set", $scope.location, true);
			$scope.search.text = "";
			$scope.search.result.length = 0;
			$scope.loaded = false;
		});
	}

	$scope.openMap = function(addr) {
		if(!addr.address) {
			mui.toast("无法获取具体地址，请确认所选城市或查询内容是否正确！");
			return;
		}
		$scope.location.district = addr.area || $scope.location.district;
		$scope.location.address = addr.address.replace($scope.location.province, "").replace($scope.location.city, "").replace($scope.location.district, "");
		$scope.location.street = addr.name;
		$scope.location.lng = addr.location.lng;
		$scope.location.lat = addr.location.lat;

		UtilsService.openWindow({
			id: "mdMap.html",
			url: "mdMap.html",
			extras: {
				location: $scope.location
			}
		});
	}

	//页面初始化
	if(query('needlogin') === 'false') {
		initData();
	} else {
		//获取用户缓存信息
		AuthService.getAuth().then(function(res) {
			userId = res.UserID;
			initData();
		});
	}

	function initData() {
		$scope.search.getHistory();
		$scope.isLoad = true;
		//获取省市区设置缓存
		var citySetCache = CacheService.get(userId + "_city_set");
		if(citySetCache)
			$scope.location = CacheService.get(userId + "_city_set");
		else {
			//定位位置
			Loading.show();
			UtilsService.getLocation(true).then(function(location) {
				$scope.location = {
					type: 0,
					province: location.province,
					city: location.city,
					district: location.district,
					address: location.address,
					lng: location.lng,
					lat: location.lat
				};
				Loading.hide();
			}, function() {
				Loading.hide();
			});
		}
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});