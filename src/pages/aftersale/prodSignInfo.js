app.controller("ProdInfoCtl", ["$scope", "CustomModalService", "CacheService", "$Modal", "UtilsService", "ApiService", "DataService", "Loading", "$filter","ChatUserService", function($scope, CustomModalService, CacheService, $Modal, UtilsService, ApiService, DataService, Loading, $filter,ChatUserService) {
	var view = plus.webview.currentWebview();
	$scope.user = CacheService.get('user');
	$scope.isLoad = true;

	$scope.OutCust = { //出库时的客户信息
		IsHasOut: 0, //是否有出库信息
		//生产厂家时：首次出库客户信息
		FirstCust: "",
		//生产厂家时：最后一次出库信息
		LastCust: ""
	};
	$scope.Fac = { //源生产厂家
		ID: 0,
		Name: ""
	}

	$scope.FacInstall = { //装配后生产厂家，20170706后改为源生产厂家对此赋值，不走装配
		ID: 0,
		Name:""
	}

	$scope.id = query("id");

	$scope.isLoad = true;
	getInfo();

	
	var saving = false; 
	var sendUserIDs=[];

	$scope.event = {
		toDetail:function(){
			this.openWindow('prodinfo-head.html','../problib/prodinfo-head.html?prodId=' + $scope.ProdInfo.ProdID + "&SkuID=" + $scope.ProdInfo.SkuID + "&MdCode=" + $scope.ProdInfo.MdCode + "&ProdInnerCode=" + encodeURIComponent($scope.ProdInfo.InnerCode) + "&InnerCodeName=" + $scope.ProdInfo.InnerCodeName)
		},
		toComp:function(compId){
			this.openWindow('complib-index.html','../complib/index.html?compid=' + compId);
		},
		tel:function(phone){
			plus.device.dial(phone, false);
		},
		openWindow:function(id,url,extras){
			var params = {
				id:id,
				url:url
			};
			if(extras)
			{
				params.extras = extras;
			}
			UtilsService.openWindow(params);
		},
	};

	function getInfo() {

		mui.showLoading("正在加载...", "div");

		var url = ApiService.Api50 + "/api/v1/Prod/GetProdScanSignInfo?id=" + $scope.id;
		DataService.get(url).then(function(res) {
			res.InnerCodeName = $scope.user.InnerCodeName || '出厂编号';
			$scope.ProdInfo = res;

			$scope.FacInstall.ID = res.CompID;
			$scope.FacInstall.Name = res.CompName;
			$scope.Fac.ID = res.SourceCompID;

			// bMap.renderMarker(res.MapLng, res.MapLat);

			loadProdCustInfo();

//			$scope.Fac.Name = res.CompName;
		},function(){
			mui.hideLoading();
		})
	}
	//获取产品出库所属客户信息
	function loadProdCustInfo() {
		var url = ApiService.Api45 + "/api/v1.0/Stock/GetProdOutHistory?MDCode="+$scope.ProdInfo.MdCode;
		DataService.get(url).then(function(res) {
			mui.hideLoading();
			if(res.length == 0)
				return;
			else
				$scope.OutCust.IsHasOut = 1;
			//如果扫码产品的生产企业ID与当前用户所在企业ID相同，则显示第一次出库信息和最后一次出库信息
			if($scope.ProdInfo.CompID == $scope.user.CompID) {
				$scope.OutCust.FirstCust = res[0];
				if(res.length > 1) {
					$scope.OutCust.LastCust = res[res.length - 1];
				}
			}
		}, function(e) {
			mui.hideLoading();
		})
	}



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

			this.controler.add();

			this.getLocation();

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
		getLocation: function(callback) {
			UtilsService.getLocation().then(function(res) {
				var point = new BMap.Point(res.lng, res.lat);
				var myIcon = new BMap.Icon("https://api.map.baidu.com/images/geolocation-control/point/position-icon-14x14.png", new BMap.Size(14, 14))
				var marker = new BMap.Marker(point, {
					icon: myIcon
				});

				bMap.location.marker = marker;
				bMap.map.addOverlay(marker);

				getFaultData();

				typeof(callback) == "function" && callback();
			}, function() {

			});
		},
		renderMarker: function(mapLng, mapLat) {
			var point = new BMap.Point(mapLng, mapLat);
			var marker = new BMap.Marker(point);
			bMap.map.addOverlay(marker);

			var polyline = new BMap.Polyline([this.location.marker.point, point], {
				strokeColor: "blue",
				strokeWeight: 2,
				strokeOpacity: 0.7
			}); //定义折线
			bMap.map.addOverlay(polyline); //添加折线到地图上

			setTimeout(function() {
				var viewPort = bMap.map.getViewport(polyline.getBounds());
				bMap.map.setViewport(viewPort);
			}, 200)
		}
	};

	// bMap.init();

}]);

app.filter("getScanTime", function() {
	return function(date) {
		return GetDate(date, true, true);
	}
});

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});