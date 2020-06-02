mui.init();

app.controller("prodTrackCtl", ["$scope", "ApiService", "DataService", "Loading", "DatePickerService", "$Modal", "UtilsService", "$filter","TapService", "AuthService",function ($scope, ApiService, DataService, Loading, DatePickerService, modal, UtilsService, $filter,TapService,AuthService) {

	$scope.domData = {
		mdCode: query("mdcode") || "",
		prodId: query("prodid") || "",
		skuId: query("skuid") || "",
		prodInfo:"",
		InnerCodeName:""
	};

	var oldBack = mui.back;
	mui.back = function () {
		bMap.overlay.autoCreate && (bMap.overlay.autoCreate = false);
		oldBack();
	};

	
    AuthService.getAuth().then(function(res) {
        $scope.domData.InnerCodeName = res.InnerCodeName || '出厂编号';
	});
	
	$scope.event = {
		openProd: function () {
			UtilsService.openWindow({
                needLogin: true,
                id: 'prodinfo-head.html',
                url: '/src/pages/problib/prodinfo-head.html?prodId=' + $scope.domData.prodInfo.ProdID + '&SkuID=' + $scope.domData.skuId + "&MdCode=" + $scope.domData.mdCode + "&ProdInnerCode=" + $scope.domData.prodInfo.InnerCode + "&InnerCodeName=" + encodeURIComponent($scope.domData.InnerCodeName)
            });

        }
	};

	var curData = {
		getData: function () {
			mui.showLoading("", "div");

			var url = ApiService.Api50 + "/api/v2/MdCode/GetMdScanCodeListByMdCode?mdCode=" + $scope.domData.mdCode + "&pageIndex=" + $scope.domData.pageIndex + "&pageSize=9999999";

			DataService.get(url).then(function (res) {
				bMap.overlay.render(res);
			}, function () {
				mui.hideLoading();
				mui.toast("加载数据失败!");
			});
		},
		getScanInfo: function (mdcode, prodId, skuId) {
			UtilsService.openWindow({
				needLogin: true,
				id: "prodScanInfos.html",
				url: "prodScanInfos.html?mdcode=" + mdcode + "&prodid=" + prodId + "&skuid=" + skuId
			});
		},
		getProdInfo: function () {

			var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + $scope.domData.mdCode;

			DataService.get(url).then(function (res) {
				$scope.domData.prodInfo = res;
			}, function () {
				plus.nativeUI.toast("加载信息失败！");
			});
		},
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
				enableMapClick: false
			});
			this.map.centerAndZoom(this.center, this.zoom);

			this.controler.add();
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
		markerData: [],
		mapData: [],
		linePoints: [],
		mapPoints: [],
		overlay: {
			autoCreate: true,
			clear: function () {
				bMap.map.clearOverlays();
				bMap.markerData = [];
				bMap.mapData = [];
				bMap.linePoints = [];
			},
			renderMarker: function (_index) {
				var _type = "orange";
				var data = bMap.mapData;
				data.length == 1 && (_type = "red");
				(data.length > 1 && _index == 0) && (_type = "green");
				(data.length > 1 && _index == data.length - 1) && (_type = "red");
				var marker = bMap.overlay.getMarker(_index, _type);
				bMap.map.addOverlay(marker);
			},
			render: function (data) {
				this.clear();



				bMap.mapData = data;


				this.renderMarker(0);

				// var points = []; // 添加海量点数据

				// for (var i = 0; i < data.length; i++) {
				// 	setTimeout(function () {
				// 		var _type = "orange";
				// 		data.length == 1 && (_type = "red");
				// 		(data.length > 1 && i == 0) && (_type = "green");
				// 		(data.length > 1 && i == data.length - 1) && (_type = "red");
				// 		bMap.map.addOverlay(bMap.overlay.getMarker(i,_type));
				// 	}, 1000);
				// }



				// if(bMap.mapData.length>0)
				// {
				//     var polyline = new BMap.Polyline(bMap.linePoints, {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});   //创建折线
				//     bMap.map.addOverlay(polyline);   //增加折线
				// }

				mui.hideLoading();
			},
			getMarker: function (_index, type) {
				var _this = this;
				var data = bMap.mapData;
				var point = new BMap.Point(data[_index].Lng, data[_index].Lat);
				bMap.linePoints.push(point);
				var marker = new BMap.Marker(point, {
					icon: _this.getIcon(type)
				});

				var _zIndex = _index + 1;
				if (_index == data.length - 1) {
					_zIndex = data.length + 100;
				} else if (_index == 0) {
					_zIndex = data.length + 50;
				}
				marker.setZIndex(_zIndex);
				marker.addEventListener("click", function (e) {
					// var _marker = e.target;
					// var _index = bMap.markerData.indexOf(_marker);

					// curData.getScanInfo(bMap.mapData[_index].MdCode, bMap.mapData[_index].ProductID, bMap.mapData[_index].SkuID);
				});


				if (_index > 0) {
					var points = [];
					points.push(new BMap.Point(data[_index - 1].Lng, data[_index - 1].Lat));
					points.push(point);

					var polyline = new BMap.Polyline(points, {
						strokeColor: "blue",
						strokeWeight: 2,
						strokeOpacity: 0.5
					}); //创建折线
					bMap.map.addOverlay(polyline); //增加折线	
				}

				bMap.mapPoints.push(point);

				bMap.map.setViewport(bMap.mapPoints);


				bMap.markerData.push(marker);

				if (_index < bMap.mapData.length - 1 && bMap.overlay.autoCreate) {
					setTimeout(function () {
						bMap.overlay.renderMarker(_index + 1);
					}, 500);
				}

				return marker;

			},
			getIcon: function (type) {
				var myIcon = new BMap.Icon("../../images/map/point_" + type + ".png", new BMap.Size(16, 16));
				myIcon.imageSize = new BMap.Size(16, 16);
				return myIcon;
			}
		}

	};

	bMap.init();


	curData.getData();
	curData.getProdInfo();
}]);

mui.showLoading("", "div");
mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});