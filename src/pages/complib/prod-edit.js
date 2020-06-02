app.controller("EquEditController", ["$scope", "ApiService", "DataService", "UtilsService", "DatePickerService", "CacheService", "Loading", "$Modal", "$q", "$timeout", "RPCObserver", "$filter", function ($scope, ApiService, DataService, UtilsService, DatePickerService, CacheService, Loading, $Modal, $q, $timeout, RPCObserver, $filter) {
	//上传进度
	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "上传图片",
			State: 0,
			RetryMethod: uploadEqPics
		}, {
			Text: "保存信息",
			State: 0,
			RetryMethod: saveEqInfo
		}]
	};

	var curView = plus.webview.currentWebview();

	$scope.isLoad = true;

	$scope.Attach = [];
	$scope.AttachResut = [];

	$scope.prodInfo = {
		ProdName: "",
	};

	$scope.skus = [];

	$scope.dir = curView.dir;

	$scope.chooseDir = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: "sel-class-ext.html",
			url: "sel-class-ext.html",
			extras: {
				callback: "selClassExtCallback",
				selected: {
					id: $scope.dir.ID,
					name: $scope.dir.SName,
					spath: $scope.dir.SPath
				},
				ismust: true
			}
		});

	};

	window.selClassExtCallback = function (data) {
		$scope.dir.ID = data.ID;
		$scope.dir.SName = data.SName;
		$scope.dir.SPath = data.SPath;
		$scope.$apply();
	};

	$scope.class = {
		ID: "",
			CName: "",
			CPath: ""
	};

	$scope.chooseClass = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: "sel-class.html",
			url: "sel-class.html",
			extras: {
				callback: "selClassCallback",
				selected: {
					id: $scope.class.ID,
					name: $scope.class.CName,
					spath: $scope.class.CPath
				},
				ismust: true
			}
		});

	};


	window.selClassCallback = function (data) {
		$scope.class.ID = data.CID;
		$scope.class.CName = data.CName;
		$scope.class.CPath = data.CPath;
		$scope.$apply();
	};






	//判断登录人是否是企业用户
	var user = CacheService.get('user');
	$scope.comId = user.CompID



	//增加设备参数
	$scope.addParam = function () {
		document.activeElement.blur();
		!$scope.EqInfo.Params && ($scope.EqInfo.Params = []);
		var _param = {
			"ID": 0,
			"ParamName": "",
			"ParamValue": "",
			"SortID": $scope.EqInfo.Params ? $scope.EqInfo.Params.length : 0
		}
		$scope.EqInfo.Params.push(_param);
		return false;
	};
	//删除设备参数
	$scope.delParam = function (obj) {
		document.activeElement.blur();
		//文本框有输入值，弹出询问框
		if (obj.ParamName || obj.ParamValue) {
			mui.confirm("是否删除该条设备参数？", "提示", ["删除", "取消"], function (e) {
				if (e.index == 0) {
					$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function (_item) {
						return _item.SortID != obj.SortID;
					});
					$scope.$apply();
				}
			});
		} else {
			//文本框没有输入值，直接移除
			$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function (_item) {
				return _item.SortID != obj.SortID;
			});
		}
		$scope.EqInfo.Params.forEach(function (ele, index) {
			ele.SortID = index;
		})
		$scope.$apply();
		return false;
	};


	//避免重复点击
	var isSubmitting = false;
	$scope.submitData = function () {
		if ($scope.prodInfo.ProdName.trim() == "") {
			mui.toast("请输入产品名称");
			return;
		}
		if (!$scope.dir.ID) {
			mui.toast("请选择目录");
			return;
		}
		//组装params

		// var _params = [];
		// var _doms = document.querySelectorAll(".params-flex");

		// for (var i = 0; i < _doms.length; i++) {
		// 	var _item = _doms[i];

		// 	var _id = _item.getAttribute("data-id");
		// 	var _NameDom = _item.querySelector(".params-row[data-type='name']");
		// 	var _ValueDom = _item.querySelector(".params-row[data-type='value']");

		// 	var _name = _NameDom.innerText;
		// 	var _value = _ValueDom.innerText;

		// 	//判断是否为空
		// 	if (!trim(_name)) {
		// 		mui.toast(_NameDom.getAttribute("placeholder"));
		// 		return;
		// 	} else if (!trim(_value)) {
		// 		mui.toast(_ValueDom.getAttribute("placeholder"));
		// 		return;
		// 	}

		// 	var _nameLength = _NameDom.getAttribute("data-length");
		// 	var _valueLength = _ValueDom.getAttribute("data-length");

		// 	if (_name.length > _nameLength) {
		// 		mui.toast("参数名最大" + _nameLength + "个字");
		// 		return;
		// 	} else if (_value.length > _valueLength) {
		// 		mui.toast("参数值最大" + _nameLength + "个字");
		// 		return;
		// 	}

		// 	_params.push({
		// 		"ID": _id,
		// 		"ParamName": _name,
		// 		"ParamValue": _value,
		// 		"SortID": _params.length
		// 	});
		// }

		// $scope.EqInfo.Params = _params;

		//验证填字符长度
		if (!checkLengthUtil.check()) {
			return false;
		}
		if (isSubmitting) return;
		//开始上传
		isSubmitting = true;
		UtilsService.submitModal($scope.process, function () {
			isSubmitting = false;
			mui.back();
		});
		uploadEqPics();

	};
	//上传图片
	function uploadEqPics() {
		$scope.process.ProcessList[0].State = 1;
		var imgs = $scope.Attach ? $scope.Attach.filter(function (img, idx) {
			img.idx = idx; //记录图片在数组中的位置
			return img.State == 0;
		}) : [];
		if (imgs.length > 0) {
			var promises = imgs.map(function (img) {
				return UtilsService.uploadFileTemp(img.FilePath, 1);
			});
			$q.all(promises).then(function (res) {
				var flag = true;
				var isMain = 0;
				res.forEach(function (img, index) {
					if (img == null) {
						flag = false;
					} else {
						$scope.AttachResut.push({
							"ID": "0",
							"IsDelete": 0,
							"IsMain": isMain == 0 ? 1 : 0,
							"TempleFile": img
						});
						isMain++;
					}
				});
				$scope.process.ProcessList[0].State = flag ? 2 : 3;
				//上传详情内容
				flag && saveEqInfo();
			});
		} else {
			$scope.process.ProcessList[0].State = 2;
			//上传详情内容
			saveEqInfo();
		}
	}
	//保存设备信息
	function saveEqInfo() {

		if ($scope.process.ProcessList[0].State != 2) {
			return;
		}

		$scope.process.ProcessList[1].State = 1;
		var url = ApiService.Api50 + "/api/v1/Prod/SaveProdInfo";

		var postdata = {
			"ProdName": $scope.prodInfo.ProdName,
			"CID": $scope.class.CID || 2,
			"CPath": $scope.class.CPath || 2,
			"SPath": $scope.dir.SPath,
			"SID": $scope.dir.ID,
			"ProdPictures": $scope.AttachResut,
			"PriceTable": {
				"Columns": [{
					"ItemName": "规格型号",
					"ItemID": "0",
					"ItemEnName": "SkuName",
					"IsPublic": 1,
					"IsDelete": 0,
					"value": "默认"
				}, {
					"ItemName": "代号",
					"ItemEnName": "MatCode",
					"ItemID": "0",
					"IsPublic": 0,
					"IsDelete": 0
				}, {
					"ItemName": "保修期",
					"ItemEnName": "Warranty",
					"ItemID": "0",
					"IsPublic": 0,
					"IsDelete": 0
				}, {
					"ItemName": "包装尺寸(单位:cm)",
					"ItemEnName": "PackSize",
					"ItemID": "0",
					"IsPublic": 0,
					"IsDelete": 0
				}, {
					"ItemName": "净重(单位:kg)",
					"ItemEnName": "Suttle",
					"ItemID": "0",
					"IsPublic": 0,
					"IsDelete": 0
				}, {
					"ItemName": "报修单位",
					"ItemEnName": "WarrantyUnit",
					"ItemID": "0",
					"IsPublic": 0,
					"IsDelete": 0
				}],
				"Values": [{
					"IsCustomize": 1,
					"IsDelete": 0,
					"IsEnable": "0",
					"values": [{
						"ColumnID": "0",
						"value": "22",
						"IsDelete": 0,
						"ItemEnName": "SkuName"
					}, {
						"ColumnID": "0",
						"IsDelete": 0,
						"ItemEnName": "MatCode"
					}, {
						"ColumnID": "0",
						"IsDelete": 0,
						"ItemEnName": "Warranty"
					}, {
						"ColumnID": "0",
						"IsDelete": 0,
						"ItemEnName": "PackSize"
					}, {
						"ColumnID": "0",
						"IsDelete": 0,
						"ItemEnName": "Suttle"
					}],
					"Value": [{
						"ValueList": [{
							"Value": "默认"
						}]
					}, {
						"ValueList": [{
							"Value": ""
						}]
					}, {
						"ValueList": [{
							"Value": 0
						}]
					}, {
						"ValueList": [{
							"Value": 0
						}]
					}, {
						"ValueList": [{
							"Value": 0
						}]
					}, {
						"ColumnID": "0",
						"ValueList": [{
							"Key": "0",
							"Value": "2"
						}]
					}],
					"IsEdit": 1
				}]
			},
			SourceType: 3,
			PriceAuthState: 0
		};

		DataService.post(url, postdata).then(function (res) {
			if (res) {
				RPCObserver.broadcast("refresh_prod_list");
				$scope.process.ProcessList[1].State = 2;
				$timeout(function () {
					$scope.process.SaveState = 1;
				}, 800);
			}
		}, function (res) {
			$scope.process.ProcessList[1].State = 3;
		});
	};
}]);
//删除参数
function delParams(pname, pvalue, sortid) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	var obj = {
		ParamName: pname,
		ParamValue: pvalue,
		SortID: sortid
	}
	$scope.delParam(obj);
};
mui("body").on("tap", ".params .icon-close", function () {
	var pname = this.getAttribute("pname");
	var pvalue = this.getAttribute("pvalue");
	var sortid = this.getAttribute("sortid");
	delParams(pname, pvalue, sortid);
});

//排序(由于排序后设备参数删除ng-click会不起作用，所以用此方法)
Sortable.create(document.getElementById("params-body"), {
	group: "params",
	animation: 150,
	scroll: false,
	handle: ".opt-left",
	onStart: function () {
		mui(".mui-scroll-wrapper")[0].style.overflow = "hidden";
	},
	onEnd: function (evt) {
		mui(".mui-scroll-wrapper")[0].style.overflow = "scroll";
		if (evt.newIndex > -1) {
			var oldIdx = evt.oldIndex;
			var newIdx = evt.newIndex;

			var nums = 0;
			if (oldIdx < newIdx) {
				nums = 0.5; //向下拖动
			} else {
				nums = -0.5; //向上拖动
			}
			var appElement = document.querySelector('[ng-controller=EquEditController]');
			var $scope = angular.element(appElement).scope();
			$scope.EqInfo.Params[oldIdx - 1].SortID = newIdx + nums - 1; //-1shang
			$scope.EqInfo.Params = $scope.EqInfo.Params.sort(compare("SortID"));
			$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function (_item, _idx) {
				_item.SortID = _idx;
				return true;
			});
			$scope.EqInfo.Params.forEach(function (ele, index) {
				ele.SortID = index;
			})
			$scope.$apply();
		}
	}
});

function sortId(a, b) {
	return a.SortID - b.SortID
}
var compare = function (prop) {
	return function (obj1, obj2) {
		var val1 = obj1[prop];
		var val2 = obj2[prop];
		if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
			val1 = Number(val1);
			val2 = Number(val2);
		}
		if (val1 < val2) {
			return -1;
		} else if (val1 > val2) {
			return 1;
		} else {
			return 0;
		}
	}
}
mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});