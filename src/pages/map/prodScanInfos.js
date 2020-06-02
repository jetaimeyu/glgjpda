mui.init();

app.controller("scanInfoCtl", ["$scope", "DataService", "ApiService", "UtilsService", "$filter", "TapService", "AuthService", function ($scope, DataService, ApiService, UtilsService, $filter, TapService, AuthService) {

	$scope.domData = {
		mdCode: query("mdcode"),
		prodId: query("prodid"),
		skuId: query("skuid") || "",
		InnerCodeName: "",
		Count: query("count") || 1,
		MapLat: query("cmaplat"),
		MapLng: query("cmaplng"),
		prodInfo: "",
		scanList: null,
		pageIndex: 0,
		pageSize: 20,
		list: "",
		loadSuccess: true
	};

	AuthService.getAuth().then(function (res) {
		$scope.domData.InnerCodeName = res.InnerCodeName || '出厂编号';
	});

	$scope.getOutType = function (type) {
		var outtype = "";
		switch (type) {
			case 1:
				outtype = "企业";
				break;
			case 2:
				outtype = "经销商";
				break;
			case 3:
				outtype = "个人";
				break;
			default:
				break;
		}
		return outtype;
	};

	$scope.getDayandTime = function (date) {
		if (!date) {
			return;
		}
		var timearr = date.replace(" ", ":").replace(/\:/g, "-").split("-");
		return timearr[2] + "日" + timearr[3] + ":" + timearr[4];
	};
	$scope.getDay = function (date) {
		if (!date) {
			return;
		}
		var timearr = date.replace(" ", ":").replace(/\:/g, "-").split("-");
		return timearr[2] + "日";
	};

	$scope.event = {
		reload: function () {
			$scope.domData.loadSuccess = true;
			$scope.domData.pageIndex = 0;
			pull.pullUpLoading();
		},
		openProd: function () {

			UtilsService.openWindow({
				needLogin: true,
				id: 'prodinfo-head.html',
				url: '/src/pages/problib/prodinfo-head.html?prodId=' + $scope.domData.prodInfo.ProdID + '&SkuID=' + $scope.domData.skuId + "&MdCode=" + $scope.domData.mdCode,
				extras: {
					ProdInnerCode: $scope.domData.prodInfo.InnerCode,
					InnerCodeName: $scope.domData.InnerCodeName
				}
			});

		},
		openUser: function (data) {
			if (data.UserID > 0) {
				UtilsService.openWindow({
					needLogin: true,
					id: "personal-info.html",
					url: "../contact/personal-info.html?userId=" + data.UserID
				});
			}
		},
		openTrack: function () {
			UtilsService.openWindow({
				needLogin: true,
				id: "template.html",
				url: "template.html?key=prodTrack&mdcode=" + $scope.domData.mdCode + "&prodid=" + $scope.domData.prodInfo.ProdID + "&skuid=" + $scope.domData.prodInfo.SkuID
			});
		},
		openDebugInfo: function (id) {
			UtilsService.openWindow({
				needLogin: true,
				id: "debug-info.html",
				url: "../aftersale/debug-info.html?id=" + id
			});
		},
		openWorkOrder: function (id) {
			UtilsService.openWindow({
				needLogin: true,
				id: "mat-fault-info.html",
				url: "../aftersale/mat-fault-info.html?id=" + id
			});
		},
		openMore: function (ev) {
			ev.stopPropagation();

			UtilsService.openWindow({
				needLogin: true,
				id: "prod-scan-info-more.html",
				url: "prod-scan-info-more.html?cmaplat=" + $scope.domData.MapLat + "&cmaplng=" + $scope.domData.MapLng + "&count=" + $scope.domData.Count+"&type="+query("type")
			});
		}
	};

	var curData = {
		getProdInfo: function () {

			var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + $scope.domData.mdCode;

			DataService.get(url).then(function (res) {

				$scope.domData.prodInfo = res;
				curData.loadData();
			}, function () {
				mui.hideLoading();
				plus.nativeUI.toast("加载信息失败！");
			});
		},
		loadData: function () {
			var url = ApiService.Api45 + "/api/v1.0/Prod/GetProdRetrospectiveInfo2?MDCode=" + $scope.domData.mdCode;
			DataService.get(url).then(function (data) {
				$scope.domData.list = data;
				mui.hideLoading();
				$scope.domData.loadSuccess = true;
			}, function () {
				mui.hideLoading();
				$scope.domData.loadSuccess = true;
			})
		},
		pullupRefresh: function () {
			$scope.domData.loadSuccess && $scope.domData.pageIndex++;
			//加载数据
			curData.getScanList();
		},
		getScanList: function () {
			var url = ApiService.Api50 + "/api/v1/Prod/GetMdScanCodeListByMdCode?mdCode=" + $scope.domData.mdCode + "&pageIndex=" + $scope.domData.pageIndex + "&pageSize=" + $scope.domData.pageSize;

			DataService.get(url).then(function (res) {

				$scope.domData.scanList == null && ($scope.domData.scanList = []);
				$scope.domData.scanList = $scope.domData.scanList.concat(res.DataRows || res.Data);

				var isEnd = $scope.domData.scanList.length >= res.TotalCount;
				pull.endPullUpToRefresh(isEnd);

				curData.autoBottomTips();
			}, function () {
				plus.nativeUI.toast("加载信息失败！");
				$scope.domData.pageIndex--;
				pull.endPullUpToRefresh(true);

				$scope.domData.loadSuccess = false;
				curData.autoBottomTips();
			});

		},
		autoBottomTips: function () {
			var tip = document.querySelector(".mui-pull-bottom-tips");
			if (tip) {
				if (!$scope.domData.scanList || $scope.domData.scanList.length == 0) {
					tip.classList.add("mui-hidden");
				} else {
					tip.classList.remove("mui-hidden");
				}
			}
		}
	};

	//初始化上拉下拉

	//	var pull = mui("#pullrefresh").pullToRefresh({
	//		up: {
	//			callback: curData.pullupRefresh,
	//			show: false,
	//			auto: true
	//		}
	//	})

	curData.getProdInfo();

}]);

mui.showLoading("", "div");

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});