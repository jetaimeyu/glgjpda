app.controller("NewprodLibraryListController", ["$scope", "ApiService", "AuthService", "DataService", "UtilsService", "Loading", "AuthService", function($scope, ApiService, AuthService, DataService, UtilsService, Loading, AuthService) {
	AuthService.getAuth().then(function(user) {});

	$scope.isall = query("isall");
	$scope.state = query("state");
	var Type = query("type");
	//部门id
	$scope.OrgID = 0;
	$scope.SortID = "";
	//页面数据
	$scope.data = {};
	//目录
	if(Type == 1) {
		$scope.navDirData = [{
			ID: 0,
			OrgName: "产品"
		}];
	} else {
		$scope.navDirData = [{
			ID: 0,
			OrgName: "零配件"
		}];
	}
	//选择
	$scope.selectObj = {};
	if($scope.state == "selsku") {
		$scope.selectObj = plus.webview.currentWebview().selectObj;
	}
	//无网络或请求失败重试,或已删除
	$scope.retryModal = {
		msg: "产品",
		retry: init,
		state: ''
	}
	$scope.ios = !mui.os.android;
	init();

	function init() {
		AuthService.getAuth().then(function(user) {
			$scope.compId = user.CompID
			$scope.data = {};
			user.CompID > 0 && loadData();
			if(user.CompID == 0) {
				$scope.data = null;
				$scope.isLoad = true;
			}
		});
	}

	//Android返回键返回上级目录
	var mui_back = mui.back;
	mui.back = function() {
		if($scope.navDirData.length > 1) {
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
		if(!$scope.data.hasOwnProperty($scope.OrgID)) {
			$scope.data[$scope.OrgID] = {
				deps: null,
				prods: null
			};
			Loading.show();
			$scope.pageIndex = 1;
			//获取企业产品目录
			getCompDir();
			//获取企业产品
			//getMdtPagedPkgInfoList();
			if(mui("#pullrefresh").pullRefresh()) {
				mui('#pullrefresh').pullRefresh().refresh(true); //重置上拉		
				//根据组织机构获取用户						
				getMdtPagedPkgInfoList();
			}
		}
	};
	//获取企业产品目录
	function getCompDir() {
		var url = ApiService.Api50 + "/api/v1/Prod/GetProdGroup?compId=" + $scope.compId + "&DirID=" + $scope.OrgID;
		DataService.get(url).then(function(res) {
			//$scope.isLoad = true
			if(res) {
				$scope.data[$scope.OrgID].deps = res;
			}
		})
	}
	var isEnd = false;
	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: "#pullrefresh",
				up: {
					callback: pullupRefresh,
					auto: true,
				}
			}
		});
	})
	$scope.pageIndex = 1;
	$scope.pageSize = 10;
	var isAddPage = false;

	function pullupRefresh() {
		isAddPage && $scope.pageIndex++;
		getMdtPagedPkgInfoList()
	}
	//获取企业产品
	function getMdtPagedPkgInfoList() {
		var url = ApiService.Api50 + "/api/v1/Prod/GetMdtPagedPkgInfoList?sId=" + $scope.OrgID + "&type=" + Type + '&pageIndex=' + $scope.pageIndex + '&pageSize=' + $scope.pageSize;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.retryModal.state = '';
				Loading.hide();
				$scope.isLoad = true;
				isAddPage = true;
				 $scope.data[$scope.OrgID].prods == null && ($scope.data[$scope.OrgID].prods = []);
				$scope.data[$scope.OrgID].prods =$scope.data[$scope.OrgID].prods.concat(res.DataRows); 
				isEnd = $scope.data[$scope.OrgID].prods.length >= res.TotalCount;
				if(mui("#pullrefresh").pullRefresh()) {
					//mui('#refreshWork').pullRefresh().refresh(true);//重置上拉
					mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);

				}
				hideUpData();
			}
		}, function(error) {
			$scope.isLoad = true;
			hideUpData();
			$scope.retryModal.state = error.State;
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		})
	}
	//导航栏滚动事件
	function resScroll() {
		setTimeout(function() {
			var width = mui("#res-slide")[0].clientWidth;
			var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
			scrollto = 0;
			if((scrollWidth + 35) < width || width == 0) {
				scrollto = 0;
			} else {
				scrollto = width - scrollWidth - 24;
			}
			mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
		}, 100);
	}

	//点击导航目录
	mui("#res-slide").on("tap", ".mui-control-item", function() {
		var orgid = this.getAttribute("orgid");
		var index = this.getAttribute("index");
		if(orgid == $scope.OrgID) return;
		$scope.OrgID = orgid;
		$scope.navDirData = $scope.navDirData.filter(function(_item, _index) {
			return _index <= parseInt(index);
		});
		$scope.$apply();
		resScroll();
		loadData();
	})

	//点击目录
	$scope.clickDir = function(orgid, orgname) {
		$scope.OrgID = orgid;
		var selectedOrg = {
			"ID": orgid,
			"OrgName": orgname
		}
		$scope.navDirData.push(selectedOrg);
		resScroll();
		loadData();
	}
	//当数据为空时，隐藏上拉的提示
	function hideUpData() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			if($scope.OrgID&&$scope.data[$scope.OrgID].prods.length==0 || $scope.data.length == 0||($scope.data[0].prods.length==0&&$scope.data[0].deps.ChildDir.length==0)) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
	}
	//	//刷新列表信息
	//	RpcServer.expose("RPC_ContactOrgRefresh", function(params) {
	//		//清空数据列表
	//		init();
	//	});
	//	RpcServer.expose("RPC_RefreshResource", function(params) {
	//		$scope.OrgID = 0;
	//		$scope.navDirData = [{
	//			ID: 0,
	//			OrgName: "资源"
	//		}];
	//		init();
	//	});
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});