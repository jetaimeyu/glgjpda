var muiObj = {
	init: function() {
		mui.init();
		mui.plusReady(this.plusReadyCallback);
	},
	plusReadyCallback: function() {

		dom.picker.init();

		var curView = plus.webview.currentWebview();

		if(curView.data) {
			vm.address = curView.data;
		}

		user.ready(function() {
			vm.address.UserID = user.UserID;
		});
	}
};

var dom = {
	init: function() {
		dom.event.init();
	},
	event: {
		init: function() {
			this.saveEvent();
			this.delEvent();
			this.pickAddrEvnet();
			this.inputFilter();
		},
		saveEvent: function() {

			document.querySelector(".save-btn").addEventListener("tap", function() {
				document.activeElement.blur();
				if(dom.form.check()) {
					curData.save();
				}
			})
			//			mui("header").on("tap", ".mui-pull-right", function() {
			//				console.log("sdfsdfsdf")
			//				if(dom.form.check()) {
			//					curData.save();
			//				}
			//
			//			});
		},
		delEvent: function() {
			document.querySelector(".delete-addr .body").addEventListener("tap", function() {
				mui.confirm("确定删除此收货地址？", "删除", ["取消", "确定"], function(e) {
					if(e.index == 1) {
						document.activeElement.blur();
						curData.del();
					}
				});
			});
		},
		pickAddrEvnet: function() {
			mui(".pick-addr").on("tap", ".body,.opt", function() {

				document.activeElement.blur();

				dom.picker.show();
			})
		},
		inputFilter: function() {
			document.getElementById("input_name").addEventListener("blur", function() {
				var value = dom.form.transEmotion(vm.address.RecvUserName);
				vm.address.RecvUserName = value;
			});

			document.getElementById("input_address").addEventListener("blur", function() {
				var value = dom.form.transEmotion(vm.address.Address);
				vm.address.Address = value;
			});
		}
	},
	picker: {
		obj: "",
		properties: {
			path: "../common/pickareas.html",
			id: "add-addr-pickareas"
		},
		init: function() {
			if(plus.webview.getWebviewById(dom.picker.properties.id)) {
				plus.webview.getWebviewById(dom.picker.properties.id).close();
			}

			//创建选型界面
			dom.picker.obj = plus.webview.create(dom.picker.properties.path, dom.picker.properties.id, {
				height: "400px",
				margin: "auto",
				scrollIndicator: 'none',
				scalable: false,
				bottom: '0',
				background: 'transparent',
				popGesture: 'none'
			}, {
				callback: "dom.picker.callback",
				opener: plus.webview.currentWebview().id
			});

			//选型界面隐藏事件
			dom.picker.obj.addEventListener("hide", function() {
				plus.webview.currentWebview().setStyle({
					mask: "none"
				});
			});

			//当前窗口关闭事件
			plus.webview.currentWebview().addEventListener("close", function() {
				dom.picker.obj.close("none");
			});

			//遮罩点击事件
			//遮罩点击事件
			plus.webview.currentWebview().addEventListener("maskClick", function() {
				dom.picker.hide();
			}, false);

		},
		callback: function(province, city, district) {
			vm.address.Province = province;
			vm.address.City = city;
			vm.address.District = district;
			dom.picker.hide();
		},
		show: function() {
			dom.picker.obj.show('slide-in-bottom', 300);
			dom.picker.obj.evalJS("loadData('" + vm.address.Province + "','" + vm.address.City + "','" + vm.address.District + "',1)")
			plus.webview.currentWebview().setStyle({
				mask: "rgba(0,0,0,0.2)"
			});
		},
		hide: function() {
			dom.picker.obj.hide("slide-out-bottom", 200);
			plus.webview.currentWebview().setStyle({
				mask: "none"
			});
		}
	},
	form: {
		check: function() {
			if(/^\s*$/g.test(vm.address.RecvUserName)) {
				mui.toast("请填写收货人姓名");
				return false;
			}
			if(vm.address.RecvUserName.length > 30) {
				mui.toast("收货人姓名不能超过30个字，请重新填写！");
				return false;
			}

			if(/^\s*$/g.test(vm.address.LinkPhone)) {
				mui.toast("请填写联系电话");
				return false;
			}

			var mobile = /^1[3|5|6|7|8]\d{9}$/,
				phone = /^0\d{2,3}-?\d{7,8}$/;

			if(vm.address.LinkPhone && !(mobile.test(vm.address.LinkPhone) || phone.test(vm.address.LinkPhone))) {
				mui.toast("您输入的联系电话不正确");
				return false;
			}

			if(vm.address.LinkPhone.length > 20) {
				mui.toast("联系电话不能超过20个字，请重新填写！");
				return false;
			}

			if(/^\s*$/g.test(vm.address.Province)) {
				mui.toast("请选择所在地区");
				return false;
			}
			if(/^\s*$/g.test(vm.address.Address)) {
				mui.toast("请填写详细地址");
				return false;
			}
			if(vm.address.Address.length < 5) {
				mui.toast("详细地址小于五个字，请重新填写！");
				return false;
			}

			if(vm.address.Address.length > 128) {
				mui.toast("详细地址不能超过128个字，请重新填写！");
				return false;
			}

			return true;
		},
		transEmotion: function(str) {
			var patt = /[\ud800-\udbff][\udc00-\udfff]/g;
			str = str.replace(patt, function(char) {
				var H, L, code;
				if(char.length === 2) {
					H = char.charCodeAt(0);
					L = char.charCodeAt(1);
					code = (H - 0xD800) * 0x400 + 0x10000 + L - 0xDC00;
					return "";
				} else {
					return char;
				}
			});
			return str;
		}

	}
};

var curData = {
	save: function() {
		showWaiting();
		vm.address.Street="";
		var url = "";
		if(vm.address.ID) {
			url = MdAppUrl.Api42 + "/api/PostAddr/Edit";
		} else {
			url = MdAppUrl.Api42 + "/api/PostAddr/Add";
		}

		postAjaxData(url, vm.address.$model, function(reData) {
			hideWaiting();
			if(reData && reData.State == 1 && (reData.Data == true || reData.Data > 0)) {
				mui.toast("保存成功！");

				var view = plus.webview.currentWebview();
				var opener = view.opener();
				if(view.callback) {
					var type = vm.address.ID ? 'edit' : 'add';
					opener.evalJS(view.callback + "('" + type + "'," + vm.address.ID + ")");
				}
				mui.back();
			} else {
				mui.toast("保存收货地址失败，请于稍后再试！");
			}
		}, true);
	},
	del: function() {
		showWaiting();
		var url = MdAppUrl.Api42 + "/api/PostAddr/Delete?addrID=" + vm.address.ID;
		getAjaxData(url, function(reData) {
			hideWaiting();
			if(reData && reData.State == 1 && reData.Data == true) {
				mui.toast("删除成功");

				var view = plus.webview.currentWebview();
				var opener = view.opener();
				if(view.callback) {
					opener.evalJS(view.callback + "('del'," + vm.address.ID + ")");
				}

				mui.back();
			}
		}, true);
	}

};

var vm = avalon.define({
	$id: "myCtl",
	address: {
		Address: "",
		City: "",
		CityCode: "",
		District: "",
		ID: 0,
		IsDefault: "",
		LinkPhone: "",
		MapLat: 0,
		MapLng: 0,
		Province: "",
		ProvinceCode: "",
		RecvUserName: "",
		Street: "",
		UserID: "",
		ZipCode: ""
	},
	contractAddress: contractAddress
});

muiObj.init();
dom.init();