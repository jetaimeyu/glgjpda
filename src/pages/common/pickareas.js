var vm = avalon.define({
	$id: "myCtl",
	isReturn: true,
	province: "",
	chooseIdx: 1,
	level: 2,
	ReturnType: 3,
	chooseLevel: 3,
	city: "",
	district: "",
	provinceList: [],
	cityList: [],
	districtList: []
});

vm.$watch("province", function(value) {
	var city = cityData[vm.province];
	vm.city = "";
	vm.cityList = [];
	if(city) {
		vm.district = "";
		vm.chooseIdx = 2;
		if(vm.ReturnType == 2) {
			for(var i in city) {
				vm.cityList.push(i);
			}
		} else {
			if(Object.getOwnPropertyNames(city).length == 1) {
				vm.level = 2;
				var list = cityData[vm.province][Object.getOwnPropertyNames(city)[0]];
				if(list.length == 0) {
					vm.chooseLevel = 2;
					vm.cityList.push(Object.getOwnPropertyNames(city)[0]);
				} else {
					vm.chooseLevel = 3;
					vm.cityList = list;
				}
			} else {
				vm.level = 3;
				vm.chooseLevel = 3;
				for(var i in city) {
					vm.cityList.push(i);
				}
			}
		}

	} else {
		vm.province = "";
		vm.city = "";
		vm.district = "";
	}
});
vm.$watch("city", function(value) {
	vm.district = "";
	if(vm.city) {
		if(vm.ReturnType == 2) {
			callbackData();
		} else {
			if(vm.level == 3) {
				vm.districtList = cityData[vm.province][vm.city] || [];
				if(vm.districtList.length > 0) {
					vm.chooseIdx = 3;
				} else {
					callbackData();
				}

			} else {
				callbackData();
			}
		}

	}

});
vm.$watch("district", function(value) {
	if(vm.district) {
		callbackData();
	}
});

var callback;
var viewId;

mui.init();
mui.plusReady(function() {
	var view = plus.webview.currentWebview();
	callback = view.callback;
	viewId = view.opener;

	//重写back方法
	mui.back = function() {
		plus.webview.currentWebview().hide("slide-out-bottom");
	};
});

mui.ready(function() {
	//初始化省
	initProvince();

	document.body.querySelector("#cityselect-content").addEventListener("drag", function(event) {
		if(event.detail.deltaX < -50) {
			if(vm.level == 3 && vm.chooseIdx == 2) {
				vm.chooseIdx = 3;
			}
		} else if(event.detail.deltaX > 50) {
			if(vm.chooseIdx == 3) {
				vm.chooseIdx = 2;
			}
		}

	});
});

//初始化省数据
function initProvince() {
	for(var i in cityData) {
		vm.provinceList.push(i);
	}
};

function loadData(province, city, district, returnType) {

	vm.ReturnType = returnType || 3;

	vm.isReturn = false;
	if(province == city && !district) {
		vm.chooseIdx = 2;
		vm.province = province;
		vm.city = city;
	} else if(province == city && province) {
		vm.chooseIdx = 2;
		vm.province = province;
		vm.city = district;
	} else if(province && city && district) {
		vm.chooseIdx = 3;
		vm.province = province;
		vm.city = city;
		vm.district = district;
	} else if(province && city) {
		vm.chooseIdx = 2;
		vm.province = province;
		vm.city = city;
		vm.district = "";
	}

	setTimeout(function() {
		//document.body.querySelector("#item-province .crt")
		var itemProvince = document.body.querySelector("#item-province .crt");
		var itemCity = document.body.querySelector("#item-city .crt");
		var itemDistrict = document.body.querySelector("#item-district");

		var scrollTop;
		if(itemProvince) {
			document.body.querySelector(".cityselect-item-box").style.display = "block";
			scrollTop = itemProvince.offsetTop - 85;
			if(scrollTop > 140) {
				document.body.querySelector("#item-province").scrollTop = scrollTop - 120;
				setTimeout(function() {
					document.body.querySelector("#item-province").scrollTop += 1;
				}, 50);
			} else {
				document.body.querySelector("#item-province").scrollTop = 0;
			}
		}
		if(itemCity) {
			scrollTop = itemCity.offsetTop - 85;
			if(scrollTop > 140) {
				document.body.querySelector("#item-city").scrollTop = scrollTop - 120;
			} else {
				document.body.querySelector("#item-city").scrollTop = 0;
			}
		}

		if(itemDistrict) {
			scrollTop = itemDistrict - 85;
			if(scrollTop > 140) {
				document.body.querySelector("#item-district").scrollTop = scrollTop - 120;
			} else {
				document.body.querySelector("#item-district").scrollTop = 0;
			}
		}
	}, 300)
};

mui(".m-cityselect").on("tap", ".cityselect-item a", function() {
	vm.isReturn = true;
	var idx = this.parentElement.getAttribute("data-idx");
	var value = this.getAttribute("data-value");
	switch(idx) {
		case "1": //选择省
			vm.province = value;
			break;
		case "2": //选择市或区
			vm.city = value;
			break;
		case "3": //选择区
			vm.district = value;
			break;
	}
});

mui(".m-cityselect").on("tap", ".cityselect-nav a", function() {
	var idx = this.getAttribute("data-idx");
	vm.chooseIdx = parseInt(idx);

});

function callbackData() {
	if(callback && viewId && vm.isReturn) {
		if(vm.ReturnType == 2) {
			plus.webview.getWebviewById(viewId).evalJS(callback + "('" + vm.province + "','" + vm.city + "')");
		} else {
			var province = vm.province;
			var city = "",
				district = "";
			if(vm.chooseLevel == 2) {
				city = vm.province;
				district = "";
			} else if(vm.chooseLevel == 3) {
				city = vm.level == 2 ? vm.province : vm.city;
				district = vm.level == 2 ? vm.city : vm.district;
			}

			plus.webview.getWebviewById(viewId).evalJS(callback + "('" + province + "','" + city + "','" + district + "')");
		}

	}
};