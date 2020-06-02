var win_height = window.innerHeight; //当前界面大小

/***初始化信息--start--***/

var vm = avalon.define({
	$id: "myCtl",
	Province: "",
	City: "",
	District: "",
	Address: "", //详细地址
	Street: "",
	LabelAddress: "",
	MapLng: "",
	MapLat: "",
	LocalLng: "",
	LocalLat: "",
	LocalAddress: "",
	CLng: "",
	CLat: "",
	SearchAddr: "",
	SearchResult: "", //查询结果
	SearchAddress: "",
	IsShowSearch: 0,
	IsShowPick: 0,
	IsShowFooter: 0,
	IsLoadedMap: false,
	IsLocation: false,
	IsOld: false,
	showMapCenter: true,
	//传入参数from，判断是否来自定制页面
	fromPage: query("from")
});

//vm.$watch("SearchAddress", function() {
//	mui.trigger(document.body.querySelector("#btn-search-map"), "tap");
//});
avalon.filters.contractAddress = contractAddress;

var map = null, //百度地图实例
	localSearch, //百度地图本地搜索
	myGeo;
mui.init();

var utilsService;
app.controller("bodyontroller", ["$scope", "UtilsService", "ApiService", function ($scope, UtilsService, ApiService) {
	utilsService = utilsService;
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);

	plus.webview.currentWebview().setStyle({
		softinputMode: "adjustResize"
	});

	showWaiting();

	var view = plus.webview.currentWebview();

	vm.CProvince = vm.Province = view.Province || "";
	vm.CCity = vm.City = view.City || "";
	vm.CDistrict = vm.District = view.District || "";
	//vm.CStreet = vm.Street = view.Street || "";
	vm.LabelAddress = vm.Address = view.Address || "";
	vm.CLng = vm.MapLng = view.Lng || "";
	vm.CLat = vm.MapLat = view.Lat || "";
	vm.LabelAddress = view.Address || "";
	vm.Street = view.Street || "";
	vm.IsOld = view.IsOld || false;

	if (isNetWorkCanUse()) {
		//初始化百度地图
		initBaiDuMap();
	} else {
		hideWaiting();
		initEvent();
		prePickArea();
	}

});

/***初始化信息--end--***/

/***百度地图--start--***/

//初始化百度地图
function initBaiDuMap() {
	map = new BMap.Map("map_container");

	var top_right_navigation = new BMap.NavigationControl({
		anchor: BMAP_ANCHOR_TOP_RIGHT,
		type: BMAP_NAVIGATION_CONTROL_SMALL
	}); //右
	map.addControl(top_right_navigation);
	map.centerAndZoom(new BMap.Point(116.404, 39.915), 15);

	myGeo = new BMap.Geocoder();

	map.addEventListener("dragend", function () {
		var point = map.getCenter();
		getLocationInfo(point, "", false);
	});

	map.addEventListener("zoomend", function () {
		map.centerAndZoom(new BMap.Point(vm.CLng, vm.CLat), map.getZoom());
	});

	map.addEventListener("touchend", function () {
		document.body.querySelector("#divStreet").blur();
	});

	map.addEventListener("tilesloaded", function () {
		vm.IsLoadedMap = true;
	});

	//获取定位
	if (vm.CLng && vm.CLat) {
		var point = new BMap.Point(vm.CLng, vm.CLat);
		getLocationInfo(point, vm.LabelAddress, false);
	} else if (vm.Province || vm.City || vm.District || vm.Address) {
		getPointByAddr();
	} else {
		vm.IsLocation = true;
		getLocation();
	}

	//初始化本地搜索
	var options = {
		onSearchComplete: localSerachComplete
	};
	localSearch = new BMap.LocalSearch(map, options);

	//初始化事件
	initEvent();

	prePickArea();

	//var old_back = mui.back();
	mui.back = function () {
		if (vm.IsShowSearch == 1) {
			vm.IsShowSearch = 0;
			setTimeout(function () {
				document.querySelector(".search_box").style.display = "none";
			}, 150);
		} else if (vm.IsShowPick == 1) {
			vm.IsShowPick = 0;
			pickArea.hide("slide-out-bottom");
		} else if (iswaiting) {
			hideWaiting();
		} else {
			plus.webview.currentWebview().close("auto");
		}
	};
};


window.locationBack=function(location){
	vm.CProvince = location.province; //省
	vm.CCity = location.city; //市
	vm.CDistrict = location.street; //街道

	transCProvince();

	vm.LabelAddress = location.address; //详细地址
	vm.CLat = location.lat; //纬度
	vm.CLng = location.lng; //经度


	if (!vm.LocalLat) {
		vm.LocalLat = location.lat; //纬度
	}
	if (!vm.LocalLng) {
		vm.LocalLng = location.lng; //经度
	}
	if (!vm.LocalAddress) {
		vm.LocalAddress = location.address; //详细地址
	}

	map.centerAndZoom(new BMap.Point(location.lng, location.lat), map.getZoom());
	showFooter();
}
var time;
//获取定位
function getLocation() {
	hideWaiting();
	var view = plus.webview.currentWebview();
	view.opener().evalJS("getLocation('"+view.id+"','locationBack')");

	// getGeocode(function(geo) {
	// 	hideWaiting();
	// 	if(geo) {
	// 		//将原始经纬度转换为百度经纬度
	// 		setTimeout(function() {
	// 			var convertor = new BMap.Convertor();
	// 			var pointArr = [];
	// 			pointArr.push(new BMap.Point(geo.longitude, geo.latitude));
	// 			var from = localGet("locationType") == "gcj02" ? 3 : 1;
	// 			convertor.translate(pointArr, from, 5, translateCallback)
	// 		}, 300);

	// 		//坐标转换完之后的回调函数
	// 		translateCallback = function(data) {
	// 			if(data.status === 0) {
	// 				getLocationInfo(data.points[0], (geo.street + geo.poiName), true);
	// 			}
	// 		}
	// 	} else {
	// 		mui.toast("定位失败!");
	// 		var point = map.getCenter();
	// 		vm.CLat = point.lat;
	// 		vm.CLng = point.lng;
	// 		getLocationInfo(point, "");
	// 	}
	// }, "", false);
};

//定位当前位置 李朋2017-06-25 21：03修改
function getCurrentLocation(poi, address, isLocation, province, city, district, isConfirm) {
	map.centerAndZoom(poi, map.getZoom());

	var url = "http://api.map.baidu.com/geocoder/v2/?location=" + poi.lat + "," + poi.lng + "&output=json&pois=1&ak=" + baiduMapConfig.ak;
	getAjaxData(url, function (res) {
		if (res && res.status == 0) {
			hideWaiting();
			vm.CProvince = res.result.addressComponent.province;
			vm.CCity = res.result.addressComponent.city;
			vm.CDistrict = res.result.addressComponent.district;
			//vm.CStreet = res.result.addressComponent.street;
			if (!address) {
				if (res.result.pois.length > 0) {
					address = res.result.pois[0].name;
				} else {
					address = res.result.addressComponent.street + res.result.addressComponent.street_number
				}
			}
			address = address.replace(res.result.addressComponent.province, '');
			address = address.replace(res.result.addressComponent.city, '');
			address = address.replace(res.result.addressComponent.district, '');

			transCProvince();
			vm.LabelAddress = address;
			vm.CLat = res.result.location.lat;
			vm.CLng = res.result.location.lng;

			showFooter(isConfirm);
			if (isLocation) {
				if (!vm.LocalLat) {
					vm.LocalLat = res.result.location.lat;
				}
				if (!vm.LocalLng) {
					vm.LocalLng = res.result.location.lng;
				}
				if (!vm.LocalAddress) {
					vm.LocalAddress = address;
				}
			}
		} else {

		}
	});
};
//获取定位信息
function getLocationInfo(point, address, isLocation, province, city, district, isConfirm) {
	if (point.lng == 0 || point.lat == 0) {
		return;
	}

	setTimeout(function () {
		//		var convertor = new BMap.Convertor();
		//		var pointArr = [];
		//		pointArr.push(point);
		getCurrentLocation(point, address, isLocation, province, city, district, isConfirm);
	}, 300);

	//坐标转换完之后的回调函数
	//	translateCallback = function(data) {
	//		if(data.status === 0) {
	//			map.centerAndZoom(data.points[0], map.getZoom());
	//
	//			var url = "http://api.map.baidu.com/geocoder/v2/?location=" + data.points[0].lat + "," + data.points[0].lng + "&output=json&pois=1&ak="+ baiduMapConfig.ak;
	//			getAjaxData(url, function(res) {
	//				if(res && res.status == 0) {
	//					hideWaiting();
	//					vm.CProvince = res.result.addressComponent.province;
	//					vm.CCity = res.result.addressComponent.city;
	//					vm.CDistrict = res.result.addressComponent.district;
	//					//vm.CStreet = res.result.addressComponent.street;
	//					if(!address) {
	//						if(res.result.pois.length > 0) {
	//							address = res.result.pois[0].name;
	//						} else {
	//							address = res.result.addressComponent.street + res.result.addressComponent.street_number
	//						}
	//					}
	//
	//					address = address.replace(res.result.addressComponent.province, '');
	//					address = address.replace(res.result.addressComponent.city, '');
	//					address = address.replace(res.result.addressComponent.district, '');
	//
	//					transCProvince();
	//
	//					vm.LabelAddress = address;
	//					vm.CLat = res.result.location.lat;
	//					vm.CLng = res.result.location.lng;
	//
	//					showFooter(isConfirm);
	//					if(isLocation) {
	//						if(!vm.LocalLat) {
	//							vm.LocalLat = res.result.location.lat;
	//						}
	//						if(!vm.LocalLng) {
	//							vm.LocalLng = res.result.location.lng;
	//						}
	//						if(!vm.LocalAddress) {
	//							vm.LocalAddress = address;
	//						}
	//					}
	//				} else {
	//
	//				}
	//			});
	//		}
	//	}

};

//本地搜索回调函数
function localSerachComplete(results) {
	// 判断状态是否正确
	if (localSearch.getStatus() == BMAP_STATUS_SUCCESS) {
		//vm.SearchResult = results.ur || results.vr || results.wr;
		vm.SearchResult = [];
		for (var i = 0; i < results.getCurrentNumPois(); i++) {
			vm.SearchResult.push(results.getPoi(i))
		}
		if (results.getCurrentNumPois() == 0) {
			vm.SearchResult = [];
			mui.toast("未找到此地址!");
		}
	} else {
		vm.SearchResult = [];
		mui.toast("未找到此地址!");
	}
};

//逆转地址获得坐标点
function getPointByAddr() {
	var address = "";
	if (vm.Province) {
		address += vm.Province;
	}
	if (vm.City) {
		address += vm.City;
	}
	if (vm.Address) {
		address += vm.Address;
	}

	var url = "http://api.map.baidu.com/geocoder/v2/?address=" + address + "&output=json&ak=" + baiduMapConfig.ak;
	getAjaxData(url, function (res) {
		if (res && res.status == 0) {
			var point = res.result.location;
			getLocationInfo(new BMap.Point(point.lng, point.lat), vm.Address);
		} else {
			map.centerAndZoom(vm.CProvince + vm.CCity + vm.CDistrict, map.getZoom());
			setTimeout(function () {
				var point = map.getCenter();
				getLocationInfo(new BMap.Point(point.lng, point.lat));
			}, 800);
		}
	});

	//	myGeo.getPoint(address, function(point) {
	//		if(point) {
	//			//			map.centerAndZoom(point, map.getZoom());
	//			//			vm.CLat = point.lat;
	//			//			vm.CLng = point.lng;
	//			getLocationInfo(point, vm.Address);
	//		} else {
	//			map.setCenter(vm.CProvince + vm.CCity + vm.CDistrict);
	//			setTimeout(function() {
	//				var point = map.getCenter();
	//				//				vm.CLat = point.lat;
	//				//				vm.CLng = point.lng;
	//				//				showFooter();
	//				getLocationInfo(new BMap.Point(point.lng, point.lat));
	//			}, 800);
	//		}
	//	}, vm.City);
};

function showFooter(isConfirm) {
	if (vm.MapLat && vm.MapLng) {
		if ((new Number(vm.CLat)).toFixed(5) != (new Number(vm.MapLat)).toFixed(5) || (new Number(vm.CLng)).toFixed(5) != (new Number(vm.MapLng)).toFixed(5)) {
			document.body.querySelector("footer").style.display = "block";
			vm.IsShowFooter = 1;
		} else {

			if (vm.Province != vm.CProvince || vm.City != vm.CCity || vm.District != vm.CDistrict || vm.Address != vm.LabelAddress) {
				document.body.querySelector("footer").style.display = "block";
				vm.IsShowFooter = 1;
			} else {
				vm.IsShowFooter = 0;
			}
		}
	} else {
		document.body.querySelector("footer").style.display = "block";
		vm.IsShowFooter = 1;
	}

	if (isConfirm) {
		mui.trigger(document.querySelector("#btnConfirm"), "tap");
		setTimeout(function () {
			document.body.querySelector("#divStreet").focus();
		}, 300);
	}
};
/***百度地图--end--***/

/***初始化事件--start--***/

function initEvent() {

	window.addEventListener('resize', function () {
		var current_height = window.innerHeight;
		if (win_height > current_height) {
			vm.showMapCenter = false;
		} else {
			vm.showMapCenter = true;
		}
	}, false);

	initCityPicker();

	//地图搜索点击
	document.body.querySelector(".search-addr").addEventListener("tap", function () {
		searchAddr();
	});
	document.body.querySelector(".search-addr-body").addEventListener("tap", function () {
		searchAddr();
	});
	document.body.querySelector(".search-addr-it").addEventListener("tap", function () {
		searchAddr();
	});

	//根据关键字搜索
	document.body.querySelector("#btn-search-map").addEventListener("tap", function () {
		if (!vm.SearchAddress) {
			mui.toast("请输入关键字!");
			return;
		}
		document.activeElement.blur();
		//document.body.querySelector("#it_search").blur();
		localSearch.search(vm.SearchAddress);
	});

	//地址选择
	mui(".search_box .search_result").on("tap", ".data-row", function () {
		document.body.querySelector("#it_search").blur();
		var _this = this;
		setTimeout(function () {
			vm.IsShowSearch = 0;
			var lng = _this.getAttribute("data-lng");
			var lat = _this.getAttribute("data-lat");
			var address = _this.getAttribute("data-addr");
			vm.Street = "";
			setTimeout(function () {
				document.querySelector(".search_box").style.display = "none";
			}, 150);
			var point = new BMap.Point(lng, lat);

			getLocationInfo(point, address, "", "", "", "", true);
		}, 500);

	});

	//返回我的定位信息
	document.querySelector("#location_self").addEventListener("tap", function () {
		if (!vm.LocalLat && !vm.LocalLng && !vm.IsLocation) {
			vm.IsLocation = true;
			mui.toast("正在定位...");
			getLocation();
			return;
		}

		if (vm.LocalLat == vm.CLat && vm.LocalLng == vm.CLng) {
			return;
		}

		var point = new BMap.Point(vm.LocalLng, vm.LocalLat);

		getLocationInfo(point, vm.LocalAddress);
	});

	//根据地址解析点
	//	document.querySelector("#location_addr").addEventListener("tap", function() {
	//		document.body.querySelector("#divAddr").blur();
	//		setTimeout(function() {
	//			getPointByAddr();
	//		}, 500);
	//
	//	});

	//确定按钮
	document.querySelector("#btnCancle").addEventListener("tap", function () {
		vm.IsShowFooter = 0;
	});
	document.querySelector("#btnConfirm").addEventListener("tap", function () {
		vm.IsShowFooter = 0;
		vm.Address = vm.LabelAddress;
		vm.Province = vm.CProvince;
		//vm.Street = "";
		vm.City = vm.CCity;
		vm.District = vm.CDistrict;
		//vm.Street = ""; //vm.CStreet
		vm.MapLng = vm.CLng;
		vm.MapLat = vm.CLat;
	});

	document.querySelector("#btn_save").addEventListener("tap", ev_save);
};

function searchAddr() {
	if (!vm.Province && !vm.City) {
		mui.toast("请选择所在地市!");
		return;
	}
	document.body.querySelector(".search_box").style.display = "block";
	vm.SearchAddress = "";
	vm.SearchResult = [];
	vm.IsShowSearch = 1;
	setTimeout(function () {
		document.body.querySelector("#it_search").focus();
	}, 200);
};

//初始化城市选择
function initCityPicker() {
	mui("body").on("tap", ".chooseArea", function () {
		document.body.querySelector("#divStreet").blur();
		showPickArea();
	});
};

function transProvince() {
	if (vm.IsOld) {
		if (vm.Province == "内蒙古自治区") {
			vm.Province = "内蒙古";
		} else if (vm.Province == "新疆维吾尔自治区") {
			vm.Province = "新疆";
		} else if (vm.Province == "广西壮族自治区") {
			vm.Province = "广西";
		} else if (vm.Province == "西藏自治区") {
			vm.Province = "西藏";
		} else if (vm.Province == "宁夏回族自治区") {
			vm.Province = "宁夏";
		} else if (vm.Province == "澳门特别行政区") {
			vm.Province = "澳门";
		} else if (vm.Province == "香港特别行政区") {
			vm.Province = "香港";
		} else {
			vm.Province = (vm.Province || "");
		}

		if (vm.City == "香港特别行政区") {
			vm.City = "香港";
		} else if (vm.City == "澳门特别行政区") {
			vm.City = "澳门";
		}
	}
};

function transCProvince() {

	if (vm.IsOld) {
		if (vm.CProvince == "内蒙古自治区") {
			vm.CProvince = "内蒙古";
		} else if (vm.CProvince == "新疆维吾尔自治区") {
			vm.CProvince = "新疆";
		} else if (vm.CProvince == "广西壮族自治区") {
			vm.CProvince = "广西";
		} else if (vm.CProvince == "西藏自治区") {
			vm.CProvince = "西藏";
		} else if (vm.CProvince == "宁夏回族自治区") {
			vm.CProvince = "宁夏";
		} else if (vm.CProvince == "澳门特别行政区") {
			vm.CProvince = "澳门";
		} else if (vm.CProvince == "香港特别行政区") {
			vm.CProvince = "香港";
		} else {
			vm.CProvince = (vm.CProvince || "");
		}

		if (vm.CCity == "香港特别行政区") {
			vm.CCity = "香港";
		} else if (vm.CCity == "澳门特别行政区") {
			vm.CCity = "澳门";
		}

		vm.CProvince = vm.CProvince.replace("省", "").replace("市", "");
		vm.CCity = vm.CCity.replace("市", "");
	}
};

//保存
function ev_save() {

	if (vm.IsShowFooter == 1) {
		mui.confirm("地图中的位置发生了改变，是否使用此地址？", "提示", ["确定", "取消"], function (e) {
			if (e.index == 0) {
				mui.trigger(document.querySelector("#btnConfirm"), "tap");
				ev_save();
			}
		});
		return;
	}

	if (isNetWorkCanUse()) {
		if (!vm.MapLat && !vm.MapLng) {
			mui.toast("请选择地址!");
			return;
		}
	}
	if (!vm.Province || !vm.City) {
		mui.toast("请选择所在地市!");
		return;
	}

	if (!vm.Address.trim()) {
		mui.toast("请输入详细地址!");
		return;
	}
	if (vm.Street.trim() && vm.Street.trim().length > 30) {
		mui.toast("街道信息最长30!");
		return;
	}
	//	if(!vm.Street.trim() || /\s+/g.test(vm.Address)) {
	//		mui.toast("请输入街道门牌!");
	//		return;
	//	}

	if (vm.IsOld) {

		transProvince();
	}

	//触发上一个页面的getArea事件
	var tempData = {
		"Province": vm.Province,
		"City": vm.City,
		"District": vm.District,
		"Address": vm.Address.trim(),
		"Lat": vm.MapLat,
		"Lng": vm.MapLng,
		"Street": vm.Street || ""
	};
	//out-bound.html页面回调 2018-3-20 john
	if (vm.fromPage) {
		RpcClient.invoke("out-bound.html", "RPC_getAddressInfo", tempData);
	}
	var view = plus.webview.currentWebview();
	var opener = view.opener();
	if (view.callback) {
		opener.evalJS(view.callback + "(" + JSON.stringify(tempData) + ")")
	}

	mui.back();
};
/***初始化事件--end--***/

/***
 *********************预加载选择区域************************
 ****/

//选址窗口
var pickArea;

//预加载选址窗口
function prePickArea(callback) {

	var pickName = "";
	if (vm.IsOld) {
		pickName = "pickareas-old.html";
	} else {
		pickName = "pickareas.html";
	}

	if (plus.webview.getWebviewById(pickName)) {
		plus.webview.getWebviewById(pickName).close();
	}

	//创建选型界面
	pickArea = plus.webview.create(pickName, pickName, {
		height: "400px",
		margin: "auto",
		scrollIndicator: 'none',
		scalable: false,
		bottom: '0',
		background: 'transparent',
		popGesture: 'none'
	}, {
		callback: "pickAreaCallback",
		opener: plus.webview.currentWebview().id
	});

	//选型界面隐藏事件
	pickArea.addEventListener("hide", function () {
		plus.webview.currentWebview().setStyle({
			mask: "none"
		});
	});

	//当前窗口关闭事件
	plus.webview.currentWebview().addEventListener("close", function () {
		pickArea.close("none");
	});

	//遮罩点击事件
	//遮罩点击事件
	plus.webview.currentWebview().addEventListener("maskClick", function () {
		vm.IsShowPick = 0;
		pickArea.hide("slide-out-bottom");
		plus.webview.currentWebview().setStyle({
			mask: "none"
		});
	}, false);

	if (typeof (callback) == "function") {
		callback();
	}
};

//选址回调函数
function pickAreaCallback(province, city, district) {
	vm.IsShowPick = 0;
	pickArea.hide("slide-out-bottom");
	vm.CProvince = vm.Province = province;
	vm.CCity = vm.City = city;
	vm.CDistrict = vm.District = district;
	map.centerAndZoom(vm.CProvince + vm.CCity + vm.CDistrict, map.getZoom());
	vm.Address = "";
	//vm.Street = "";
	setTimeout(function () {
		var point = map.getCenter();

		getLocationInfo(point, "", "", vm.CProvince, vm.CCity, vm.CDistrict);
	}, 800);
	//地图高度自适应
	var map_high = document.querySelector(".mui-content").offsetHeight + "px";
	document.getElementById("dv_map").style.top = map_high;
};

//显示选型界面
function showPickArea() {
	vm.IsShowPick = 1;
	if (!pickArea) {
		prePickArea(function () {
			pickArea.show('slide-in-bottom', 300);

			pickArea.evalJS("loadData('" + vm.Province + "','" + vm.City + "','" + vm.District + "')")

			plus.webview.currentWebview().setStyle({
				mask: "rgba(0,0,0,0.2)"
			});

		});
	} else {
		pickArea.show('slide-in-bottom', 300);

		pickArea.evalJS("loadData('" + vm.Province + "','" + vm.City + "','" + vm.District + "')")

		plus.webview.currentWebview().setStyle({
			mask: "rgba(0,0,0,0.2)"
		});
	}

};