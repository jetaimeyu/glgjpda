app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "Loading", "RPCObserver", "UtilsService", "CacheService", "ChatUserService", "$q", function ($scope, ApiService, DataService, Loading, RPCObserver, UtilsService, CacheService, ChatUserService, $q) {

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

	$scope.selectObj = [];
	$scope.selectedIds = [];

	$scope.offcieView = offcieView;
	$scope.videoView = videoView;
	$scope.imgView = imgView;


	$scope.ApiDown = ApiService.Down;

	var curUser = CacheService.get("user");

	$scope.dirSetting = function (type) {
		UtilsService.openWindow({
			url: "yun-file-dir.html?type=" + type,
			id: "yun-file-dir.html",
			extras: {
				parentData: $scope.navDirData[$scope.navDirData.length - (type == 'add' ? 1 : 2)],
				callback: "addDirBack",
				curData: $scope.navDirData[$scope.navDirData.length - 1]
			}
		});
		mui('#popover').popover('hide');
	};

	window.addDirBack = function (type, name) {
		if (type == "del") {
			mui.back();
		} else if (type == "edit") {
			$scope.navDirData[$scope.navDirData.length - 1].catalogname = name;
			$scope.$apply();
		} else {
			getDirList();
		}
	}

	//选择
	$scope.action = query("action") || "";
	$scope.selectedId = query("id") || 0;
	//目录
	$scope.navDirData = [{
		ID: 0,
		catalogname: "全部"
	}];

	$scope.selectItem = function (item) {
		if ($scope.selectedIds.indexOf(item.ID) >= 0) {
			var idx = $scope.selectedIds.indexOf(item.ID);
			$scope.selectedIds.splice(idx, 1);
			$scope.selectObj.splice(idx, 1);
		} else {
			$scope.selectedIds.push(item.ID);
			item.ViewName = item.FileName + item.FileExt;
			$scope.selectObj.push(item);
		}

		RPCObserver.broadcast('SyncSelectedData', $scope.selectObj);
	};

	$scope.save = function () {
		UtilsService.openWindow({
			id: "contact-select.html",
			url: "../common/contact-select.html?action=select&multiselect=false&isGroup=true",
			extras: {
				selectObj: [],
				callback: "forwardback"
			}
		});
	};

	$scope.editMore = function () {
		if ($scope.selectedIds.length == 0) {
			mui.toast("请选择您要编辑的数据！");
			return;
		}
		mui('#sheet2').popover('toggle');
	};

	window.forwardback = function (res) {

		if ($scope.selectObj.length == 0) {
			mui.toast("请选择您要发送的云文件！");
			return;
		}

		$scope.selectObj.forEach(function (file) {

			var imgKey = transMessage.getImgKey(file.FileExt);

			res.forEach(function (user) {
				var content = {};
				var type = 7;
				if (imgView.indexOf(file.FileExt) >= 0) {
					content = $scope.ApiDown + file.FilePath;
					type = 4;
				} else {
					content = {
						eventName: "mddrive",
						logo: ApiService.Down + '/chat/' + imgKey + '.png',
						title: file.ViewName,
						desc: "",
						params: [file.FilePath, file.FileSize, file.FileGuid]
					};
				}

				if (user.GroupCode) {
					ChatUserService.sendGroup({
						GroupCode: user.UserID,
						GroupName: user.ViewName,
						GroupID: user.GroupID,
						content: content,
						type: type
					});
				} else {
					ChatUserService.send({
						chatId: user.UserID,
						chatName: user.ViewName,
						chatCompId: user.CompID,
						hasLogo: curUser.ULogoIsExist,
						chatLogo: user.ULogoIsExist,
						type: type,
						content: content
					});
				}
			});
		});
	}


	setTimeout(function () {
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

	$scope.view = function (item, event) {
		event.stopPropagation();
		var url = "../message/yun-file-view.html";
		if ($scope.videoView.indexOf(item.FileExt) >= 0) {
			if (plus.os.name == "Android") {
				plus.Push.playVideo(ApiService.Down + item.FilePath, item.FileName + item.FileExt)
				return;
			} else {
				url = "../message/yun-video-view.html";
			}
		} else if (item.FileExt.toLowerCase() == ".pdf") {
			url = "../message/yun-file-pdf.html";
		}
		UtilsService.openWindow({
			url: url,
			id: "yun-file-view.html",
			extras: {
				data: {
					FileName: item.FileName + item.FileExt,
					FileUrl: ApiService.Down + item.FilePath
				}
			}
		});
	};
	$scope.send = function (data) {
		parentView.evalJS("sendYunFile(" + JSON.stringify(data) + ")")
	};
	$scope.activeData = "";
	$scope.edit = function (data, event) {
		event.stopPropagation();
		$scope.activeData = data;
		mui('#sheet1').popover('toggle');


	};


	$scope.delFiel = function (isDel, type) {
		if (type == "more") {
			mui('#sheet2').popover('toggle');
		} else {
			mui('#sheet1').popover('toggle');
		}
		mui.confirm(isDel == 0 ? "确认删除吗？删除后可在回收站中恢复！" : "确认删除吗？删除后不可恢复！", function (e) {
			if (e.index == 0) {
				mui.showLoading("正在删除", "div");
				if (type != "more") {

					var url = ApiService.Pan + "/api/v1/DriveAttach/DeleteDriveAttachById?id=" + $scope
						.activeData.ID + "&isDel=" + isDel;
					DataService.post(url, {}).then(function (res) {

						if ($scope.selectedIds.indexOf($scope.activeData.ID) >= 0) {
							var idx = $scope.selectedIds.indexOf($scope.activeData.ID);
							$scope.selectedIds.splice(idx, 1);
							$scope.selectObj.splice(idx, 1);

							RPCObserver.broadcast('SyncSelectedData', $scope.selectObj);
						}
						mui.hideLoading();
						$scope.data = null;
						pageIndex = 1;
						loadData();
						mui.toast("删除成功！");
					}, function (e) {
						mui.hideLoading();
					});
				} else {
					var promises = [];
					$scope.selectObj.forEach(function (item) {
						var url = ApiService.Pan + "/api/v1/DriveAttach/DeleteDriveAttachById?id=" + item.ID + "&isDel=" + isDel;
						promises.push(DataService.post(url, {}))
					});
					$q.all(promises).then(function (res) {
						mui.hideLoading();
						$scope.selectedIds = [];
						$scope.selectObj = [];
						$scope.data = null;
						pageIndex = 1;
						loadData();
					}, function () {
						mui.hideLoading();
					})
				}
			}
		});
	}

	$scope.moveTo = function (type) {
		if (type == "more") {
			mui('#sheet2').popover('toggle');
		} else {
			mui('#sheet1').popover('toggle');
		}
		UtilsService.openWindow({
			url: "yun-file-chooeDir.html",
			id: "yun-file-chooeDir.html",
			extras: {
				callback: type == 'more' ? "moveToBackMore" : "moveToBack",
			}
		});
	};
	window.moveToBackMore = function (res) {
		var dirData = JSON.parse(res)
		if ($scope.navDirData[$scope.navDirData.length - 1].ID != dirData.ID) {
			mui.showLoading("正在移动", "div");
			var promises = [];
			$scope.selectObj.forEach(function (item) {
				promises.push(DataService.post(ApiService.Pan + "/api/v1/DriveAttach/UpdateDriveAttachDir?id=" + item.ID + "&dirId=" + dirData.ID))
			});
			$q.all(promises).then(function (res) {
				mui.hideLoading();
				$scope.data = null;
				pageIndex = 1;
				loadData();
			}, function () {
				mui.hideLoading();
			})
		}
	}

	window.moveToBack = function (res) {
		var dirData = JSON.parse(res);
		if ($scope.navDirData[$scope.navDirData.length - 1].ID != dirData.ID) {
			mui.showLoading("正在移动", "div");

			DataService.post(ApiService.Pan + "/api/v1/DriveAttach/UpdateDriveAttachDir?id=" + $scope.activeData.ID + "&dirId=" + dirData.ID).then(function () {
				mui.hideLoading();
				$scope.data = null;
				pageIndex = 1;
				loadData();

			}, function () {
				mui.hideLoading();
			})
		}
	};

	$scope.recovery = function () {
		mui('#sheet1').popover('toggle');
		UtilsService.openWindow({
			url: "yun-file-chooeDir.html",
			id: "yun-file-chooeDir.html",
			extras: {
				callback: "recoveryBack",
			}
		});

	}

	window.recoveryBack = function (res) {
		var dirData = JSON.parse(res);

		mui.showLoading("恢复中", "div");

		DataService.post(ApiService.Pan + "/api/v1/DriveAttach/RestoreDelDriveAttach?id=" + $scope.activeData.ID + "&dirId=" + dirData.ID).then(function () {
			mui.hideLoading();
			$scope.data = null;
			pageIndex = 1;
			loadData();
		}, function () {
			mui.hideLoading();
		});
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
		if (!$scope.dirData.hasOwnProperty($scope.catalogID)) {
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
	mui.back = function () {
		if ($scope.navDirData.length > 1) {
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

		RpcClient.invoke("menu-prod.html", "RPC_cur_dir", selectedCatalog);
		if (mui.os.ios) {
			mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
		}
	}

	//获取设备目录
	function getDirList() {
		var url = ApiService.Pan + "/api/v1/DriveDir/GetChildDirveDirList?pid=" + $scope.catalogID;
		DataService.get(url).then(function (res) {
			if (res) {
				$scope.dirData[$scope.catalogID] = res;

				if ($scope.catalogID == 0) {
					$scope.dirData[$scope.catalogID].push({
						ID: -1,
						PID: 0,
						DirName: "回收站",
						IsChild: 0
					});
				}
			}
		})
	}


	$scope.openInfo = function (prod) {
		UtilsService.openWindow({
			needLogin: true,
			id: 'prodinfo-head.html',
			url: '../problib/prodinfo-head.html?prodId=' + prod.ProdID
		});
	};

	//获取所有的设备信息
	function getEqInfoList(type) {
		var url = ApiService.Pan + "/api/v1/DriveAttach/GetPageDriveAttachList?pageIndex=" + pageIndex + "&pageSize=" + pageSize + "&dirId=" + $scope.catalogID;
		if ($scope.catalogID == -1) {
			url = ApiService.Pan + "/api/v1/DriveAttach/GetPagedDelDriveAttachList?pageIndex=" + pageIndex + "&pageSize=" + pageSize;
		}
		DataService.get(url).then(function (res) {
			$scope.Network = true;
			Loading.hide();
			if (res) {
				if (type == "down") {
					$scope.data = null;
				}
				$scope.isLoad = true;
				$scope.data == null && ($scope.data = []);
				$scope.data = $scope.data.concat(res.DataRows);
				$scope.isEnd = $scope.data.length >= res.TotalCount;
				if (mui("#pullrefresh").pullRefresh()) {
					if (type == "down") {
						mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
						mui('#pullrefresh').pullRefresh().refresh(true);
						mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
					} else {
						mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
					}
				}

				setTimeout(function () {
					previewImages();
				}, 200);


				hideUpData();
			}
		}, function (error) {
			$scope.Network = false;
			$scope.isLoad = true;
			if ($scope.data == null) {
				$scope.data = [];
			}
			if (mui("#pullrefresh").pullRefresh()) {
				mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
			}
			hideUpData();
		})
	}
	//当数据为空时，隐藏上拉的提示
	function hideUpData() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if (tip) {
			if ($scope.data.length == 0) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
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
		RpcClient.invoke("menu-prod.html", "RPC_cur_dir", selectedCatalog);
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
		Loading.show();
		$scope.data = null;
		pageIndex = 1;

		$scope.navDirData.push(selectedCatalog);
		resScroll();
		pullupReset();

		loadData();
		RpcClient.invoke("menu-prod.html", "RPC_cur_dir", selectedCatalog);
	})

	//点击目录和导航时重置pullrefresh
	function pullupReset() {
		if (mui("#pullrefresh").pullRefresh()) {
			mui('#pullrefresh').pullRefresh().refresh(true);
			if (mui.os.ios) {
				mui('#pullrefresh').pullRefresh().scrollTo(0, 0, 0);
			}
		}
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if (tip) {
			tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
			tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
		}
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

	//设备目录
	RPCObserver.on('refresh_prod_dir', 'refresh_prod_dir');
	window.refresh_prod_dir = getDirList;

	RPCObserver.on('SyncFileSelectedData', 'SyncFileSelectedData');
	window.SyncFileSelectedData = function (data) {
		$scope.selectObj = data;
		$scope.selectedIds = data.map(function (item) {
			return item.ID;
		});
		$scope.$apply();
	};

	RPCObserver.on('refresh_prodDir_back', 'refresh_prodDir_back');
	window.refresh_prodDir_back = function () {
		mui.back();
	}

	RPCObserver.on('refresh_prod_dir_name', 'refresh_prod_dir_name');
	window.refresh_prod_dir_name = function (name) {
		$scope.navDirData[$scope.navDirData.length - 1].catalogname = name;
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

	RpcServer.expose("RPC_GetSelectCatalog", function (params, callback) {
		callback(selectedCatalog);
	})

	$scope.accessRecord = function (id) {
		UtilsService.openWindow({
			needLogin: true,
			id: "equ-warehouse-record.html",
			url: "equ-warehouse-record.html?id=" + id
		});
	}
	$scope.commissioning = function (equinfo) {
		UtilsService.openWindow({
			needLogin: true,
			id: "equ-commissioning.html",
			url: "equ-commissioning.html",
			extras: {
				equInfo: equinfo
			}
		});
	}
	$scope.equSelect = function (equ) {
		if ($scope.action == 'select') {
			if ($scope.selectedId == equ.ID) return;
			$scope.selectedId = equ.ID;
			var view = plus.webview.currentWebview().opener();
			var opener = view.opener();
			if (view.callback) {
				opener.evalJS(view.callback + "(" + JSON.stringify(equ) + ")");
			}
			mui_back();
		}
	}
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});