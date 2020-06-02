mui.init();

app.controller("scanProdsCtl", ["$scope", "ApiService", "DataService", "Loading", "DatePickerService", "$Modal", "UtilsService", "CacheService", function($scope, ApiService, DataService, Loading, DatePickerService, modal, UtilsService, CacheService) {

	var curView = plus.webview.currentWebview();

	$scope.domData = {
		typeData: [
			"周围5公里",
			"周围10公里",
			"周围20公里",
			"周围40公里"
		],
		type: 0,
		city: "全国",
		data: "",
		cpath: curView.cpath || "",
		isLoadData: false,
		state: query("state")
	};
	_scope = $scope;

	var _oldBack = mui.back;

	mui.back = function() {
		if($scope.domData.isModal) {
			modal.close();
		} else {
			bMap.overlay.autoCreate && (bMap.overlay.autoCreate = false);
			_oldBack();
		}
	};
	var _curUser = CacheService.get("user");

	$scope.event = {
		hideChooseInfo: function() {
			document.querySelector(".div-info-earechoose").style.display = "none";
		},
		showChooseInfo: function() {
			document.querySelector(".div-info-earechoose").style.display = "block";
		},
		choosedType: function(index) {
			$scope.domData.type = index;
			bMap.overlay.clear(function() {
				curData.getData();
			});
		},
		choosedType: function(index) {
			$scope.domData.type = index;
			bMap.overlay.clear(function() {
				curData.getData();
			});

			if(index == 0) {

				if($scope.domData.province != '全国') {
					if($scope.domData.city) {
						bMap.map.centerAndZoom($scope.domData.city, 9)
					} else {
						bMap.map.centerAndZoom($scope.domData.province, 6);
					}
				} else {
					bMap.map.centerAndZoom(bMap.center, 4);
				}
			}
		}
	};

	//区域二级联动 选择
	$('#showCityPicker').mPicker({
		level: 2,
		dataJson: cityData,
		Linkage: true,
		rows: 5,
		idDefault: true,
		splitStr: '-',
		shadow: 1,
		confirm: function(json) {
			var items = json.values.split('-');
			var _zoom = 4;
			if(items[1] == '全省' || items[1] == '全自治区' || items[0] == '全国') {
				$scope.domData.province = items[0];
				$scope.domData.city = '';

				if(items[0] != '全国') {
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
		cancel: function(json) {}
	});

	var curData = {
		getData: function() {
			mui.showLoading("", "div");
			bMap.overlay.autoCreate = false;
			var _city = $scope.domData.city;

			var maxLat = "",
				maxLng = "",
				minLat = "",
				minLng = "";

			var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetEqThirdRepairMap?isClosed=0";

			var bounds = bMap.location.circle.getBounds();

			minLat = bounds.getSouthWest().lat;
			minLng = bounds.getSouthWest().lng;

			maxLat = bounds.getNorthEast().lat;
			maxLng = bounds.getNorthEast().lng;

			url += "&minlat=" + minLat + "&minlng=" + minLng + "&maxlat=" + maxLat + "&maxlng=" + maxLng;

			url += " &cPath=" + $scope.domData.cpath;

			DataService.get(url).then(function(res) {
				$scope.domData.isLoadData = true;
				$scope.domData.data = res;
				bMap.overlay.render();

			}, function() {
				mui.hideLoading();
				mui.toast("加载数据失败!");
			});
		},
		getScanInfo: function(data) {
			UtilsService.openWindow({
				needLogin: true,
				id: 'equ-thirdpart-repair-info.html',
				url: 'equ-thirdpart-repair-info.html?id=' + data.ID + '&formlist=1'
			});
		}
	};

	window.setPath = function(cpath) {
		if(cpath != $scope.domData.cpath) {
			$scope.domData.cpath = cpath;
			curData.getData();
		}
	};

	/**自定义覆盖物 */
	var ComplexCustomOverlay = function(data, text, point) {
		this._point = point;
		this._data = data;
		this._text = text;
		this.lat = point.lat;
		this.lng = point.lng;
	};

	/**初始化自定义覆盖物 */
	ComplexCustomOverlay.prototype = new BMap.Overlay();
	ComplexCustomOverlay.prototype.initialize = function(map) {
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
		div.ontouchstart = function() {
			tempTime = new Date();
		}

		div.ontouchend = function() {
			if((new Date() - tempTime) > 100)
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
	ComplexCustomOverlay.prototype.draw = function() {
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
		init: function() {
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

			bMap.overlay.clear(function() {
				curData.getData();
			});

		},
		controler: {
			zoom: "",
			add: function() {
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
			renderToCount: function(data) {
				this.obj.getPoint(data.Province + data.City, function(point) {
					if(point) {

						var count = 0;

						var isoverlay = false;

						if($scope.domData.active.length == 3) {
							isoverlay = true;
							count += data.state3.length;
							count += data.state4.length;
							count += data.state7.length;
							count += data.state11.length;
							count += data.state9.length;
						} else {
							if(_scope.domData.active.indexOf(3) >= 0 && data.state3.length > 0) {
								isoverlay = true;
								count += data.state3.length;
							}
							if(_scope.domData.active.indexOf(4) >= 0 && data.state4.length > 0) {
								isoverlay = true;
								count += data.state4.length;
							}
							if(_scope.domData.active.indexOf(7) >= 0 && data.state7.length > 0) {
								isoverlay = true;
								count += data.state7.length;
							}
							if(_scope.domData.active.indexOf(11) >= 0 && data.state11.length > 0) {
								isoverlay = true;
								count += data.state11.length;
							}
							if(_scope.domData.active.indexOf(9) >= 0 && data.state9.length > 0) {
								isoverlay = true;
								count += data.state9.length;
							}
						}

						if(isoverlay) {
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
			clear: function(callback) {
				bMap.map.clearOverlays();
				bMap.markerData = [];
				bMap.mapData = [];

				bMap.getLocation(callback);
			},
			renderCount: function() {
				this.clear();

				$scope.domData.CountData.forEach(function(item) {
					bMap.geo.renderToCount(item);
				});

				mui.hideLoading();
			},
			render: function() {
				this.clear();

				bMap.overlay.autoCreate = true;
				var data = $scope.domData.data;

				for(var i = 0; i < data.length; i++) {
					bMap.map.addOverlay(bMap.overlay.getMarker(data[i]));
				}

				mui.hideLoading();
			},
			getMarker: function(_data) {
				var _this = this;
				var point = new BMap.Point(_data.MapLng, _data.MapLat);
				var marker = new BMap.Marker(point, {
					icon: _this.getIcon()
				});
				marker.setZIndex(1 + bMap.mapData.length);
				marker.setTop(true);
				marker.addEventListener("click", function(e) {
					var _marker = e.target;
					var _index = bMap.markerData.indexOf(_marker);

					curData.getScanInfo(bMap.mapData[_index]);
				});
				bMap.markerData.push(marker);
				bMap.mapData.push(_data);
				return marker;

			},
			getIcon: function(type) {
				var myIcon = new BMap.Icon("../../images/map/point_red.png", new BMap.Size(16, 16));
				myIcon.imageSize = new BMap.Size(16, 16);
				return myIcon;
			}
		},
		getLocation: function(callback) {
			if(this.location.marker) {
				bMap.map.addOverlay(this.location.marker);
				bMap.getCircle();
				typeof(callback) == "function" && callback();
			} else {
				UtilsService.getLocation().then(function(res) {

					var point = new BMap.Point(res.lng, res.lat);
					var myIcon = new BMap.Icon("https://api.map.baidu.com/images/geolocation-control/point/position-icon-14x14.png", new BMap.Size(14, 14))
					var marker = new BMap.Marker(point, {
						icon: myIcon
					});

					bMap.location.marker = marker;
					bMap.map.addOverlay(marker);

					bMap.getCircle();

					typeof(callback) == "function" && callback();
				}, function() {

				});
			}
		},
		getCircle: function() {
			var radius = 1000;
			switch($scope.domData.type) {
				case 0:
					radius = 5000;
					break;
				case 1:
					radius = 10000;
					break;
				case 2:
					radius = 20000;
					break;
				case 3:
					radius = 40000;
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

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});