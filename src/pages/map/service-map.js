app.controller("bodyCtl", [
	"$scope",
	"ApiService",
	"DataService",
	"DatePickerService",
	"UtilsService",
	"CacheService",
	"DatePickerService",
	"$Modal",
	function (
		$scope,
		ApiService,
		DataService,
		DatePickerService,
		UtilsService,
		CacheService,
		DatePickerService,
		$Modal
	) {
		var loading;
		var user = CacheService.get("user");
		$scope.isLoad = false;
		$scope.domData = {
			menu: {
				location: "全国"
			},
			activeMapView: true,
			activeMap: ["P","M","C"],
			activeDate: 0,
			selectType: "",
			locationView: "",
			datePickView: "",
			showType: "map",
			prodInfo:"",
			stateColor: {
				"P": "F27800",
				"M": "E60303",
				"C": "0BC07E"
			},
			mapTyps: [{
					value: "P",
					Label: "安装调试"
				},
				{
					value: "M",
					Label: "产品故障"
				},
				{
					value: "C",
					Label: "其他服务"
				}
			],
			dateList: [{
					value: 0,
					Label: "全部"
				},
				{
					value: 1,
					Label: "全年"
				},
				{
					value: 2,
					Label: "当前月"
				},
				{
					value: 3,
					Label: "当前季度"
				}
			],
			province: "全国",
			city: "全国",
			disValue: -1,
			data: [],
			active: 4,
			prodInfo: "",
			curDate: ""
		};

		var _curDate = new Date();
		var curDate = {
			quarter: {
				"1": "一季度",
				"2": "二季度",
				"3": "三季度",
				"4": "四季度"
			},
			curYear: _curDate.getFullYear(),
			curValue: _curDate.getMonth(),
			curType: "month",
			view: _curDate.getFullYear() + "年" + (_curDate.getMonth() + 1) + "月"
		};
		$scope.domData.curDate = curDate;



		// var data = CacheService.get("map-customer-" + user.UserID);

		// $scope.domData.active = data ? data.value : 1;

		window.hideLoading = function () {
			loading && loading.close();
		};
		window.showLoading = function () {
			if (loading) {
				loading.close();
				loading = "";
			}
			loading = plus.nativeUI.showWaiting("请稍后...", {
				width: "100px",
				height: "100px",
				back: "transmit"
			});
		};

		$scope.event = {
			chooseType: function (type) {

				if($scope.domData.activeMap.indexOf(type)>=0)
				{
					$scope.domData.activeMap.splice($scope.domData.activeMap.indexOf(type),1);
				}
				else
				{
					$scope.domData.activeMap.push(type);
				}

				subViews.map.refresh();
			},
			chooseDate: function (type) {
				if ($scope.domData.activeDate != type) {
					// CacheService.set("map-customer-" + user.UserID, {
					// 	value: type
					// }, true);
					$scope.domData.activeDate = type;

					subViews.map.refresh();
				}
			},
			chooseLocation: function () {
				$scope.domData.locationView.show("zoom-fade-out");
			},
			chooseProd: function () {
				UtilsService.openWindow({
					id: "problib-index.html",
					url: "../problib/index.html?state=selsku&isall=true",
					extras: {
						selectObj: $scope.domData.prodInfo,
						callback: "selectProdCallback"
					}
				});
			},
			clearProd: function () {
				$scope.domData.prodInfo = "";
				subViews.map.refresh();
			},
			chooseView: function () {
				$scope.domData.activeMapView = !$scope.domData.activeMapView;

				if ($scope.domData.activeMapView) {
					subViews.map.obj.show();
					subViews.list.obj.hide();
					subViews.tools.obj.show();
				} else {
					subViews.map.obj.hide();
					subViews.list.obj.show();
					subViews.tools.obj.hide();
				}
			},
			getDateRange: function (callback) {
				var _date = $scope.domData.curDate;
				DatePickerService.getDateRange(parseInt(_date.curYear), parseInt(_date.curValue), _date.curType, function (startDate, endDate, view) {
					_date.startDate = startDate;
					_date.endDate = endDate;
					_date.view = view;
					typeof callback == "function" && (callback());
				});
			},
			chooseDate: function () {
				var _date = $scope.domData.curDate;
				$scope.domData.datePickView.evalJS("chooseDate(" + JSON.stringify(_date) + ")");
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
			}
		};

		$scope.event.getDateRange();


		window.setCitys = function (province, city) {
			$scope.domData.province = province;
			$scope.domData.city = city;
			$scope.domData.menu.location = city;
			$scope.$apply();

			$scope.domData.locationView.evalJS(
				"setCitys('" + province + "','" + city + "')"
			);
		};

		window.selectProdCallback = function (res) {
			$scope.domData.prodInfo = res;
			$scope.$apply();

			subViews.map.refresh();
		};

		window.locationBack = function (data) {
			var keys = Object.getOwnPropertyNames(data);
			for (var i = 0; i < keys.length; i++) {
				$scope.domData[keys[i]] = data[keys[i]];
			}
			if (data.disValue) {
				$scope.domData.menu.location = "周围" + data.disValue + "公里";
			} else {
				$scope.domData.menu.location = data.city;
			}

			$scope.$apply();

			subViews.map.refresh();
		};

		window.datePickCallback = function (data) {
			var _date = $scope.domData.curDate;
			_date.curYear = data.year;
			_date.curType = data.type;
			_date.curValue = data.value;
			

			$scope.event.getDateRange(function(){
				$scope.$apply();
				subViews.map.refresh();
			});

		};
		window.toolsCallback = function(value){
			$scope.domData.activeDate = value;
			subViews.map.refresh();
		}

		window.setData = function (data) {
			$scope.domData.data = data;
			$scope.$apply();
		};

		window.selectProdCallback = function(res) {
			$scope.domData.prodInfo = res ;
			$scope.$apply();
	
			subViews.map.refresh();
		};

		var subViews = {
			init: function () {
				var _this = this;

				//this.list.init();

				setTimeout(function () {
					_this.map.init();
					_this.tools.init();
				}, 300);
				this.createLocation();

				this.createDatePick();
			},
			map: {
				obj: "",
				init: function () {
					this.obj = createSubPage(
						"service-map-container.html",
						"service-map-container.html",
						"80px", {
							activeMap: $scope.domData.activeMap,
							activeDate: $scope.domData.activeDate,
							province: $scope.domData.province,
							city: $scope.domData.city,
							startDate:$scope.domData.curDate.startDate,
							endDate:$scope.domData.curDate.endDate,
							prodInfo:$scope.domData.prodInfo
						}
					);
					plus.webview.currentWebview().append(this.obj);
				},
				refresh: function () {
					var data = {
						province: $scope.domData.province,
						city: $scope.domData.city,
						activeDate: $scope.domData.activeDate,
						activeMap: $scope.domData.activeMap,
						startDate:$scope.domData.curDate.startDate,
						endDate:$scope.domData.curDate.endDate,
						prodInfo:$scope.domData.prodInfo
					};

					this.obj.evalJS("refresh(" + JSON.stringify(data) + ")");
				},
				chooseType: function (value, have) {
					this.obj.evalJS("chooseType(" + value + "," + have + ")");
				}
			},
			createLocation: function () {
				var styles = {
					background: "transparent",
					zindex: 10
				};
				if (mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
					styles.hardwareAccelerated = false;
				}
				$scope.domData.locationView = plus.webview.create(
					"../menus/location.html?isfujin=false",
					"location.html",
					styles, {
						callback: "locationBack"
					}
				);
			},
			createDatePick: function () {
				var styles = {
					background: "transparent",
					zindex: 10
				};
				if (mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
					styles.hardwareAccelerated = false;
				}
				$scope.domData.datePickView = plus.webview.create(
					"../menus/chooseDate.html",
					"chooseDate.html",
					styles, {
						callback: "datePickCallback"
					}
				);
			},
			tools: {
				obj: "",
				init: function() {
					this.obj =createSubPage("service-map-tools.html", "service-map-tools.html", {
						bottom: "0px",
						left: "0px",
						height: "107px",
						width: "50px",
						position: 'absolute',
						scrollIndicator: 'none',
						background: 'transparent'
					},{
						callback:"toolsCallback"
					});
					this.obj.hide();
					var _this = this;
					setTimeout(function(){
						_this.obj.show();
					},1000);
					plus.webview.currentWebview().append(this.obj);
				}
			},
			list: {
				obj: "",
				init: function () {
					this.obj = createSubPage(
						"service-map-list.html",
						"service-map-list.html",
						"80px", {
							activeMap: $scope.domData.activeMap,
							activeDate: $scope.domData.activeDate,
							province: $scope.domData.province,
							city: $scope.domData.city,
							startDate:$scope.domData.curDate.startDate,
							endDate:$scope.domData.curDate.endDate
						}
					);
					plus.webview.currentWebview().append(this.obj);
				},
				refresh: function () {
					var data = {
						activeMap: $scope.domData.activeMap,
						activeDate: $scope.domData.activeDate,
						province: $scope.domData.province,
						city: $scope.domData.city,
						startDate:$scope.domData.curDate.startDate,
						endDate:$scope.domData.curDate.endDate
					};

					this.obj.evalJS("refresh(" + JSON.stringify(data) + ")");
				},
				chooseType: function (value, have) {
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
			if(typeof(top)=="object")
			{
				styles = top;
			}

			if (mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
				styles.hardwareAccelerated = false;
			}
			var win = plus.webview.create(url, id, styles, extras);

			return win;
		}

		subViews.init();

		$scope.isLoad = true;
	}
]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});