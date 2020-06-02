app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "Loading", "RPCObserver", "UtilsService", "CacheService", "ChatUserService", function ($scope, ApiService, DataService, Loading, RPCObserver, UtilsService, CacheService, ChatUserService) {

	var curView = plus.webview.currentWebview();
	var parentView = curView.opener();
	//目录ID
	$scope.catalogID = 0;
	$scope.DirName = "";
	$scope.data = null;
	$scope.isEnd = false;

	//目录数据
	$scope.dirData = {};
	var pageIndex = 1;
	var pageSize = 10;

	$scope.selectObj = [];
	$scope.selectedIds = [];

	$scope.offcieView = offcieView;
	$scope.videoView = videoView;
	$scope.imgView = imgView;


	$scope.ApiDown = ApiService.Down;

	var curUser = CacheService.get("user");
	$scope.isLoad=true;

	//选择
	$scope.action = query("action") || "";
	$scope.selectedId = query("id") || 0;
	//目录
	$scope.navDirData = [{
		ID: 0,
		catalogname: "全部"
	}];


	$scope.save = function () {
		parentView.evalJS(curView.callback+"('"+JSON.stringify($scope.navDirData[$scope.navDirData.length-1])+"')");
		curView.close();
	};


	init();

	//初始化
	function init() {
		if (!$scope.dirData.hasOwnProperty($scope.catalogID)) {
			$scope.dirData[$scope.catalogID] = null;
			//获取设备目录
			getDirList();
		}
		selectedCatalog = {
			"ID": $scope.catalogID
		}
	}

	//Android返回键返回上级目录
	var mui_back = mui.back;
	mui.back = function () {
		if ($scope.navDirData.length > 1) {
			$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.catalogID = $scope.navDirData[$scope.navDirData.length - 1].ID;
			$scope.$apply();
			resScroll();
			loadData();
		} else {
			mui_back();
		}
	}

	window.canback = function () {
		if ($scope.navDirData.length > 1) {
			mui.back();
		} else {
			var listView = plus.webview.getWebviewById("md-selected-list.html");
			listView && (listView.close("none"));
			parentView.close();
		}
	};

	//数据加载
	function loadData() {
		//获取设备目录
		getDirList();
	}

	//获取设备目录
	function getDirList() {
		mui.showLoading("正在加载","div");
		var url = ApiService.Pan + "/api/v1/DriveDir/GetChildDirveDirList?pid=" + $scope.catalogID;
		DataService.get(url).then(function (res) {
			mui.hideLoading();
			if (res) {
				$scope.dirData[$scope.catalogID] = res;
			}
		},function(){
			mui.hideLoading();
		})
	}


	//点击导航目录
	mui("#res-slide").on("tap", ".mui-control-item", function () {
		var catalogid = this.getAttribute("catalogid");
		var index = this.getAttribute("index");
		if (catalogid == $scope.catalogID) return;
		$scope.catalogID = catalogid;
		$scope.navDirData = $scope.navDirData.filter(function (_item, _index) {
			return _index <= parseInt(index);
		});
		$scope.$apply();
		resScroll();
		loadData();
	})

	//点击目录
	mui(".data-group").on("tap", ".dir-row", function (e) {
		e.stopPropagation();
		var catalogid = this.getAttribute("catalogid");
		$scope.catalogID = catalogid;
		selectedCatalog = {
			"ID": catalogid,
			"catalogname": this.getAttribute("catalogname"),
			"ParDirID": this.getAttribute("pardirid"),
			"path": this.getAttribute("path")
		}
	
		$scope.navDirData.push(selectedCatalog);
		resScroll();

		loadData();
	})


	//导航栏滚动事件
	function resScroll() {
		setTimeout(function () {
			var width = mui("#res-slide")[0].clientWidth;
			var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
			scrollto = 0;
			if ((scrollWidth + 35) < width || width == 0) {
				scrollto = 0;
			} else {
				scrollto = width - scrollWidth - 24;
			}
			mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
		}, 100);
	}
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});