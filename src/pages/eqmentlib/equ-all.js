app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "Loading", "RPCObserver", function($scope, ApiService, DataService, Loading, RPCObserver) {
	//目录ID
	$scope.catalogID = 0;
	$scope.DirName = "";
	$scope.data = null;
	$scope.isEnd = false;
	$scope.billKey = "B23";
	//是否用于选择设备
	$scope.action = query("action");
	$scope.selectedId = query("selectedid") || 0;
	//选择目录
	$scope.selectCatalog = query("selectcatalog") || 'true';
	$scope.selectedDirs = []; //存储选中的目录对象
	$scope.selectedDirIds = []; //存储选中目录的id 用于选中
	if($scope.selectCatalog == 'true') { //预选
		$scope.selectedDirs = plus.webview.currentWebview().selectCatArr;
		$scope.selectedDirs.forEach(function(item) {
			$scope.selectedDirIds.push(item.ID);
		})
	}
	//设备数据类型
	var equListType = query("type");
	var typeLog = {
		"dept": 2,
		"depts": 3,
		"all": 4
	}
	//目录数据
	$scope.dirData = {};
	var pageIndex = 0;
	var pageSize = 10;
	//目录
	$scope.navDirData = [{
		ID: 0,
		catalogname: "设备归类"
	}];

	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				down: {
					callback: pulldownRefresh
				},
				up: {
					auto: true,
					callback: pullupRefresh
				}
			}
		});
	})

	function pulldownRefresh() {
		pageIndex = 1;
		//获取设备目录
		getOrgList();
		//获取所有的设备信息
		getEqInfoList("down");
	}

	function pullupRefresh() {
		$scope.Network && pageIndex++;
		//获取所有的设备信息
		getEqInfoList();
	}
	var selectedCatalog;

	init();
	//loadData();

	//初始化
	function init() {
		if(!$scope.dirData.hasOwnProperty($scope.catalogID)) {
			$scope.dirData[$scope.catalogID] = null;
			Loading.show();
			//获取设备目录
			getOrgList();
		}
		selectedCatalog = {
			"ID": $scope.catalogID
		}
		RpcClient.invoke("equ-list-menus.html", "RPC_FaultSettingList", selectedCatalog);
	}

	//Android返回键返回上级目录
	var mui_back = mui.back;
	mui.back = function() {
		if($scope.navDirData.length > 1) {
			$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.catalogID = $scope.navDirData[$scope.navDirData.length - 1].ID;
			$scope.$apply();
			pullupReset();
			resScroll();
			$scope.data = null;
			loadData();
		} else {
			mui_back();
		}
	}

	window.canback=function(){
		if($scope.navDirData.length > 1) {
			mui.back();
		}
		else
		{
			plus.webview.currentWebview().opener().close();
		}
	};

	//数据加载
	function loadData() {
		$scope.dirData[$scope.catalogID] = null;
		Loading.show();
		//获取设备目录
		getOrgList();
		//获取所有的设备信息
		getEqInfoList();

		selectedCatalog = {
			"ID": $scope.catalogID,
			"catalogname": $scope.navDirData[$scope.navDirData.length - 1].catalogname,
			"ParDirID": $scope.navDirData[$scope.navDirData.length - 1].ParDirID
		}
		RpcClient.invoke("equ-list-menus.html", "RPC_FaultSettingList", selectedCatalog);
		if(mui.os.ios) {
			mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
		}
	}

	//获取设备目录
	function getOrgList() {
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoDirList?parDirId=" + $scope.catalogID;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.dirData[$scope.catalogID] = res;
			}
		})
	}

	//获取所有的设备信息
	function getEqInfoList(type) {
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoList?pageIndex=" + pageIndex + "&pageSize=" + pageSize + "&catalogId=" + $scope.catalogID + "&authType=" + typeLog[equListType];
		DataService.get(url).then(function(res) {
			$scope.Network = true;
			Loading.hide();
			if(res) {
				if(type == "down") {
					$scope.data = null;
				}
				$scope.isLoad = true;
				$scope.data == null && ($scope.data = []);
				$scope.data = $scope.data.concat(res.DataRows);
				$scope.isEnd = $scope.data.length >= res.TotalCount;
				if(mui("#pullrefresh").pullRefresh()) {
					if(type == "down") {
						mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
						mui('#pullrefresh').pullRefresh().refresh(true);
						mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
					} else {
						mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
					}
				}
				hideUpData();
			}
		}, function(error) {
			$scope.Network = false;
			$scope.isLoad = true;
			if($scope.data == null) {
				$scope.data = [];
			}
			if(mui("#pullrefresh").pullRefresh()) {
				mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
			}
			hideUpData();
		})
	}
	//当数据为空时，隐藏上拉的提示
	function hideUpData() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			if($scope.data.length == 0) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
	}

	//点击导航目录
	mui("#res-slide").on("tap", ".mui-control-item", function() {
		var catalogid = this.getAttribute("catalogid");
		var index = this.getAttribute("index");
		if(catalogid == $scope.catalogID) return;
		$scope.catalogID = catalogid;
		$scope.navDirData = $scope.navDirData.filter(function(_item, _index) {
			return _index <= parseInt(index);
		});
		$scope.$apply();

		pageIndex = 1;
		$scope.data = null;
		Loading.show();

		pullupReset();
		resScroll();
		loadData();
		selectedCatalog = {
			"ID": $scope.catalogID,
			"catalogname": this.getAttribute("catalogname"),
			"ParDirID": this.getAttribute("pardirid")
		};
		RpcClient.invoke("equ-list-menus.html", "RPC_FaultSettingList", selectedCatalog);
	})

	//点击目录
	mui(".data-group").on("tap", ".dir-row", function(e) {
		e.stopPropagation();
		var catalogid = this.getAttribute("catalogid");
		var flag = $scope.selectedDirIds.toString().split(",").some(function(item) {
			return item == catalogid;
		});
		if(flag) {
			return;
		}
		$scope.catalogID = catalogid;
		selectedCatalog = {
			"ID": catalogid,
			"catalogname": this.getAttribute("catalogname"),
			"ParDirID": this.getAttribute("pardirid")
		}
		Loading.show();
		$scope.data = null;
		pageIndex = 1;

		$scope.navDirData.push(selectedCatalog);
		resScroll();
		pullupReset();

		loadData();
		RpcClient.invoke("equ-list-menus.html", "RPC_FaultSettingList", selectedCatalog);
	})

	//点击目录和导航时重置pullrefresh
	function pullupReset() {
		if(mui("#pullrefresh").pullRefresh()) {
			mui('#pullrefresh').pullRefresh().refresh(true);
			if(mui.os.ios) {
				mui('#pullrefresh').pullRefresh().scrollTo(0, 0, 0);
			}
		}
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
			tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
		}
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

	//删除设备目录
	RPCObserver.on('refresh_equ_dir_del', 'refresh_equ_dir_del');
	window.refresh_equ_dir_del = function(params) {
		if($scope.catalogID == params.id) {
			var item = document.querySelectorAll(".mui-control-item");
			mui.trigger(item[item.length - 2], "tap");
			//$scope.navDirData.splice($scope.navDirData.length - 1, 1);
			$scope.catalogID = $scope.navDirData[$scope.navDirData.length - 1].ID;
			$scope.$apply();
		}
		getOrgList();
	};

	//修改设备目录
	RPCObserver.on('refresh_equ_dir_edit', 'refresh_equ_dir_edit');
	window.refresh_equ_dir_edit = function(params) {
		($scope.navDirData[$scope.navDirData.length - 1].ID == params.id) && ($scope.navDirData[$scope.navDirData.length - 1].catalogname = params.name);
		(selectedCatalog.ID = params.id) && (selectedCatalog.catalogname = params.name)
		$scope.$apply();
	};

	//选择 选择目录
	if($scope.action == 'select') {
		mui(".data-group").on("tap", ".spanchoose", function(e) {
			var dirIndex = parseInt(this.getAttribute("index"));
			var dir = $scope.dirData[$scope.catalogID][dirIndex];
			var index = $scope.selectedDirIds.indexOf(dir.ID);
			if(index >= 0) {
				//反选
				$scope.selectedDirIds.splice(index, 1);
				$scope.selectedDirs.splice(index, 1);
			} else {
				$scope.selectedDirIds.push(dir.ID);
				$scope.selectedDirs.push(dir);
			}
			$scope.$apply();
			RPCObserver.broadcast("RPC_FaultCatSelectInfo", $scope.selectedDirs);
		})
	}

	//设备目录
	RPCObserver.on('refresh_equ_dir', 'refresh_equ_dir');
	window.refresh_equ_dir = getOrgList;

	//刷新设备
	RPCObserver.on('refresh_equ_list', 'refresh_equ_list');
	window.refresh_equ_list = reload;

	function reload() {
		mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().refresh(true);
		$scope.data = null;
		pageIndex = 1;
		loadData();
	};

	RpcServer.expose("RPC_GetSelectCatalog", function(params, callback) {
		callback(selectedCatalog);

	})
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});