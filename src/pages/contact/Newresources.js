app.controller("NewResourcesController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "AuthService","RPCObserver", function ($scope, ApiService, DataService, UtilsService, Loading, AuthService,RPCObserver) {
	//部门id
	$scope.OrgID = 0;
	//页面数据
	$scope.data = {};
	//目录
	$scope.navDirData = [{
		ID: 0,
		OrgName: "资源"
	}];
	var resType = query("resType");
	//无网络或请求失败重试,或已删除
	$scope.retryModal = {
		msg: "资源",
		retry: init,
		state: ''
	}
	$scope.ios = !mui.os.android;
	init();

	function init() {
		$scope.retryModal.state = isNetWorkCanUse() ? '' : '1';
		AuthService.getAuth().then(function (user) {
			!$scope.isLoad && ($scope.data = {});
			loadData();
		});
	}

	//Android返回键返回上级目录
	var mui_back = mui.back;
	mui.back = function () {
		if ($scope.navDirData.length > 1) {
			$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.OrgID = $scope.navDirData[$scope.navDirData.length - 1].ID;
			$scope.$apply();
			resScroll();
			loadData();
		} else {
			mui_back();
		}
	}

	function loadData() {

		if (!$scope.data[$scope.OrgID]) {
			$scope.data[$scope.OrgID] = {
				deps: null,
				users: null
			};
		}


		Loading.show();
		if (!$scope.data[$scope.OrgID].deps) {
			//获取企业组织架构
			resGroupLayerList();
		}
		if (!$scope.data[$scope.OrgID].users) {
			//根据组织机构获取用户
			getUserListByOrgId();
			setTimeout(function(){
				getUserListdtByOrgId()
			},500)
		}

		if ($scope.data[$scope.OrgID].deps && $scope.data[$scope.OrgID].users){
			Loading.hide();
		}
	};

	function resGroupLayerList() {
		var url = ApiService.Api50 + "/api/v1/Resource/ResGroupLayerList_Comp?pId=" + $scope.OrgID;
		DataService.get(url).then(function (res) {
			if (res) {
				$scope.data[$scope.OrgID].deps = res;

				$scope.isLoad = true;
				 
				$scope.data[$scope.OrgID].users && ($scope.retryModal.state = '') && (Loading.hide());
			}
		},function(error){
			$scope.isLoad = true;
			Loading.hide();
			$scope.retryModal.state = error.State;
		})
	}
	//根据资源获取用户
	function getUserListByOrgId() {
		var url = ApiService.Api50 + "/api/v1/Resource/ResourceList?groupId=" + $scope.OrgID + "&resType=" + resType + "&pageSize=9999";
		DataService.get(url).then(function (res) {
			if (res) {
				Loading.hide();
				$scope.isLoad = true;
				$scope.data[$scope.OrgID].users = res;
				
				$scope.data[$scope.OrgID].deps &&($scope.retryModal.state = '') && (Loading.hide());
			}
		}, function (error) {
			$scope.isLoad = true;
			Loading.hide();
			$scope.retryModal.state = error.State;
		})
	}
	//根据资源获取用户
	function getUserListdtByOrgId() {
		var url = ApiService.Api64 + "/api/v1/Resource/GetCompResourceList?groupId=" + $scope.OrgID
		DataService.get(url).then(function (res) {
			if (res) {
				Loading.hide();
				$scope.isLoad = true;
				if($scope.data[$scope.OrgID].users){
					$scope.data[$scope.OrgID].users.resList= res;
				}
				
				
//				$scope.data[$scope.OrgID].deps &&($scope.retryModal.state = '') && (Loading.hide());
			}
		}, function (error) {
			$scope.isLoad = true;
			Loading.hide();
			$scope.retryModal.state = error.State;
		})
	}
	RPCObserver.on('refresh_read_list','refresh_read_list')
				window.refresh_read_list=function(){
					
					getUserListdtByOrgId()
					$scope.$apply()
				}
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

	//点击导航目录
	mui("#res-slide").on("tap", ".mui-control-item", function () {
		var orgid = this.getAttribute("orgid");
		var index = this.getAttribute("index");
		if (orgid == $scope.OrgID) return;
		$scope.OrgID = orgid;
		var _data = $scope.data[orgid];

		if ($scope.retryModal.state != '' && _data && (_data.deps && _data.users )) {
			$scope.retryModal.state = '';
		}
		Loading.hide();
		
		$scope.navDirData = $scope.navDirData.filter(function (_item, _index) {
			return _index <= parseInt(index);
		});
		$scope.$apply();
		resScroll();
		loadData();
	})

	//点击目录
	$scope.clickDir = function (orgid, orgname) {
		$scope.OrgID = orgid;
		var selectedOrg = {
			"ID": orgid,
			"OrgName": orgname
		}
		$scope.navDirData.push(selectedOrg);
		resScroll();
		loadData();
	}

	$scope.doSearchUser = function () {
		UtilsService.openWindow({
			id: "search-resource.html",
			url: "search-resource.html",
			extras: {
				resType: resType
			}
		});
	}
	//刷新列表信息
	RpcServer.expose("RPC_ContactOrgRefresh", function (params) {
		//清空数据列表
		$scope.isLoad=false;
		init();
	});
	RpcServer.expose("RPC_RefreshResource", function (params) {
		$scope.OrgID = 0;
		$scope.navDirData = [{
			ID: 0,
			OrgName: "资源"
		}];
		$scope.isLoad=false;
		init();
	});
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});