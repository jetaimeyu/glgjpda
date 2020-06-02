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
			activeMap: 1,
			activeDate: 2,
			selectType: "",
			locationView: "",
			datePickView: "",
			showType: "map",
			stateColor: {
				1: "3399FF",
				2: "E60303",
				3: "FFCC00",
				11: "6699CC",
				9: "999966"
			},
			mapTyps: [{
					value: 1,
					Label: "签约客户"
				},
				{
					value: 2,
					Label: "跟进客户"
				},
				{
					value: 3,
					Label: "潜在客户"
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
			data:[
				{
					"address": "北海公园东门",
					"city": "北京市",
					"code": "861476031978331",
					"district": "西城区",
					"name": "生物质导热油锅炉",
					"onlineState": 1,
					"province": "北京市",
					"street": "迎春街",
					"type": 3,
					"color":"#1AB243",
					"typename":"生物质",
					"lng": "116.395645",
					"lat":"39.933195",
					"showWorkingTime": "70-1-0-59-561",
					"totalWorkingTime": 608459561
				},
				{
					"address": " 郑州外国语新枫杨学校内",
					"city": "郑州市",
					"code": "9100000000000001",
					"district": "中原区",
					"onlineState": 0,
					"street": "迎春街",
					"province": "河南省",
					"typename":"燃油气",
					"color":"#A927E5",
					"type": 4,
					"name": "燃油气蒸汽锅炉",
					"lng": "112.56756221526689",
					"lat":"32.82486440274976",
					"showWorkingTime": "100-20-39-21-551",
					"totalWorkingTime": 160761551
				},
				{
					"address": "山东大学齐鲁软件园校区",
					"city": "济南市",
					"code": "861476031978331",
					"district": "历城区",
					"name": "燃油气热水锅炉",
					"onlineState": 0,
					"province": "山东省",
					"street": "舜华路",
					"color":"#18D0F1",
					"type": 5,
					"typename":"燃油气",
					"lng": "117.145946",
					"lat":"36.674155",
					"showWorkingTime": "200-3-1-22-131",
           			 "totalWorkingTime": 97282131
				},
				{
					"address": "滨河游乐园西门",
					"city": "临沂市",
					"code": "000000000000001",
					"district": "河东区",
					"name": "燃油气导热油锅炉",
					"onlineState": 0,
					"province": "山东省",
					"street": "滨河东路",
					"color":"#F4FF46",
					"type": 6,
					"typename":"燃油气",
					"lng": "118.388402",
					"lat":"35.06879",
					"showWorkingTime": "300-21-8-21-353",
           			 "totalWorkingTime": 76101353
				},
				{
					"address": "泰安万达广场东门对过",
					"city": "泰安市",
					"code": "000000000000000",
					"district": "岱岳区",
					"name": "生物质蒸汽锅炉",
					"onlineState": 0,
					"province": "山东省",
					"street": "泰山大街",
					"type": 2,
					"typename":"生物质",
					"lng": "117.094528",
					"color":"#F29539",
					"lat":"36.188294",
					"showWorkingTime": "60-20-31-50-862",
            		"totalWorkingTime": 73910862
				},
				{
					"address": "和平公园西门对过",
					"city": "上海市",
					"code": "869777026194467",
					"district": "虹口区",
					"name": "生物质热水锅炉",
					"onlineState": 0,
					"province": "上海市",
					"street": "天宝路",
					"type": 1,
					"color":"#E74646",
					"typename":"生物质",
					"lng": "121.510507",
					"lat":"31.276368",
					"showWorkingTime": "87-0-13-0-154",
            		"totalWorkingTime": 780154
				}
			],
			province: "全国",
			city: "全国",
			disValue: -1,
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
				if ($scope.domData.activeMap != type) {
					// CacheService.set("map-customer-" + user.UserID, {
					// 	value: type
					// }, true);
					$scope.domData.activeMap = type;

					subViews.map.refresh();
				}
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
				} else {
					subViews.map.obj.hide();
					subViews.list.obj.show();
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

		window.setData = function (data) {
			$scope.domData.data = data;
			$scope.$apply();
		};

		var subViews = {
			init: function () {
				var _this = this;

				this.list.init();

				setTimeout(function () {
					_this.map.init();
				}, 300);
			},
			map: {
				obj: "",
				init: function () {
					this.obj = createSubPage(
						"dev-map-links-container.html",
						"dev-map-links-container.html",
						"80px", {
							data:$scope.domData.data,
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
						data:$scope.domData.data,
						province: $scope.domData.province,
						city: $scope.domData.city,
						activeDate: $scope.domData.activeDate,
						activeMap: $scope.domData.activeMap,
						startDate:$scope.domData.curDate.startDate,
						endDate:$scope.domData.curDate.endDate
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
			list: {
				obj: "",
				init: function () {
					this.obj = createSubPage(
						"dev-map-links-list.html",
						"dev-map-links-list.html",
						"80px", {
							data:$scope.domData.data,
							activeMap: $scope.domData.activeMap,
							activeDate: $scope.domData.activeDate,
							province: $scope.domData.province,
							city: $scope.domData.city,
							startDate:$scope.domData.curDate.startDate,
							endDate:$scope.domData.curDate.endDate
						}
					);
					this.obj.hide();
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