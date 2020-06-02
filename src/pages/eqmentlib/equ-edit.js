app.controller("EquEditController", ["$scope", "ApiService", "DataService", "UtilsService", "DatePickerService", "CacheService", "Loading", "$Modal", "$q", "$timeout", "RPCObserver", "$filter", function ($scope, ApiService, DataService, UtilsService, DatePickerService, CacheService, Loading, $Modal, $q, $timeout, RPCObserver, $filter) {
	//上传进度
	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "上传图片",
			State: 0,
			RetryMethod: uploadEqPics
		}, {
			Text: "保存设备信息",
			State: 0,
			RetryMethod: saveEqInfo
		}]
	}
	//编辑时的设备id
	$scope.EqID = query("equid") || 0;
	$scope.title = "新增设备";
	if ($scope.EqID > 0) {
		$scope.title = "修改设备";
	}
	//设备信息
	$scope.EqInfo = {
		ID: 0,
		MDCode: query("mdcode") || ""
	};
	//判断登录人是否是企业用户
	var user = CacheService.get('user');
	$scope.comId = user.CompID
	//$scope.comId=0
	if ($scope.comId == 0) {
		$scope.EqInfo.PersonLiableID = user.UserID;
		$scope.EqInfo.PersonLiableName = $filter("getViewName")(user.UserName, user.RealName, user.Mdt);
	}
	//产品信息
	$scope.ProdInfo = {};
	//投产地信息
	$scope.posInfo = {};
	$scope.selectedPosInfo={};

	$scope.selectCompType = "";
	//生产厂家信息
	$scope.manufacturerInfo = {};
	//供应商信息
	$scope.suppliersInfo = {};
	$scope.PreProdPics = [];
	$scope.equ = {
		ID: "",
		EqName: ""
	};

	$scope.customSelectOptions = {
		model: $scope.equ,
		idField: 'ID',
		nameField: 'EqName',
		selectfn: function () {
			$scope.tap('selequ');
		}
	};
	//无网络或请求失败重试
	$scope.retryModal = {
		msg: "设备维护",
		retry: init,
		state: ""
	}
	//选择投产地
	$scope.posSelect = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: "pos-select.html",
			url: "pos-select.html",
			extras: {
				selectObj: $scope.selectedPosInfo,
				callback: "posSelectCallback"
			}
		});
	};

	$scope.rePos = function () {
		$scope.posInfo = {};
		getPosLocation();
	};

	//投产地自动定位
	function getPosLocation() {
		UtilsService.getLocation().then(function (res) {
			$scope.posInfo = {
				Province: res.province,
				City: res.city,
				District: res.district,
				Street: res.street,
				Address: res.address,
				MapLng: res.lng,
				MapLat: res.lat,
				PosName: "自动定位投产地",
				FactoryID: 0,
				ID: 0
			};

		}, function () {

		});
	}

	//选择生产厂家和供应商
	$scope.compSelect = function (type) {
		if (type == 'manu' && $scope.ProdInfo.hasOwnProperty("CompID")) {
			return;
		}
		$scope.selectCompType = type;
		UtilsService.openWindow({
			needLogin: true,
			id: "comp-select.html",
			url: "comp-select.html?type=" + type,
			extras: {
				selectObj: type == "manu" ? $scope.manufacturerInfo : $scope.suppliersInfo,
				callback: "compSelectCallback"
			}
		});
	}
	//扫码回调
	$scope.scanBack = function (code, mtype, isEmpty, resInfo) {
		if(mtype == "") {
			var url = ApiService.Api52 + "/api/v1/EqApply/GetEqPurchaseByMDCode?mdCode=" +code;
			DataService.get(url).then(function(res) {
//				console.log(JSON.stringify(res))
				if(res){
					res = res[0];
					$scope.EqInfo.MDCode = code;
					$scope.equ.EqName= res.EqName;
					document.getElementById("equ-EqIdentifier").innerText = res.EqIdentifier;
					document.getElementById("equ-SkuName").innerText = res.SkuName;
					if (res.CatalogName != null) {
						$scope.EqInfo.CatalogID = res.CatalogID;
						$scope.EqInfo.CatalogName = res.CatalogName;
						$scope.EqInfo.CatalogPath = res.CatalogPath;
					}
				}
					
			})
		
		}else{
		//空码:赋值给mdcode
		if (isEmpty) {
			//			//重新扫码先清空当前信息
			//			$scope.EqInfo = {};
			//			//清空投产地信息
			//			$scope.posInfo = {};
			//			$scope.selectCompType = "";
			//			//清空生产厂家信息
			//			$scope.manufacturerInfo = {};
			//			//清空供应商信息
			//			$scope.suppliersInfo = {};
			//			//清空图片
			//			$scope.ShowPics = [];
			//			$scope.SavePics = [];			
			$scope.EqInfo.MDCode = code;
			$scope.$apply();
		} else {
			//产品码
			if (mtype == 1) {
				if ($scope.EqID == 0) {
					//仅新增时允许扫描产品
					$scope.ProdInfo = resInfo; //isnew!=0  返回pictype0或者3，isnew=0指定 实物图
//					console.log(JSON.stringify())
					$scope.ProdInfo.MDCode = code;
					//					$scope.manufacturerInfo.suppliername = resInfo.CompName;
					//					$scope.manufacturerInfo.id = resInfo.CompID;
										$scope.SupplierName = resInfo.CompName;
										$scope.SupplierID = resInfo.CompID;
					$scope.$apply();
					mui("#popover").popover("toggle");
				} else {
					mui.toast('请扫描设备码');
				}
			} else {
				mui.toast('国标物联码已绑定设备');
			}
		}
		}
	};
	//确认产品
	$scope.confirmProd = function () {
		mui("#popover").popover("toggle");
		//加为供应商
		addScmSupplier($scope.ProdInfo.CompID);
	};
	/*删除指定文件
	 * relativePath 文件相对路径
	 */
	function delFile(relativePath) {
		plus.io.resolveLocalFileSystemURL(relativePath, function (entry) {
			entry.removeRecursively(function (entry) {
				//console.log("已删除");
			}, function (e) {
				//console.log(e.message);
			});
		});
	}
	//存在的话直接用，不存在就下载
	function downloadLogo(serverPath, name) {
		var loacalPath = "_doc/image/" + name + ".jpg";
		plus.io.resolveLocalFileSystemURL(loacalPath, function (entry) {
			var imgUrl = "file://" + entry.fullPath;
			UtilsService.zipImage(imgUrl).then(function (res) {
				var tempobj = {
					"FileName": entry.name,
					"FilePath": imgUrl,
					"FileSmall": res.zip_src,
					"State": 0
				}
				if ($scope.EqInfo.Attach) {
					$scope.EqInfo.Attach.push(tempobj);
				} else {
					$scope.EqInfo.Attach = [tempobj];
				}
			});
		}, function () {
			//开始下载
			downloadFile(serverPath, loacalPath, function (localFile, status) {
				if (status === 200) {
					var imgUrl = "file://" + plus.io.convertLocalFileSystemURL(loacalPath);
					UtilsService.zipImage(imgUrl).then(function (res) {
						var tempobj = {
							"FileName": name + ".jpg",
							"FilePath": imgUrl,
							"FileSmall": res.zip_src,
							"State": 0
						}
						if ($scope.EqInfo.Attach) {
							$scope.EqInfo.Attach.push(tempobj);
						} else {
							$scope.EqInfo.Attach = [tempobj];
						}
					});
				}
			});
		})
		//先删除原有文件
		//delFile("_doc/image/");
		//开始下载
		//		downloadFile(serverPath, loacalPath, function(localFile, status) {
		//			if(status === 200) {
		//				var imgUrl = "file://" + plus.io.convertLocalFileSystemURL(loacalPath);
		//				console.log(imgUrl)
		//				UtilsService.zipImage(imgUrl).then(function(res) {
		//					var tempobj = {
		//						"FileName": name + ".jpg",
		//						"FilePath": imgUrl,
		//						"FileSmall": res.zip_src,
		//						"State": 0
		//					}
		//					if($scope.EqInfo.Attach) {
		//						$scope.EqInfo.Attach.push(tempobj);
		//					} else {
		//						$scope.EqInfo.Attach = [tempobj];
		//					}
		//				});
		//			}
		//		});
	};

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
	//投产日期
	$scope.chooseOpDate = function () {
		DatePickerService.pickDate({
			selected: $scope.EqInfo.BeginProduceDate,
		}).then(function (res) {
			if (!$scope.EqInfo.BuyDate || $scope.EqInfo.BuyDate == $scope.EqInfo.BeginProduceDate) {
				$scope.EqInfo.BuyDate = res;
			}
			$scope.EqInfo.BeginProduceDate = res;
		});
	};
	//购买日期
	$scope.chooseBuyDate = function () {
		DatePickerService.pickDate({
			selected: $scope.EqInfo.BuyDate,
		}).then(function (res) {
			$scope.EqInfo.BuyDate = res;
		});
	};
	//初始化
	init();

	function init() {
		Loading.show();
		$scope.EqID && loadEqInfo();
		if (!$scope.EqID) {
			getPosLocation();
			$scope.isLoad = true;
			Loading.hide();
			var prodinfo = plus.webview.currentWebview().prodInfo;
			prodinfo && ($scope.ProdInfo = prodinfo) && ($scope.EqInfo.MDCode = prodinfo.MDCode);
			prodinfo && addScmSupplier($scope.ProdInfo.CompID);
		}
	};
	//获取设备信息
	function loadEqInfo() {
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + $scope.EqID;
		DataService.get(url).then(function (res) {
			$scope.retryModal.state = "";
			Loading.hide();
			if (res) {
//				console.log(JSON.stringify(res))
				$scope.isLoad = true;
				$scope.MDCode = res.MDCode;
				$scope.EqInfo = res;
				$scope.posInfo = res.ProcPosInfo;
				document.getElementById("equ-EqIdentifier").innerText = res.EqIdentifier;
				$scope.equ.EqName = res.EqName;
				$scope.SupplierName = res.SupplierName;
				$scope.suppliersInfo.id=res.SupplierID;
				$scope.equ.ID = res.ID;
				document.getElementById("equ-SkuName").innerText = res.SkuName;
				document.getElementById("equ-Station").innerText = res.Station;
				setInfo(res);
			}
		}, function () {
			$scope.retryModal.state = true;
		})
	};
	//获得数据后初始化个参数值
	function setInfo(res) {


		//供应商
		$scope.suppliersInfo = {
			suppliername: res.SupplierName,
			id: res.SupplierID
		}
		//生产厂家
		$scope.manufacturerInfo = {
			suppliername: res.ProduceCompName,
			id: res.ProduceCompID
		}
		//投产地
		//		$scope.posInfo = {
		//			posname: res.ProcPosName,
		//			id: res.ProcPosID
		//		}

		$scope.ProcPosID = res.ProcPosID;


		//参数
		for (var i = 0; i < $scope.EqInfo.Params.length; i++) {
			$scope.EqInfo.Params[i].SortID = i;
		}

		//图片
		$scope.EqInfo.Attach.forEach(function (img) {
			img.State = 1;
		});
	}
	//添加供应商 sourceCompID：产品所属企业
	function addScmSupplier(sourceCompID) {
				var url = ApiService.Api50 + "/api/v1/ScmSupplier/AddScmSupplier?sourceCompID=" + sourceCompID;
				DataService.get(url).then(function (res) {
					if (res) {
		$scope.equ.EqName = $scope.ProdInfo.ProdName;
		document.getElementById("equ-SkuName").innerText = $scope.ProdInfo.SkuName;
						$scope.EqInfo.ProduceCompName = res.SupplierName;
						$scope.EqInfo.ProduceCompID = res.ID;
						$scope.manufacturerInfo.suppliername = res.SupplierName;
		$scope.manufacturerInfo.id = sourceCompID;
						$scope.suppliersInfo.suppliername = res.SupplierName;
$scope.suppliersInfo.id = res.ID;
		//产品码:赋值给SourceMDCode
		$scope.EqInfo.SourceMDCode = $scope.ProdInfo.MDCode;
		$scope.EqInfo.MDCode == '' && ($scope.EqInfo.MDCode = $scope.EqInfo.SourceMDCode);
		//isnew!=0  返回pictype0logo或者3实物图，isnew=0指定 实物图
		var pathList = [];
		if ($scope.ProdInfo.hasOwnProperty("ImageList")) {
			if ($scope.ProdInfo.IsNew == 0) {
				$scope.ProdInfo.ImageList.forEach(function (item) {
					var path = ApiService.Img + "/prod/photo/" + $scope.ProdInfo.ProdID + "/" + item + ".jpg";
					pathList.push(path);
				});
			} else {
				$scope.ProdInfo.ImageList.forEach(function (item) {
					var path = item.PicType == 0 ? (ApiService.Img + "/prod/logo/" + $scope.ProdInfo.ProdID + ".jpg") : (ApiService.Img + "/prod/photo/" + $scope.ProdInfo.ProdID + "/" + item.ID + ".jpg");
					pathList.push(path);
				});
			}
		}

		pathList.forEach(function (path, index) {
			$scope.PreProdPics.push({
				FileName: $scope.ProdInfo.ProdID + "_" + index + ".jpg"
			});
		});
		//去除之前产品带过来的图
		if ($scope.EqInfo.Attach) {
			var temparry = new Array();
			for (var i = 0; i < $scope.EqInfo.Attach.length; i++) {
				var isUnq = true;
				for (var k = 0; k < $scope.PreProdPics.length; k++) {
					if ($scope.EqInfo.Attach[i].FileName == $scope.PreProdPics[k].FileName) {
						isUnq = false;
					}
				}
				if (isUnq) {
					temparry.push($scope.EqInfo.Attach[i]);
				}
			}
			$scope.EqInfo.Attach = temparry;
		}
		//有图片，先下载产品图片到本地
		pathList.forEach(function (path, index) {
			downloadLogo(path, $scope.ProdInfo.ProdID + "_" + index);
		});
					}
				})
	};
	//选人
	$scope.selContact = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: "contact-select.html",
			url: "../common/contact-select.html?action=select&must=false&multiselect=false&type=org",
			extras: {
				callback: "SelContact",
				selectObj: $scope.EqInfo.PersonLiableID ? [{
					"ViewName": $scope.EqInfo.PersonLiableName,
					"UserID": $scope.EqInfo.PersonLiableID,
				}] : []
			}
		});
	};
	//选择设备回调
	window.SelEquBack = function (obj) {
		$scope.equ.EqName = obj.EqName;
		$scope.equ.ID = obj.ID;
		//document.getElementById("equ-EqIdentifier").innerText = obj.EqIdentifier;
		document.getElementById("equ-SkuName").innerText = obj.SkuName;
		if (obj.CatalogName != null) {
			$scope.EqInfo.CatalogID = obj.CatalogName.ID;
			$scope.EqInfo.CatalogName = obj.CatalogName.DirName;
			$scope.EqInfo.CatalogPath = obj.CatalogName.Path;
		}
		$scope.$apply();
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + obj.ID;
		DataService.get(url).then(function (res) {
			$scope.EqInfo.Params = res.Params;
		});
	}
	//跳转
	$scope.tap = function (key) {
		var url = {
			scan: '../scan/scan.html',
			selcls: 'sel-clsification.html',
			selequ: 'equ-list.html?action=select&must=true'
		};
		var extras = {
			scan: {
				callback: "ScanBack",
				type: "eq"
			},
			selcls: {
				callback: "SelClsBack",
				selected: {
					id: $scope.EqInfo.CatalogID,
					name: $scope.EqInfo.CatalogName,
					pid: $scope.EqInfo.CatalogPath && $scope.EqInfo.CatalogPath.split("/").length > 1 ? $scope.EqInfo.CatalogPath.split("/")[$scope.EqInfo.CatalogPath.split("/").length - 2] : 0
				},
				billkey: "B23",
				ismust: true
			},
			selequ: {
				selectObj: {},
				callback: "SelEquBack"
			}
		};
		UtilsService.openWindow({
			needLogin: true,
			id: key == 'selequ' ? 'select-equ-list.html' : url[key].substring(url[key].lastIndexOf('/') + 1),
			url: url[key],
			extras: extras[key]
		});
	};

	//避免重复点击
	var isSubmitting = false;
	$scope.submitData = function () {
		//验证必填字段
		if (document.getElementById("equ-EqIdentifier").innerText.trim() == "") {
			mui.toast("设备编号不能为空");
			return;
		}
		if ($scope.equ.EqName.trim() == "") {
			mui.toast("设备名称不能为空");
			return;
		}
		if (document.getElementById("equ-SkuName").innerText.trim() == "") {
			mui.toast("设备型号不能为空");
			return;
		}
		if (!$scope.EqInfo.CatalogID || !$scope.EqInfo.CatalogName) {
			mui.toast("请选择设备归类");
			return;
		}

		//组装params

		var _params = [];
		var _doms = document.querySelectorAll(".params-flex");

		for (var i = 0; i < _doms.length; i++) {
			var _item = _doms[i];

			var _id = _item.getAttribute("data-id");
			var _NameDom = _item.querySelector(".params-row[data-type='name']");
			var _ValueDom = _item.querySelector(".params-row[data-type='value']");

			var _name = _NameDom.innerText;
			var _value = _ValueDom.innerText;

			//判断是否为空
			if (!trim(_name)) {
				mui.toast(_NameDom.getAttribute("placeholder"));
				return;
			} else if (!trim(_value)) {
				mui.toast(_ValueDom.getAttribute("placeholder"));
				return;
			}

			var _nameLength = _NameDom.getAttribute("data-length");
			var _valueLength = _ValueDom.getAttribute("data-length");

			if (_name.length > _nameLength) {
				mui.toast("参数名最大" + _nameLength + "个字");
				return;
			} else if (_value.length > _valueLength) {
				mui.toast("参数值最大" + _nameLength + "个字");
				return;
			}

			_params.push({
				"ID": _id,
				"ParamName": _name,
				"ParamValue": _value,
				"SortID": _params.length
			});
		}

		$scope.EqInfo.Params = _params;

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
		}, function () {
			isSubmitting = false;
			$scope.process.SaveState = 0;
			$scope.process.ProcessList.forEach(function (item) {
				item.State = 0;
			})
			loadEqInfo();
		}, function () {
			isSubmitting = false;
			$scope.process.ProcessList.forEach(function (item) {
				item.State = 0;
			})
		});
		uploadEqPics();

	};
	//上传图片
	function uploadEqPics() {
		$scope.process.ProcessList[0].State = 1;
		var imgs = $scope.EqInfo.Attach ? $scope.EqInfo.Attach.filter(function (img, idx) {
			img.idx = idx; //记录图片在数组中的位置
			return img.State == 0;
		}) : [];
		if (imgs.length > 0) {
			var promises = imgs.map(function (img) {
				return UtilsService.uploadFileBill(img.FilePath, 1);
			});
			$q.all(promises).then(function (res) {
				var flag = true;
				res.forEach(function (img, index) {
					if (img == null) {
						flag = false;
					} else {
						$scope.EqInfo.Attach[imgs[index].idx] = {
							FileGuid: img.FileGuid,
							FileName: img.FileName,
							FileExt: img.FileExt,
							FilePath: img.FilePath,
							FileSize: imgs[index].FileSize,
							FileType: 1,
							State: 1
						};
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
		var url = ApiService.Api52 + "/api/v1/Equipment/SaveEqInfo";
//	var url = ApiService.Api50 + "/api/v1/Equipment/SaveEqInfo";

		var postdata = {
			"ID": $scope.EqID,
			"EqIdentifier": replaceHTML(document.getElementById("equ-EqIdentifier").innerText),
			"EqName": replaceHTML($scope.equ.EqName),
			"SkuName": replaceHTML(document.getElementById("equ-SkuName").innerText),
			"MDCode": $scope.EqInfo.MDCode,
			"SourceMDCode": $scope.EqInfo.SourceMDCode,
			"SupplierName":$scope.SupplierName,
			"CatalogID": $scope.EqInfo.CatalogID,
			"CatalogPath": $scope.EqInfo.CatalogPath,
			"CatalogName": $scope.EqInfo.CatalogName,
			"NextRepairDate": $scope.EqInfo.NextRepairDate,
			"PersonLiableID": $scope.EqInfo.PersonLiableID,
			"ProcPosID": $scope.posInfo.ID ||0,
			"ProcPosInfo": $scope.posInfo, 
			"Station": replaceHTML(document.getElementById("equ-Station").innerText),
			"BeginProduceDate": $scope.EqInfo.BeginProduceDate + " 00:00:00",
			"BuyDate": $scope.EqInfo.BuyDate + " 00:00:00",
			"ProduceCompID": $scope.manufacturerInfo.id,
			"SupplierID": $scope.suppliersInfo.id,
			"Attachs": $scope.EqInfo.Attach,
			"NextRepairDate": $scope.EqInfo.NextRepairDate + " 00:00:00",
			"NextMaintainDate": $scope.EqInfo.NextMaintainDate + " 00:00:00",
			//参数：去处空的
			"Params": $scope.EqInfo.Params && $scope.EqInfo.Params.filter(function (_item) {
				return _item.ParamName && _item.ParamValue;
			})
		};
//		console.log(JSON.stringify(postdata))
		DataService.post(url, postdata).then(function (res) {
			if (res) {

				//刷新投产地详情-设备列表合计
				RPCObserver.broadcast("refresh_my_sxun");
				//此处应该更新设备列表信息
				RPCObserver.broadcast('refresh_equ_list');
				//刷新待巡检列表
				RPCObserver.broadcast('refresh_equ_insp_plan_list');
				//刷新维修列表
				RPCObserver.broadcast('refresh_equ_repair_list');
				//刷新故障列表
				RPCObserver.broadcast('refresh_equ_fault_list');
				//刷新巡检列表
				RPCObserver.broadcast('refresh_equ_insp_list');
				//刷新保养列表
				RPCObserver.broadcast('refresh_equ_preserve_list');
				//刷新设备信息
				RPCObserver.broadcast('refresh_equ_info');
				//刷新 维修详情
				RPCObserver.broadcast('refresh_equ_repair_info');
				//刷新 故障详情
				RPCObserver.broadcast('refresh_equ_fault_info');
				//刷新 巡检详情
				RpcClient.invoke("equ-maintenanceView.html", "RPC_FaultMaintenanceInsp");
				//刷新 保养详情
				RpcClient.invoke("equ-preserveView.html", "RPC_EqPreserveViewRefresh");
				//刷新搜索页面
				RpcClient.invoke("search.html", "RPC_SearchListRefresh");
				// 设备投产地刷新
				RpcClient.invoke("bill-view.html", "RPC_BillViewRefresh", "equ");
				//刷新投产地
				RpcClient.invoke("pos-info.html", "RPC_BillViewRefresh");
				//刷新工作台列表
				RPCObserver.broadcast("refresh_msg_all_list");
				//刷新巡检标准 试用设备列表信息
				RPCObserver.broadcast("refresh_insp_rule_lnfo");
				//刷新 更换新配件 页面故障信息
				RPCObserver.broadcast('partBaseInfoReload', {
					type: "equ",
					equInfo: {
						EquipmentID: $scope.EqID,
						EqIdentifier: postdata.EqIdentifier,
						EqName: postdata.EqName,
						SkuName: postdata.SkuName
					}
				})
				//刷新 设备保养页面设备信息
				RPCObserver.broadcast('refresh_maintenance_equ_info', {
					EqCode: postdata.EqIdentifier,
					EqID: $scope.EqID,
					EqName: postdata.EqName,
					EqSkuName: postdata.SkuName
				})
				//刷新配件跟换详情
				RPCObserver.broadcast('refresh_equ_part_info');
				//更新草稿箱设备信息
				var cache = CacheService.get(user.UserID + "_mat_fault_submit") || [];
				cache = cache.map(function (item) {
					if (item.faultInfo.prodInfo.EqID == $scope.EqID) {
						item.faultInfo.prodInfo.EqName = postdata.EqName;
						item.faultInfo.prodInfo.SkuName = postdata.SkuName;
						item.EqName = postdata.EqName;
						item.faultInfo.prodInfo.EqSkuName = postdata.SkuName;
						item.faultInfo.prodInfo.EqIdentifier = postdata.EqIdentifier;
					}
					return item;
				})
				CacheService.set(user.UserID + "_mat_fault_submit", cache, true);
				//如果是从sandetails页面跳转过来，则关闭
				var pwview = plus.webview.currentWebview().opener();
				if (pwview && pwview.id == "scanDetails.html") {
					pwview.close("none");
				}

				if ($scope.EqID) {
					if (plus.webview.getWebviewById("produce-list-sub.html")) {
						RpcClient.invoke("produce-list-sub.html", "RPC_refresh");
					}

					if (plus.webview.getWebviewById("produce-map.html")) {
						RpcClient.invoke("produce-map.html", "RPC_refresh");
					}
				}

				var _view = plus.webview.currentWebview();
				if (_view.callback) {
					var backData = {
						EqID: res,
						EqCompID: user.CompID,
						EqName: postdata.EqName,
						EqIdentifier: postdata.EqIdentifier,
						EqSkuName: postdata.SkuName,
						EqPersonLiableID: postdata.PersonLiableID,
						ProdID: $scope.ProdInfo.ProdID,
						MdCode: postdata.SourceMDCode
					};
					pwview.evalJS(_view.callback + "(" + JSON.stringify(backData) + ")");
				}

				$scope.EqID = res;
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
//选择归类回调
function SelClsBack(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.EqInfo.CatalogID = obj.ID;
	$scope.EqInfo.CatalogName = obj.DirName;
	$scope.EqInfo.CatalogPath = obj.Path;
	$scope.$apply();
};
//选择人员回调
function SelContact(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	if (obj && obj.length > 0) {
		$scope.EqInfo.PersonLiableName = obj[0].ViewName;
		$scope.EqInfo.PersonLiableID = obj[0].UserID;
		$scope.$apply();
	} else if (obj && obj.length == 0) {
		$scope.EqInfo.PersonLiableName = "";
		$scope.EqInfo.PersonLiableID = 0;
		$scope.$apply();
	}
}

//扫码回调
function ScanBack(obj) {
	obj = JSON.parse(obj);
//	console.log(JSON.stringify(obj))
	if (obj.resType == 1) {
		obj.resInfo.SkuName = decodeURIComponent(obj.resInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
		obj.resInfo.ProdName = decodeURIComponent(obj.resInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
	}
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.scanBack(obj.codeValue, obj.resType, obj.isEmpty, obj.resInfo);
}
//选择投产地回调
function posSelectCallback(obj) {

	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();

	if(obj)
	{
		$scope.posInfo.PosName = obj.posname;
		$scope.posInfo.Province = obj.province;
		$scope.posInfo.City = obj.city;
		$scope.posInfo.District = obj.district	;
		$scope.posInfo.Address = obj.address.replace(obj.province,"").replace(obj.city,"").replace(obj.district,"");
		$scope.posInfo.Street = obj.street;
		$scope.posInfo.ID = obj.id;

		$scope.selectedPosInfo = obj;
	}
	else
	{
		$scope.selectedPosInfo = null;
		$scope.posInfo = null;
		getPosLocation();
	}
	
	
	$scope.$apply();
}

//选择厂家和供应商回调
function compSelectCallback(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	if ($scope.selectCompType == "manu") {
		if (!$scope.suppliersInfo.id || $scope.suppliersInfo.id == $scope.manufacturerInfo.id) {
			$scope.suppliersInfo = obj ? obj : null;
		}
		$scope.manufacturerInfo = obj ? obj : null;
	} else {
		$scope.suppliersInfo = obj ? obj : null;
	}
	$scope.$apply();
}
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