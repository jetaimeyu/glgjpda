app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "UtilsService", "CacheService", "Loading", "RPCObserver", "$filter", function($scope, ApiService, DataService, UtilsService, CacheService, Loading, RPCObserver, $filter) {
	var user = CacheService.get('user');
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
	$scope.view = "view";
	$scope.IsShowOrg = $filter("hasAuth")(['Q0']);
	loadData();
	//Android返回键返回上级目录
	var mui_back = mui.back;
	$scope.mui_back = mui.back;
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
				users: null
			};
			Loading.show();
			//获取企业组织架构
			getOrgList();
			//根据组织机构获取用户
			getUserListByOrgId();
		}
	}

	//获取企业组织架构
	function getOrgList() {
		var url = ApiService.Api50 + "/api/v1/Org/GetOrgList?parentId=" + $scope.OrgID;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.data[$scope.OrgID].deps = res;
				$scope.isLoad = true;
			}
		}, function(e) {
			$scope.isLoad = true;
		})
	}

	//根据组织机构获取用户
	function getUserListByOrgId() {
		var url = ApiService.Api50 + "/api/v1/Org/GetUserListByOrgId?orgId=" + $scope.OrgID;
		DataService.get(url).then(function(res) {
			if(res) {
				Loading.hide();
				$scope.data[$scope.OrgID].users = res;
			}
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
	$scope.clickDir = function(orgid, orgname, personNums, IsChild) {
		$scope.OrgID = orgid;
		var selectedOrg = {
			"ID": orgid,
			"OrgName": orgname,
			"OrgPersonNums": personNums,
			"IsChild": IsChild
		}
		$scope.navDirData.push(selectedOrg);
		resScroll();
		loadData();
	}

	$scope.doSearchUser = function() {
		UtilsService.openWindow({
			id: "search-user.html",
			url: "../contact/search-user.html?fromType=work"
		});
	}
	//弹窗
	$scope.tap = function(key) {
		mui('#popover').popover('hide');
		switch(key) {
			case 'addperson':
				UtilsService.openWindow({
					id: "add-staff.html",
					url: "add-staff.html",
					extras: {
						navDirData: $scope.navDirData
					}
				});
				break;
			case 'adddept':
				// mui("#adpopover").popover("toggle");
				// document.getElementById("deptname").innerText = "";
				// document.getElementById("deptname").focus();
				UtilsService.openWindow({
					id: "org-setting.html",
					url: "org-setting.html?type=add",
					extras: {
						navDirData: $scope.navDirData
					}
				});
				break;
			case 'deptsetting':

				UtilsService.openWindow({
					id: "org-setting.html",
					url: "org-setting.html?type=edit",
					extras: {
						navDirData: $scope.navDirData
					}
				});
				break;
			case "concerned":
				//跳转关怀商城，传递当前部门所有人员信息
				var url = ApiService.Mall+"/Mobile/LoginApi/login?oauth=maidiyun&maidiyunToken="+user.Token+"&orgID="+$scope.OrgID;
				openUrl(url,"关怀一下");
				break;
			default:
				break;
		}
	};
	//添加子部门确认
	$scope.addDept = function() {
		var dname = document.getElementById("deptname").innerText.trim();
		if(!dname) {
			mui.toast("请输入子部门名称");
			return;
		}
		//验证所填字符长度
		if(!checkLengthUtil.check()) {
			Loading.hide();
			return false;
		}

		var postdata = {
			"ID": 0,
			"ParID": $scope.OrgID,
			"OrgName": dname,
		}
		var url = ApiService.Api50 + "/api/v1/Org/SaveOrgInfo";
		DataService.post(url, postdata).then(function(res) {
			mui("#adpopover").popover("toggle");
			//新增
			var obj = {
				"ID": res,
				"ParID": $scope.OrgID,
				"OrgName": dname,
				"OrgPersonNums": 0,
				"IsChild": 0
			}
			if($scope.data[$scope.OrgID].deps) {
				$scope.data[$scope.OrgID].deps.push(obj);
			} else {
				$scope.data[$scope.OrgID].deps = [obj];
			}
			mui.toast("添加成功");
			document.getElementById("deptname").innerText = "";
			document.getElementById("deptname").blur();
			mui('#popover').popover('hide');
			//刷新联系人页签组织建构
			RpcClient.invoke("contactWind", "RPC_ContactOrgRefresh");
		}, function(error) {});
	};
	//刷新用户信息
	RpcServer.expose("RPC_RefreshUserInfo", function(params) {
		params && (document.querySelector(".avatar").src = params);
		//清空数据列表
		$scope.data = {};
		loadData();
		$scope.$apply();
	});

	//删除 用户的rpc
	RpcServer.expose("RPC_OrgDelectInfo", function(params) {
		if(params.id) {
			var item = $scope.data[$scope.OrgID].users.find(function(item) {
				return item.UserID == params.id;
			});
			//清空数据列表
			$scope.data = {};
			item && loadData()
		} else {
			loadData()

		}
	});
	RpcServer.expose("RPC_OrgEditOrDelInfo", function(params) {
		if(params.id && params.state == 'del') {
			$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.$apply();
			resScroll();
			//清空数据列表
			$scope.data = {};
			var temp = document.querySelectorAll("#res-slide .mui-control-item");
			mui.trigger(temp[temp.length - 1], "tap");
		} else {
			$scope.navDirData[$scope.navDirData.length - 1].OrgName = params.name;
			$scope.$apply();
			$scope.data = {};
			loadData()
		}
	});
	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function() {
		mui('#adpopover').popover('hide');
	}

}]);

mui.plusReady(function() {

	if(mui.os.android) {
		initSoftInput();
	}

	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});

var win_height;

function initSoftInput() {
	plus.webview.currentWebview().setStyle({
		softinputMode: "adjustResize"
	});

	win_height = window.innerHeight;

	window.addEventListener("resize", function() {
		var _dom = document.querySelector("#adpopover");
		var _height = window.innerHeight;
		if(_height < win_height) {
			_dom.style.top = "70%";
		} else {
			_dom.style.top = "65%";
		}
	});
}