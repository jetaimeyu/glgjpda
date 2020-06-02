app.controller("ProdInfoCtl", ["$scope", "CustomModalService", "CacheService", "$Modal", "UtilsService", "ApiService", "DataService", "Loading", "$filter", function ($scope, CustomModalService, CacheService, $Modal, UtilsService, ApiService, DataService, Loading, $filter) {
	$scope.user = CacheService.get('user');
	getDebugParamsTypeList();
	$scope.debugParams = [];
	$scope.isLoad = true;
	$scope.ProdInfo = {
		ProdID: query("ProdID"),
		ProdName: query("ProdName") ? decodeURIComponent(query("ProdName")).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"").replace(/@percent@/g, "%") : "",
		SkuID: query("SkuID"),
		SkuName: query("SkuName") ? decodeURIComponent(query("SkuName")).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"").replace(/@percent@/g, "%") : "",
		ProdInnerCode: query("ProdInnerCode") ? query("ProdInnerCode").replace(/@and@/g, "&").replace(/@hash@/g, "#") : "",
		MDCode: query("MDCode"),
		InnerCodeName: $scope.user.InnerCodeName || '出厂编号',
		LogoIsExist: query("LogoIsExist") === 'true',
		CompID: query("CompID"),
		EqJane: query("EqJane") || ""
	};
	if (query("CodeCreateUserName") != 'undefined') {
		$scope.CodeCreateUserName = query("CodeCreateUserName") || "";
	}
	$scope.OutCust = { //出库时的客户信息
		IsHasOut: 0, //是否有出库信息
		//生产厂家时：首次出库客户信息
		FirstCust: "",
		//生产厂家时：最后一次出库信息
		LastCust: ""
	};
	$scope.Fac = { //源生产厂家
		ID: 0,
		Name: ""
	}
	$scope.FacInstall = { //装配后生产厂家，20170706后改为源生产厂家对此赋值，不走装配
		ID: query("CompID"),
		Name: query("CompName") ? query("CompName").replace(/@and@/g, "&").replace(/@hash@/g, "#") : ""
	}
	init();
	loadMdCodeInfo();
	loadProdCustInfo();
	//loadCantractInfo();
	//加载
	function init () {
		$scope.title = $scope.ProdInfo.ProdID ? "产品详情" : "空码绑定";
		$scope.handleMenus = [];
		$filter("hasModuleAuth")("after-sale") && $filter("hasAuth")('Q25') && $scope.handleMenus.push({
			title: "故障维修",
			icon: "../../images/troubleshooting.png",
			action: "repair"
		});
		$filter("hasModuleAuth")("after-sale") && $filter("hasAuth")('Q30') && $scope.handleMenus.push({
			title: "安装调试",
			icon: "../../images/Installationdebugging.png",
			action: "debug"
		});
		//$filter("hasMenuAuth")("tygn","ybfw")
		$filter("hasModuleAuth")("product") && $filter("hasAuth")('Q63') && $scope.handleMenus.push({
			title: "延保",
			icon: "../../images/Periodinspection@3x.png",
			action: "warrantyExtension"
		});
		$scope.queryMenus = [{
			title: "产品故障记录",
			icon: "../../images/Failurereporting3x.png",
			action: "eqfailure"
		}, {
			title: "故障处理记录",
			icon: "../../images/troubleshooting.png",
			action: "eqrepair"
		}, {
			title: "安装调试记录",
			icon: "../../images/Installationdebugging.png",
			action: "debugList"
		}, {
			title: "零件更换记录",
			icon: "../../images/eqreplacement.png",
			action: "eqreplacement"
		}, {
			title: "三包期查阅",
			icon: "../../images/Periodinspection@3x.png",
			action: "Periodinspection"
		}, {
			title: "装配清单",
			icon: "../../images/Spareparts@3x.png",
			action: "Spareparts"
		}, {
			title: "电子手册",
			icon: "../../images/repairrule.png",
			action: "Handbook"
		}, {
			title: "动态鉴伪",
			icon: "../../images/examine.png",
			action: "Dauthentication"
		}];
		$scope.isLoad = true;
	}
	//获取迈迪国标通用物联码的扫码信息
	function loadMdCodeInfo () {
		laodMdCodeInfoFromSerVer("{}");

		setTimeout(function () {
			//位置定位
			UtilsService.getLocation(true).then(function (l) {
				var scanInfo = {
					province: l.province || "",
					city: l.city || "",
					district: l.district || "",
					address: (l.street || "") + (l.poiName || ""),
					lat: l.lat || 0.0,
					lng: l.lng || 0.0,
					userId: $scope.user.UserID
				};
				laodMdCodeInfoFromSerVer(JSON.stringify(scanInfo));
			});
		}, 500);
	};
	//扫码记录
	function laodMdCodeInfoFromSerVer (scanInfo) {
		var url = ApiService.ApiJ + "/mdcode/get?code=" + $scope.ProdInfo.MDCode + "&type=mdcode&scanInfo=" + scanInfo;
		DataService.get(url).then(function (res) { }, function (obj) {
			if (obj && obj.code == 200 && obj.data.code) {
				$scope.Status = obj.data.code.status; //扫码状态 1正常2异常
			}
			if (scanInfo == "{}") {
				$scope.Scan = obj.data ? obj.data.code.record : null;
			}
		})
	};
	//跳转
	$scope.tap = function (_key, phone) {
		var url = {
			detail: 'prodinfo-head.html?prodId=' + $scope.ProdInfo.ProdID + "&SkuID=" + $scope.ProdInfo.SkuID + "&MdCode=" + $scope.ProdInfo.MDCode + "&ProdInnerCode=" + encodeURIComponent($scope.ProdInfo.ProdInnerCode) + "&InnerCodeName=" + $scope.ProdInfo.InnerCodeName,
			failurework: "../aftersale/mat-fault-edit.html",
			debug: '../aftersale/debug-edit.html',
			repair: '../aftersale/mat-repair.html?from=scan',
			debugList: getUrlList("../aftersale/debug-list.html?prodid=" + $scope.ProdInfo.ProdID + "&skuid=" + $scope.ProdInfo.SkuID + "&mdcode=" + query("MDCode")),
			eqfailure: getUrlList("../aftersale/mat-fault-list.html?prodid=" + $scope.ProdInfo.ProdID + "&skuid=" + $scope.ProdInfo.SkuID),
			eqrepair: getUrlList("../aftersale/mat-repair-list.html?prodid=" + $scope.ProdInfo.ProdID + "&skuid=" + $scope.ProdInfo.SkuID + "&mdcode=" + query("MDCode")),
			eqreplacement: getUrlList("../aftersale/mat-part-infolist.html?prodid=" + $scope.ProdInfo.ProdID + "&skuid=" + $scope.ProdInfo.SkuID + "&mdcode=" + query("MDCode")),
			replacement: '../aftersale/mat-part-replacement.html',
			Replacementparts: "",
			warrantyExtension: "../problib/warranty-service.html?mdcode=" + query("MDCode") + "&ext=true&isscan=1",
			Periodinspection: "../problib/warranty-service.html?mdcode=" + query("MDCode") + "&isscan=1",
			Spareparts: "../problib/parts-list.html?hostProdId=" + $scope.ProdInfo.ProdID + "&hostSkuId=" + $scope.ProdInfo.SkuID + '&ProdName=' + encodeURIComponent($scope.ProdInfo.ProdName) + '&SkuName=' + encodeURIComponent($scope.ProdInfo.SkuName) + '&innercode=' + $scope.ProdInfo.ProdInnerCode + '&mdcode=' + $scope.ProdInfo.MDCode + '&LogoIsExist=' + $scope.ProdInfo.LogoIsExist + '&CompID=' + $scope.ProdInfo.CompID + '&EqJane=' + $scope.ProdInfo.EqJane + '&CompName=' + query("CompName") + '&CodeCreateUserName=' + query("CodeCreateUserName"),
			Extensionservice: "../problib/securing-services.html?mdcode=" + query("MDCode"),
			Maintenancecontract: "",
			Dauthentication: ApiService.M + '/dtjw.html?v=1&code=' + $scope.ProdInfo.MDCode + '&ProdID=' + $scope.ProdInfo.ProdID + '&compId=' + $scope.ProdInfo.CompID + '&SkuName=' + $scope.ProdInfo.SkuName + '&skuId=' + $scope.ProdInfo.SkuID,
			Failurereporting: "",
			Electronicarchives: ApiService.M + '/weixin/showImg.html?v=1&code=' + $scope.ProdInfo.MDCode + '&ProdID=' + $scope.ProdInfo.ProdID + '&compId=' + $scope.ProdInfo.CompID + '&SkuName=' + $scope.ProdInfo.SkuName + '&skuId=' + $scope.ProdInfo.SkuID,
			Partspurchase: "",
			Knowmanufacturer: "",
			Detailedparameters: "",
			Contract: "../customized/ShanTui/check-contract.html?mdcode=" + query("MDCode"),
			AssemblyList: "../problib/assembly-list.html?mdcode=" + query("MDCode"),
			Handbook: ApiService.M + "/weixin/handbook.html?v=1&ismdt=1&code=" + $scope.ProdInfo.MDCode + "&ProdID=" + $scope.ProdInfo.ProdID + "&skuId=" + $scope.ProdInfo.SkuID
		};
		if (_key == 'Spareparts') {
			url[_key] = $scope.ProdInfo.ProdInnerCode == "" ? $filter('addUrlParam')(url[_key], 'mdcode', $scope.ProdInfo.MDCode) : $filter('addUrlParam')(url[_key], 'innercode', encodeURIComponent($scope.ProdInfo.ProdInnerCode));
		}
		switch (_key) {
			case 'debug':
				debugging();
				break;
			case 'debugList':
			case 'eqfailure':
			case 'eqrepair':
				var title = {
					debugList: "调试历史",
					eqfailure: "故障列表",
					eqrepair: "故障维修列表",
				};
				UtilsService.openWindow({
					needLogin: true,
					id: url[_key].substring(url[_key].lastIndexOf('/') + 1, url[_key].indexOf('?')),
					url: url[_key],
					extras: {
						prodInfo: $scope.ProdInfo
					}
				});
				break;
			case 'Dauthentication':
			case 'Electronicarchives':
			case 'eqreplacement':
			case 'Handbook':
				var title = {
					Dauthentication: "动态鉴伪",
					Electronicarchives: "电子档案",
					eqreplacement: "零件更换记录",
					Handbook: "电子手册"
				};
				UtilsService.openWindow({
					needLogin: true,
					id: "hyperlink.html",
					url: "../common/hyperlink.html",
					extras: {
						hyperlink: {
							title: title[_key],
							url: url[_key]
						}
					}
				});
				break;
			case "phone":
				plus.device.dial(phone, false);
				break;
			default:
				var extras = {
					failurework: {
						addMatRecord: $scope.ProdInfo
					},
					debug: {
						prodInfo: $scope.ProdInfo
					},
					repair: {
						addMatRecord: $scope.ProdInfo
					},
					replacement: {
						prodInfo: $scope.ProdInfo
					}
				};
				var options = {
					needLogin: true,
					id: url[_key].substring(url[_key].lastIndexOf('/') + 1, url[_key].indexOf('?')),
					url: url[_key]
				};
				extras.hasOwnProperty(_key) && (options.extras = extras[_key]);
				UtilsService.openWindow(options);
				break;
		}
	};
	//动态获取接口
	function getUrlList (url) {
		url += "&type=all&isscan=1";
		if ($scope.ProdInfo.ProdInnerCode == "") {
			return url += '&mdcode=' + $scope.ProdInfo.MDCode;
		} else {
			return url += '&innercode=' + encodeURIComponent($scope.ProdInfo.ProdInnerCode);
		}

	};

	//安装调试
	function debugging () {
		CustomModalService.debug($scope.ProdInfo);
	}

	//获取调试参数分组
	function getDebugParamsTypeList () {
		var url = ApiService.Api50 + "/api/v1/ProdDebug/GetDebugParamsTypeList";
		DataService.get(url).then(function (res) {
			res.length && $scope.debugParams.push({
				id: -1,
				title: '安装调试'
			});
			res.forEach(function (item) {
				$scope.debugParams.push({
					id: item.ID,
					title: item.Name
				})
			})
		});
	};

	//通过物联码获取产品详情
	function getProdInfoByMdCode () {
		var url = ApiService.Api52 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + query("MDCode") + "&CompID=" + $scope.user.CompID;
		DataService.get(url).then(function (res) {
			$scope.isLoad = true;
			$scope.ProdInfo = {
				ProdID: res.ProdID,
				CompID: res.CompID,
				ProdName: res.ProdName,
				SkuID: res.SkuID,
				SkuName: res.SkuName,
				ProdInnerCode: res.InnerCode,
				MDCode: query("MDCode"),
				InnerCodeName: $scope.user.InnerCodeName || '出厂编号',
				LogoIsExist: res.LogoIsExist
			};
			$scope.FacInstall.ID = res.CompID;
			$scope.FacInstall.Name = res.CompName;
			$scope.Fac.ID = res.SourceCompID;
			//			$scope.Fac.Name = res.CompName;
			init();
		})
	}
	//获取产品出库所属客户信息
	function loadProdCustInfo () {
		var url = ApiService.Api45 + "/api/v1.0/Stock/GetProdOutHistory?MDCode=" + query("MDCode");
		DataService.get(url).then(function (res) {
			if (res.length == 0)
				return;
			else
				$scope.OutCust.IsHasOut = 1;
			//如果扫码产品的生产企业ID与当前用户所在企业ID相同，则显示第一次出库信息和最后一次出库信息
			if ($scope.ProdInfo.CompID == $scope.user.CompID) {
				$scope.OutCust.FirstCust = res[0];
				if (res.length > 1) {
					$scope.OutCust.LastCust = res[res.length - 1];
				}
			}
		}, function (e) { })
	}
	//合同档案信息查看权限
	if ($filter("hasMenuAuth")("syyy", "qydz", "htda", "htdaxx")) {
		$scope.queryMenus.push({
			title: "合同档案",
			icon: "../../images/customerevaluation.png",
			action: "Contract"
		})
	}
	//加载合同数据
	//	function loadCantractInfo() {
	//		var url = ApiService.Api45 + "/api/v1.0/WorkOrder/GetMatContractInfo?mdCode=" + query("MDCode");
	//		DataService.get(url).then(function(res) {
	//			if(res.ID) {
	//				$scope.IsHasCont = true;
	//			} else {
	//				$scope.IsHasCont = false;
	//			}
	//			if($scope.IsHasCont&&$filter("hasMenuAuth")("syyy", "qydz","htda","htdaxx")) {
	//				$scope.queryMenus.push({
	//						title: "合同档案",
	//						icon: "../../images/customerevaluation.png",
	//						action: "Contract"
	//					}
	//				)
	//			}
	//		})
	//	}
	//绑定产品
	$scope.bindingProd = function () {
		UtilsService.openWindow({
			id: "problib-index.html",
			url: "../problib/index.html?state=selsku",
			extras: {
				selectObj: $scope.ProdInfo,
				callback: 'faultEquCallback'
			}
		})
	}
	//绑定设备
	$scope.bindingEq = function () {
		UtilsService.openWindow({
			id: "equ-edit.html",
			url: "../eqmentlib/equ-edit.html?mdcode=" + query("MDCode")
		})
	}

	//绑定设备
	$scope.bindingReadyEq = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: 'select-equ-list.html',
			url: '../eqmentlib/equ-list.html?action=select&must=true',
			extras: {
				selectObj: {},
				callback: "SelEquBack"
			}
		});
	}
	//选择设备回调
	window.SelEquBack = function (obj) {
		//console.log(JSON.stringify(obj));
		// $scope.$apply();
		var url = ApiService.Api50 + "/api/v1/Equipment/BindMdCode?eqId=" + obj.ID + "&mdcode=" + query("MDCode");
		DataService.post(url).then(function (res) {
			UtilsService.openWindow({
				needLogin: true,
				id: 'equ-details.html',
				url: '../eqmentlib/equ-details.html?equid=' + obj.ID,
			});
			setTimeout(function () {
				plus.webview.currentWebview().close("none");
			}, 500);
			mui.toast("绑定成功!")
		});
	}

	window.faultEquCallback = function (obj) {
		var url = ApiService.Api50 + "/api/v1/MdCode/BindingMdCode?mdcode=" + query("MDCode") + "&prodId=" + obj.ProdID + "&skuId=" + obj.SkuID + "&prodName=" + encodeURIComponent(obj.ProdName) + "&skuName=" + encodeURIComponent(obj.SkuName);
		DataService.get(url).then(function (res) {
			if (res == true) {
				mui.toast("绑定产品成功！");
				getProdInfoByMdCode();
			} else {
				mui.toast("绑定产品失败！");
			}
		})
	}

	$scope.compIndexView = function (id) {
		UtilsService.openWindow({
			needLogin: true,
			id: 'complib-index.html',
			url: '../complib/index.html?compid=' + id
		});
	}
	var mui_back = mui.back;

	mui.back = function () {

		if ($Modal.modals().length > 0) {
			$Modal.close();
			return;
		}
		mui_back()
	}

}]);

app.filter("getScanTime", function () {
	return function (date) {
		return GetDate(date, true, true);
	}
});

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});