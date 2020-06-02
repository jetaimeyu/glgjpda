app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "Loading", "RPCObserver", "UtilsService", function($scope, ApiService, DataService, Loading, RPCObserver, UtilsService) {
	
	var parentView = plus.webview.currentWebview().opener();
	//目录ID
	$scope.catalogID = 0;
	$scope.DirName = "";
	$scope.data = null;
	$scope.isEnd = false;

	//目录数据
	$scope.dirData = {};
	var pageIndex = 1;
	var pageSize = 10;

	$scope.selectObj=[];
	$scope.selectedIds=[];

	$scope.offcieView=offcieView;
	$scope.videoView = videoView;
	$scope.imgView = imgView;

	$scope.ApiDown = ApiService.Down;

	//选择
	$scope.action = query("action") || "";
	$scope.selectedId = query("id") || 0;
	//目录
	$scope.navDirData = [{
		ID: 0,
		catalogname: "全部"
	}];

	$scope.selectItem=function(item){
		if($scope.selectedIds.indexOf(item.ID)>=0)
		{
			var idx = $scope.selectedIds.indexOf(item.ID);
			$scope.selectedIds.splice(idx,1);
			$scope.selectObj.splice(idx,1);
		}
		else
		{
			$scope.selectedIds.push(item.ID);
			item.ViewName = item.FileName+item.FileExt;
			$scope.selectObj.push(item);
		}

		RPCObserver.broadcast('SyncSelectedData',$scope.selectObj);
	};

	$scope.save = function(){
		parentView.evalJS("sendYunFile("+JSON.stringify($scope.selectObj)+")")
	};


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

	$scope.view = function(item){
		var url = "yun-file-view.html";
		if($scope.videoView.indexOf(item.FileExt)>=0)
		{
			if(plus.os.name == "Android")
			{
				plus.Push.playVideo(ApiService.Down+item.FilePath, item.FileName+item.FileExt)
				return;
			}
			else{
				url = "yun-video-view.html";
			}
		}else if(item.FileExt.toLowerCase()==".pdf")
		{
			url = "yun-file-pdf.html";
		}
		UtilsService.openWindow({
			url:url,
			id:"yun-file-view.html",
			extras:{
				data:{
					FileName: item.FileName+item.FileExt,
					FileUrl: ApiService.Down+item.FilePath
				}
			}
		});
	};
	$scope.send = function(data){
		parentView.evalJS("sendYunFile("+JSON.stringify(data)+")")
	};

	function pulldownRefresh() {
		pageIndex = 1;
		//获取设备目录
		getDirList();
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

	//初始化
	function init() {
		if(!$scope.dirData.hasOwnProperty($scope.catalogID)) {
			$scope.dirData[$scope.catalogID] = null;
			Loading.show();
			//获取设备目录
			getDirList();
		}
		selectedCatalog = {
			"ID": $scope.catalogID
		}
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

	window.canback = function(){
		if($scope.navDirData.length > 1) {
			mui.back();
		}
		else{
			var listView = plus.webview.getWebviewById("md-selected-list.html");
			listView && (listView.close("none"));
			parentView.close();
		}
	};

	//数据加载
	function loadData() {
		$scope.dirData[$scope.catalogID] = null;
		Loading.show();
		//获取设备目录
		getDirList();
		//获取所有的设备信息
		getEqInfoList();

		selectedCatalog = {
			"ID": $scope.catalogID,
			"catalogname": $scope.navDirData[$scope.navDirData.length - 1].catalogname,
			"ParDirID": $scope.navDirData[$scope.navDirData.length - 1].ParDirID,
			"path": $scope.navDirData[$scope.navDirData.length - 1].path,
		}

		RpcClient.invoke("menu-prod.html","RPC_cur_dir",selectedCatalog);
		if(mui.os.ios) {
			mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
		}
	}

	//获取设备目录
	function getDirList() {
		var url = ApiService.Pan + "/api/v1/DriveDir/GetChildDirveDirList?pid=" + $scope.catalogID;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.dirData[$scope.catalogID] = res;
			}
		})
	}


	$scope.openInfo=function(prod){
		UtilsService.openWindow({
			needLogin: true,
			id: 'prodinfo-head.html',
			url: '../problib/prodinfo-head.html?prodId=' + prod.ProdID
		});
	};

	//获取所有的设备信息
	function getEqInfoList(type) {
		var url = ApiService.Pan + "/api/v1/DriveAttach/GetPageDriveAttachList?pageIndex=" + pageIndex + "&pageSize=" + pageSize + "&dirId=" + $scope.catalogID;
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

				setTimeout(function(){
					previewImages();
				}, 200);
				
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
			"ParDirID": this.getAttribute("pardirid"),
			"path": this.getAttribute("path")
		};
		RpcClient.invoke("menu-prod.html","RPC_cur_dir",selectedCatalog);
	})

	//点击目录
	mui(".data-group").on("tap", ".dir-row", function(e) {
		e.stopPropagation();
		var catalogid = this.getAttribute("catalogid");
		$scope.catalogID = catalogid;
		selectedCatalog = {
			"ID": catalogid,
			"catalogname": this.getAttribute("catalogname"),
			"ParDirID": this.getAttribute("pardirid"),
			"path": this.getAttribute("path")
		}
		Loading.show();
		$scope.data = null;
		pageIndex = 1;

		$scope.navDirData.push(selectedCatalog);
		resScroll();
		pullupReset();

		loadData();
		RpcClient.invoke("menu-prod.html","RPC_cur_dir",selectedCatalog);
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

	//设备目录
	RPCObserver.on('refresh_prod_dir', 'refresh_prod_dir');
	window.refresh_prod_dir = getDirList;

	RPCObserver.on('SyncFileSelectedData', 'SyncFileSelectedData');
	window.SyncFileSelectedData = function(data){
		$scope.selectObj = data;
		$scope.selectedIds = data.map(function(item){
			return item.ID;
		});
		$scope.$apply();
	};

	RPCObserver.on('refresh_prodDir_back', 'refresh_prodDir_back');
	window.refresh_prodDir_back = function(){
		mui.back();
	}

	RPCObserver.on('refresh_prod_dir_name', 'refresh_prod_dir_name');
	window.refresh_prod_dir_name = function(name){
		$scope.navDirData[$scope.navDirData.length-1].catalogname = name;
		$scope.$apply();
	}

	//刷新设备
	RPCObserver.on('refresh_prod_list', 'refresh_prod_list');
	window.refresh_prod_list = reload;

	function reload() {
		mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().refresh(true);
		$scope.data = null;
		pageIndex = 1;
		loadData();
	};

	RpcServer.expose("RPC_GetSelectCatalog", function(params, callback) {
		callback(selectedCatalog);
	})

	$scope.accessRecord = function(id) {
		UtilsService.openWindow({
			needLogin: true,
			id: "equ-warehouse-record.html",
			url: "equ-warehouse-record.html?id=" + id
		});
	}
	$scope.commissioning = function(equinfo) {
		UtilsService.openWindow({
			needLogin: true,
			id: "equ-commissioning.html",
			url: "equ-commissioning.html",
			extras: {
				equInfo: equinfo
			}
		});
	}
	$scope.equSelect = function(equ) {
		if($scope.action == 'select') {
			if($scope.selectedId == equ.ID) return;
			$scope.selectedId = equ.ID;
			var view = plus.webview.currentWebview().opener();
			var opener = view.opener();
			if(view.callback) {
				opener.evalJS(view.callback + "(" + JSON.stringify(equ) + ")");
			}
			mui_back();
		}
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});