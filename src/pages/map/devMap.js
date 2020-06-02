mui.init();
var _scope;
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

$("#a_date_view").text(curDate.view);

app.controller("scanProdsCtl", ["$scope", "ApiService", "DataService", "Loading", "DatePickerService", "$Modal", "UtilsService", "CacheService", function ($scope, ApiService, DataService, Loading, DatePickerService, modal, UtilsService, CacheService) {

	$scope.domData = {
		isModal: false,
		curDate: curDate,
		selectType: "",
		province: "全国",
		city: "",
		active: [4, 3, 7, 11, 9],
		stateColor: {
			4: "3399FF",
			7: "E60303",
			3: "FFCC00",
			11: "6699CC",
			9: "999966"
		},
		states: [{
				value: 4,
				label: "空闲设备"
			},
			{
				value: 7,
				label: "故障设备"
			},
			{
				value: 3,
				label: "二手设备"
			},
			{
				value: 11,
				label: "租赁设备"
			},
			{
				value: 9,
				label: "回收设备"
			}
		],
		isOpenState: 0,
		CountData: [],
		type: 1,
		typeData: [
			"省市区域",
			"周围5公里",
			"周围10公里",
			"周围20公里",
			"周围40公里"
		],
		data: "",
		scanInfo: "",
		isLoadData: false
	};
	_scope = $scope;

	var _oldBack = mui.back;

	mui.back = function () {
		if ($scope.domData.isModal) {
			modal.close();
		} else {
			bMap.overlay.autoCreate && (bMap.overlay.autoCreate = false);
			_oldBack();
		}
	};
	var _curUser = CacheService.get("user");
	$scope.$on("modal_close", function () {
		$scope.domData.isModal = false;
	});

	$scope.event = {
		chooseDate: function () {
			var _date = $scope.domData.curDate;
			$scope.domData.isModal = true;
			DatePickerService.getTime(_date.curYear, _date.curValue, _date.curType).then(function (data) {

				_date.curYear = data.year;
				_date.curType = data.type;
				_date.curValue = data.value;
				_date.startDate = data.startDate;
				_date.endDate = data.endDate;
				_date.view = data.view;

				curData.getData();
			});
		},
		datePlus: function () {
			var _date = $scope.domData.curDate;
			switch (_date.curType) {
				case 'year':
					_date.curYear = parseInt(_date.curYear) - 1;
					break;
				case 'quarter':
					_date.curValue = parseInt(_date.curValue) - 1;
					if (_date.curValue == 0) {
						_date.curValue = 4;
						_date.curYear -= 1;
					}
					break;
				case 'month':
					_date.curValue = parseInt(_date.curValue) - 1;
					if (_date.curValue == -1) {
						_date.curValue = 11;
						_date.curYear -= 1;
					}
					break;
			}
			$scope.event.getDateRange(function () {
				curData.getData();
			});
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
		dateAdd: function () {
			var _date = $scope.domData.curDate;
			switch (_date.curType) {
				case 'year':
					_date.curYear = parseInt(_date.curYear) + 1;
					break;
				case 'quarter':
					_date.curValue = parseInt(_date.curValue) + 1;
					if (_date.curValue == 5) {
						_date.curValue = 1;
						_date.curYear += 1;
					}
					break;
				case 'month':
					_date.curValue = parseInt(_date.curValue) + 1;
					if (_date.curValue == 12) {
						_date.curValue = 0;
						_date.curYear += 1;
					}
					break;
			}
			$scope.event.getDateRange(function () {
				curData.getData();
			});
			//$scope.event.getViewDate();
		},
		getViewDate: function () {
			var _date = $scope.domData.curDate;
			switch (_date.curType) {
				case 'year':
					_date.view = _date.curYear + "年";
					break;
				case 'quarter':
					_date.view = _date.curYear + "年" + curDate.quarter[_date.curValue];
					break;
				case 'month':
					_date.view = _date.curYear + "年" + _date.curValue + "月";
					break;
			}

			curData.getData();
		},
		selectType: function () {
			UtilsService.openWindow({
				id: "mdSelectEqClass.html",
				url: "../eqmentlib/mdSelectEqClass.html",
				extras: {
					selectObj: $scope.domData.selectType,
					callback: 'faultEquCallback'
				}
			})
		},
		delType: function (event) {
			event.stopPropagation();
			$scope.domData.selectType = "";

			curData.getData();
		},
		chooseType: function (type) {
			var _active = $scope.domData.active;
			if (_active.indexOf(type) >= 0) {
				_active.splice(_active.indexOf(type), 1)
			} else {
				_active.push(type);
			}

			mui.showLoading("", "div");

			bMap.overlay.render();
		},
		showDivInfo: function () {
			document.querySelector(".div-info-dev").style.display = "block";
		},
		hideDivInfo: function () {
			document.querySelector(".div-info-dev").style.display = "none";
			$scope.domData.scanInfo = "";
		},
		hideChooseInfo: function () {
			document.querySelector(".div-info-earechoose").style.display = "none";
		},
		showChooseInfo: function () {
			document.querySelector(".div-info-earechoose").style.display = "block";
		},
		choosedType: function (index) {
			$scope.domData.type = index;
			bMap.overlay.clear(function () {
				curData.getData();
			});

			if (index == 0) {

				if ($scope.domData.province != '全国') {
					if ($scope.domData.city) {
						bMap.map.centerAndZoom($scope.domData.city, 9)
					} else {
						bMap.map.centerAndZoom($scope.domData.province, 6);
					}
				} else {
					bMap.map.centerAndZoom(bMap.center, 4);
				}
			}
		},
		openComp: function (event, compId) {
			event.stopPropagation();
			UtilsService.openWindow({
				needLogin: true,
				id: 'complib-index.html',
				url: '../complib/index.html?compid=' + compId
			});
		},
		openInfo: function (event, id, compId) {
			event.stopPropagation();
			UtilsService.openWindow({
				needLogin: true,
				id: 'equ-details-external.html',
				url: '../eqmentlib/equ-details-external.html?equid=' + id
			});
			//跳转区分自己企业和别的企业
			//			if(_curUser.CompID != compId) {
			//				UtilsService.openWindow({
			//					needLogin: true,
			//					id: 'equ-details-external.html',
			//					url: '../eqmentlib/equ-details-external.html?equid=' + id
			//				});
			//			} else {
			//				UtilsService.openWindow({
			//					needLogin: true,
			//					id: 'equ-details.html',
			//					url: '../eqmentlib/equ-details.html?equid=' + id
			//				});
			//			}
		},
		OpenList: function (state) {
			OpenList(state);
		},
		showState: function () {
			$scope.domData.isOpenState = $scope.domData.isOpenState ? 0 : 1;
		}
	};

	//选择产品回调事件
	window.faultEquCallback = function (res) {
		$scope.domData.selectType = res ? res[0] : "";
		$scope.$apply();
		//		//重新加载高度
		//		var tools_height = document.querySelector(".map_tools").offsetHeight;
		//		document.querySelector(".map_types").style.top = tools_height + 47 + "px";
		curData.getData();
	};

	window.OpenList = function (state) {

		var _province = $scope.domData.province == "全国" ? "" : $scope.domData.province;
		var _city = $scope.domData.city;
		var params = "";

		var _state = 0;
		if (state) {
			_state = state;
		} else {
			if ($scope.domData.active.length == 0) {
				_state = -1;
			} else {
				_state = $scope.domData.active.join(',');
			}

		}

		params += "state=" + _state + "&";

		params += "cpath=" + ($scope.domData.selectType ? $scope.domData.selectType.path : "") + "&";

		if ($scope.domData.type == 0) {
			params += "province=" + encodeURI(_province) + "&";
			params += "city=" + encodeURI(_city);
		} else {
			var bounds = bMap.location.circle.getBounds();

			minLat = bounds.getSouthWest().lat;
			minLng = bounds.getSouthWest().lng;

			maxLat = bounds.getNorthEast().lat;
			maxLng = bounds.getNorthEast().lng;

			params += "minlat=" + minLat + "&minlng=" + minLng + "&maxlat=" + maxLat + "&maxlng=" + maxLng;
		}

		UtilsService.openWindow({
			needLogin: true,
			id: 'dev-list.html',
			url: 'dev-list.html?' + params
		});

		$scope.event.hideDivInfo();
	}

	//区域二级联动 选择
	$('#showCityPicker').mPicker({
		level: 2,
		dataJson: cityData,
		Linkage: true,
		rows: 5,
		idDefault: true,
		splitStr: '-',
		shadow: 1,
		confirm: function (json) {
			var items = json.values.split('-');
			var _zoom = 4;
			if (items[1] == '全省' || items[1] == '全自治区' || items[0] == '全国') {
				$scope.domData.province = items[0];
				$scope.domData.city = '';

				if (items[0] != '全国') {
					bMap.map.centerAndZoom($scope.domData.province, 6);
				} else {
					bMap.map.centerAndZoom(bMap.center, 4);
				}

			} else {
				$scope.domData.city = items[1];
				$scope.domData.province = items[0];

				bMap.map.centerAndZoom($scope.domData.city, 9)
			}
			curData.getData();
		},
		cancel: function (json) {}
	});

	var curData = {
		getData: function () {
			mui.showLoading("", "div");
			bMap.overlay.autoCreate = false;
			var _prodInfo = $scope.domData.prodInfo;
			var _province = $scope.domData.province;
			var _city = $scope.domData.city;

			var _state = 0;
			if ($scope.domData.active.length == 0) {
				_state = -1;
			} else {
				_state = $scope.domData.active.join(',');
			}

			var maxLat = "",
				maxLng = "",
				minLat = "",
				minLng = "";

			var url = ApiService.Api50 + "/api/v1/Equipment/GetDevMap?1=1";

			if ($scope.domData.type > 0) {
				var bounds = bMap.location.circle.getBounds();

				minLat = bounds.getSouthWest().lat;
				minLng = bounds.getSouthWest().lng;

				maxLat = bounds.getNorthEast().lat;
				maxLng = bounds.getNorthEast().lng;

				url += "&minlat=" + minLat + "&minlng=" + minLng + "&maxlat=" + maxLat + "&maxlng=" + maxLng;
			} else {
				_province != "全国" && (url += "&province=" + _province);
				_city && (url += "&city=" + _city);
			}

			url += " &cPath=" + ($scope.domData.selectType ? $scope.domData.selectType.CPath : "");

			DataService.get(url).then(function (res) {
				$scope.domData.isLoadData = true;
				if ($scope.domData.type == 0 && $scope.domData.province == "全国") {
					$scope.domData.CountData = res;
				} else {
					$scope.domData.data = res;
				}


				bMap.overlay.render();

			}, function () {
				mui.hideLoading();
				mui.toast("加载数据失败!");
			});
		},
		getScanInfo: function (data) {

			var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + data.ID
			mui.showLoading("正在获取设备信息...");
			DataService.get(url).then(function (res) {
				mui.hideLoading();
				$scope.domData.scanInfo = res;
				$scope.event.showDivInfo();
			}, function () {
				mui.hideLoading();
				mui.toast("获取设备信息失败!");
			});

		}
	};

	/**自定义覆盖物 */
	var ComplexCustomOverlay = function (data, text, point) {
		this._point = point;
		this._data = data;
		this._text = text;
		this.lat = point.lat;
		this.lng = point.lng;
	};

	/**初始化自定义覆盖物 */
	ComplexCustomOverlay.prototype = new BMap.Overlay();
	ComplexCustomOverlay.prototype.initialize = function (map) {
		this._map = map;
		var div = this._div = document.createElement("div");
		div.zindex = "1000";
		div.style.position = "absolute";
		div.style.backgroundColor = "#EE5D5B";
		div.style.border = "1px solid #BC3B3A";
		div.style.color = "white";
		div.style.height = "18px";
		div.style.width = "35px";
		div.style.padding = "2px";
		div.style.lineHeight = "12px";
		div.style.whiteSpace = "nowrap";
		div.style.MozUserSelect = "none";
		div.style.textAlign = "center";
		div.style.fontSize = "12px"
		div.classList.add("count-point");
		var span = this._span = document.createElement("span");
		div.appendChild(span);
		span.appendChild(document.createTextNode(this._text));

		var that = this;

		var arrow = this._arrow = document.createElement("div");
		arrow.style.background = "url(http://map.baidu.com/fwmap/upload/r/map/fwmap/static/house/images/label.png) no-repeat";
		arrow.style.position = "absolute";
		arrow.style.width = "11px";
		arrow.style.height = "10px";
		arrow.style.top = "16px";
		arrow.style.left = "10px";
		arrow.style.overflow = "hidden";

		div.appendChild(arrow);

		var tempTime = "";
		div.ontouchstart = function () {
			tempTime = new Date();
		}

		div.ontouchend = function () {
			if ((new Date() - tempTime) > 100)
				return;
			$scope.domData.city = that._data.City;
			$scope.domData.province = that._data.Province;

			//地图放大到此城市
			bMap.map.centerAndZoom($scope.domData.city, 9);
			curData.getData();
		}

		map.getPanes().labelPane.appendChild(div);

		return div;
	};

	/**自定义覆盖物绘制事件 */
	ComplexCustomOverlay.prototype.draw = function () {
		var map = bMap.map;
		var pixel = map.pointToOverlayPixel(this._point);
		this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
		this._div.style.top = pixel.y - 26 + "px";
	};

	var bMap = {
		container: "map",
		map: "",
		zoom: 4,
		center: new BMap.Point(103.94863, 36.775374),
		init: function () {
			this.map = new BMap.Map(this.container, {
				enableDragging: true,
				enableDblclickZoom: true,
				enablePinchToZoom: true,
				enableInertialDragging: true,
				enableMapClick: true
			});
			this.map.centerAndZoom(this.center, this.zoom);

			this.geo.obj = new BMap.Geocoder();

			this.controler.add();

			bMap.overlay.clear(function () {
				curData.getData();
			});

		},
		controler: {
			zoom: "",
			add: function () {
				var top_right_navigation = new BMap.NavigationControl({
					anchor: BMAP_ANCHOR_TOP_RIGHT,
					type: BMAP_NAVIGATION_CONTROL_SMALL
				}); //右
				bMap.map.addControl(top_right_navigation);
			}
		},
		location: {
			marker: "",
			circle: ""
		},
		geo: {
			obj: "",
			renderToCount: function (data) {
				this.obj.getPoint(data.Province + data.City, function (point) {
					if (point) {

						var count = 0;

						var isoverlay = false;

						if ($scope.domData.active.length == 3) {
							isoverlay = true;
							count += data.state3.length;
							count += data.state4.length;
							count += data.state7.length;
							count += data.state11.length;
							count += data.state9.length;
						} else {
							if (_scope.domData.active.indexOf(3) >= 0 && data.state3.length > 0) {
								isoverlay = true;
								count += data.state3.length;
							}
							if (_scope.domData.active.indexOf(4) >= 0 && data.state4.length > 0) {
								isoverlay = true;
								count += data.state4.length;
							}
							if (_scope.domData.active.indexOf(7) >= 0 && data.state7.length > 0) {
								isoverlay = true;
								count += data.state7.length;
							}
							if (_scope.domData.active.indexOf(11) >= 0 && data.state11.length > 0) {
								isoverlay = true;
								count += data.state11.length;
							}
							if (_scope.domData.active.indexOf(9) >= 0 && data.state9.length > 0) {
								isoverlay = true;
								count += data.state9.length;
							}
						}

						if (isoverlay) {
							var overlay = new ComplexCustomOverlay(data, count, point);
							bMap.map.addOverlay(overlay);
						}
					}
				});
			}
		},
		markerData: [],
		mapData: [],
		overlay: {
			clear: function (callback) {
				bMap.map.clearOverlays();
				bMap.markerData = [];
				bMap.mapData = [];

				bMap.getLocation(callback);
			},
			renderCount: function () {
				this.clear();
				$scope.domData.data.state3 = [];
				$scope.domData.data.state4 = [];
				$scope.domData.data.state7 = [];
				$scope.domData.data.state9 = [];
				$scope.domData.data.state11 = [];

				$scope.domData.CountData.forEach(function (item) {

					$scope.domData.data.state3 = $scope.domData.data.state3.concat(item.state3);
					$scope.domData.data.state4 = $scope.domData.data.state4.concat(item.state4);
					$scope.domData.data.state7 = $scope.domData.data.state7.concat(item.state7);
					$scope.domData.data.state9 = $scope.domData.data.state9.concat(item.state9);
					$scope.domData.data.state11 = $scope.domData.data.state11.concat(item.state11);

					bMap.geo.renderToCount(item);
				});

				mui.hideLoading();
			},
			render: function () {
				this.clear();

				if ($scope.domData.type == 0 && $scope.domData.province == "全国") {
					bMap.overlay.renderCount();
					return;
				}

				bMap.overlay.autoCreate = true;
				var data = $scope.domData.data;

				var keys = Object.getOwnPropertyNames(data);
				for (var i = 0; i < keys.length; i++) {
					var state = parseInt(keys[i].replace("state", ""));
					if (_scope.domData.active.indexOf(state) >= 0 && bMap.overlay.autoCreate) {
						for (var j = 0; j < data[keys[i]].length; j++) {
							bMap.map.addOverlay(bMap.overlay.getMarker(data[keys[i]][j], $scope.domData.stateColor[state]));
						}
					}
				}

				mui.hideLoading();
			},
			getMarker: function (_data, type) {
				var _this = this;
				var point = new BMap.Point(_data.MapLng, _data.MapLat);
				var marker = new BMap.Marker(point, {
					icon: _this.getIcon(type)
				});
				marker.setZIndex(1 + bMap.mapData.length);
				marker.setTop(true);
				marker.addEventListener("click", function (e) {
					var _marker = e.target;
					var _index = bMap.markerData.indexOf(_marker);

					curData.getScanInfo(bMap.mapData[_index]);
				});
				bMap.markerData.push(marker);
				bMap.mapData.push(_data);
				return marker;

			},
			getIcon: function (type) {
				var myIcon = new BMap.Icon("../../images/map/" + type + ".png", new BMap.Size(16, 16));
				myIcon.imageSize = new BMap.Size(16, 16);
				return myIcon;
			}
		},
		getLocation: function (callback) {
			if (this.location.marker) {
				bMap.map.addOverlay(this.location.marker);

				if ($scope.domData.type > 0) {
					bMap.getCircle();
				}
				typeof (callback) == "function" && callback();
			} else {
				UtilsService.getLocation().then(function (res) {

					var point = new BMap.Point(res.lng, res.lat);
					var myIcon = new BMap.Icon("https://api.map.baidu.com/images/geolocation-control/point/position-icon-14x14.png", new BMap.Size(14, 14))
					var marker = new BMap.Marker(point, {
						icon: myIcon
					});

					bMap.location.marker = marker;
					bMap.map.addOverlay(marker);

					bMap.getCircle();

					typeof (callback) == "function" && callback();
				}, function () {

				});
			}
		},
		getCircle: function () {
			var radius = 1000;
			switch ($scope.domData.type) {
				case 1:
					radius = 5000;
					break;
				case 2:
					radius = 10000;
					break;
				case 3:
					radius = 20000;
					break;
				case 4:
					radius = 40000;
					break;
					break;
			}
			bMap.location.circle = new BMap.Circle(bMap.location.marker.point, radius, {
				strokeColor: "blue",
				strokeWeight: 1,
				strokeOpacity: 0.2
			}); //创建圆
			bMap.map.addOverlay(bMap.location.circle);

			var viewPort = bMap.map.getViewport(bMap.location.circle.getBounds());
			viewPort.zoom += 1;
			bMap.map.setViewport(viewPort);
		}

	};

	bMap.init();

}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});