app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "AuthService", "$q", function($scope, ApiService, DataService, UtilsService, Loading, AuthService, $q) {
	//是否用于选择人员
	$scope.action = query("action");
	$scope.multiSelect = query("multiselect");
	$scope.must = query("must");
	$scope.isView = query("isView");
	var hideSelf = query("hideself"); //是否隐藏当前用户
	//接受已选择的人员
	$scope.selectedUsers = plus.webview.currentWebview().selectObj;
	//部门id 
	$scope.OrgID = 0;
	//页面数据
	$scope.data = {};
	//目录
	$scope.navDirData = [{
		ID: 0,
		OrgName: "组织架构"
	}];
	$scope.ios = !mui.os.android;
	var curUserID;
	AuthService.getAuth().then(function(user) {
		curUserID = user.UserID;
		loadData();
	});

	//Android返回键返回上级目录
	var mui_back = mui.back;
	mui.back = function() {
		if($scope.navDirData.length > 1) {
			$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.OrgID = $scope.navDirData[$scope.navDirData.length - 1].ID;
			$scope.$apply();
			resScroll();
			loadData();
			Loading.hide();
		} else {
			Loading.hide();
			mui_back();
		}
	}

	function loadData() {
		if(!$scope.data.hasOwnProperty($scope.OrgID)) {
			$scope.data[$scope.OrgID] = {
				deps: null,
				users: null
			};
			Loading.show();

			var url1 = ApiService.Api50 + "/api/v1/Org/GetOrgList?parentId=" + $scope.OrgID + (hideSelf === "true" ? "&isCurUser=0" : "");
			var url2 = ApiService.Api50 + "/api/v1/Org/GetUserListByOrgId?orgId=" + $scope.OrgID;
			var promises = [DataService.get(url1), DataService.get(url2)];
			$q.all(promises).then(function(res) {
				Loading.hide();
				$scope.isLoad = true;
				$scope.data[$scope.OrgID].deps = res[0];

				if(hideSelf === "true") {
					$scope.data[$scope.OrgID].users = res[1].filter(function(user) {
						return user.UserID != curUserID;
					});
				} else {
					$scope.data[$scope.OrgID].users = res[1];
				}

			})
			//获取企业组织机构
			//getOrgList();
			//根据组织机构获取用户
			//getUserListByOrgId();
		}
	}

	//获取企业组织机构
	function getOrgList() {
		var url = ApiService.Api50 + "/api/v1/Org/GetOrgList?parentId=" + $scope.OrgID + (hideSelf === "true" ? "&isCurUser=0" : "");
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.data[$scope.OrgID].deps = res;
			}
		})
	}

	//根据组织机构获取用户
	function getUserListByOrgId() {
		var url = ApiService.Api50 + "/api/v1/Org/GetUserListByOrgId?orgId=" + $scope.OrgID;
		DataService.get(url).then(function(res) {
			if(res) {
				Loading.hide();
				$scope.isLoad = true;
				if(hideSelf === "true") {
					$scope.data[$scope.OrgID].users = res.filter(function(user) {
						return user.UserID != curUserID;
					});
				} else {
					$scope.data[$scope.OrgID].users = res;
				}
			}
		});
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
			"OrgName": orgname,
		}
		$scope.navDirData.push(selectedOrg);
		resScroll();
		loadData();
	}

	$scope.doSearchUser = function() {
		//禁选择人员
		var bannedUsers = plus.webview.currentWebview().bannedUsers;
		UtilsService.openWindow({
			id: "search-user.html",
			url: "../contact/search-user.html?must=" + $scope.must,
			extras: {
				action: $scope.action,
				selectedUsers: $scope.selectedUsers,
				multiSelect: $scope.multiSelect,
				hideSelf: hideSelf,
				bannedUsers: plus.webview.currentWebview().bannedUsers,
				isView: $scope.isView
			}
		});
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});