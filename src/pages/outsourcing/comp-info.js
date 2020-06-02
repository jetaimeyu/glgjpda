//mui事件
var muiObj = {
	init: function() {
		mui.init();
		muiObj.ready();
	},
	readyEvent: function() {

		var curView = plus.webview.currentWebview();

		vm.compData = curView.data;

		user.ready(function() {
			if(user.UserID > 0) {
				abilityData.resource.have();
			}
		});
	},
	ready: function() {
		mui.plusReady(muiObj.readyEvent);
	}
};

var dom = {
	init: function() {
		dom.event.init();
		dom.plugin.init();
		this.event.initBtns();
	},
	event: {
		init: function() {
			dom.event.initKefu();
		},
		initKefu: function() {
			mui("header").on("tap", ".comp-kefu", function() {
				if(vm.compData.Phone || vm.compData.Tel) {
					plus.device.dial(vm.compData.Phone || vm.compData.Tel);
				} else {
					mui.toast("该企业未公开电话")
				}
			});
		},
		initBtns: function() {
			mui(".info-btns").on("tap", ".btn_add", function() {

				if(user.UserID > 0 && user.CompID == 0) {
					mui.toast("请使用企业帐号登录后加为资源！");
					return;
				}

				if(vm.compId == user.CompID) {
					mui.toast('不能添加自己的企业作为资源！');
					return;
				}

				if(user.UserID == 0) {
					dom.event.openLogin(function() {
						user.ready(function() {
							if(user.UserID > 0) {
								abilityData.resource.have();
							}
						});
					})
				} else {
					openWindow("../complib/addRes.html?compid=" + vm.compId, {
						callback: "abilityData.resource.dirBack"
					})
				}
			}).on("tap", ".btn_delete", function() {
				abilityData.resource.remove();
			}).on("tap", ".btn_call", function() {
				openWindow("../complib/index.html?compid=" + vm.compId + "&tabidx=3&isResource=" + (vm.isResource ? 1 : 0));
			}).on("tap", ".btn_send", function() {
				if(user.UserID == 0) {
					dom.event.openLogin(function() {
						user.ready(function() {
							if(user.UserID > 0) {
								abilityData.resource.have();
								dom.event.openDemand();
							}
						});
					})
				} else {
					dom.event.openDemand();
				}
			});
		},
		openDemand: function() {
			if(user.UserID > 0 && user.CompID > 0 && user.CompID != vm.compId) {
				openWindow("demand-edit.html?compId=" + vm.compId + "&compName=" + encodeURI(vm.compData.CompName));
			} else if(user.UserID > 0 && user.CompID == 0) {
				mui.toast("请使用企业帐号登录后发送外协需求！");
				return;
			} else if(user.UserID > 0 && user.CompID > 0 && user.CompID == vm.compId) {
				mui.toast("不能给自己的企业发送外协需求！");
				return;
			}
		},
		openLogin: function(callback) {
			var loginView = muiOpenWindow("../login/login.html");
			loginView.addEventListener("close", function() {
				if(typeof callback == "function") {
					callback();
				}
			})
		}
	},
	plugin: {
		init: function() {
			dom.plugin.mescroll.load();
		},
		mescroll: {
			obj: "",
			load: function() {
				dom.plugin.mescroll.obj = new MeScroll("mescroll", {
					down: {
						use: false
					},
					up: {
						use: true,
						auto: true,
						noMoreSize: 10,
						offset: 100,
						page: {
							num: 0,
							size: 20,
							time: null
						},
						onScroll: function(mescroll, y) {
							if(y > 100) {
								mui(".mui-bar-nav")[0].style.backgroundColor = "rgba(25, 117, 207, 1)";
								mui(".mui-bar-nav h1")[0].innerText = vm.compData.CompName;
							} else {
								if(y < 0) {
									mui(".mui-bar-nav h1")[0].innerText = "";
									mui(".mui-bar-nav")[0].style.backgroundColor = "rgba(25, 117, 207, 1)";
								} else {
									mui(".mui-bar-nav")[0].style.backgroundColor = "rgba(25, 117, 207, 0." + y + ")";
									mui(".mui-bar-nav h1")[0].innerText = "";
								}

							}
						},

						htmlLoading: '<p class="upwarp-progress mescroll-rotate"></p><p class="upwarp-tip">正在加载外协设备..</p>',
						htmlNodata: '<p class="upwarp-nodata">-- 我是有底线的 --</p>',
						empty: {
							warpId: "mescroll-empty",
							icon: null,
							tip: "该企业暂无外协设备~",
							btntext: "",
							btnClick: null
						},
						callback: dom.plugin.mescroll.upCallback //上拉加载的回调
					}
				});
			},
			upCallback: function(page) {
				abilityData.load(page.num, function(state, data) {

					if(state > 0) {
						dom.plugin.mescroll.obj.endSuccess(data.DataRows.length);
						vm.abilityData.pushArray(data.DataRows);
					} else {
						dom.plugin.mescroll.obj.endErr();
					}
				});
			}

		}

	}
};

var abilityData = {
	count: 20,
	load: function(page, callback) {
		var url = MdAppUrl.Api45 + "/api/v1.0/Equipment/GetEqListForMobile?compId=" + vm.compId + "&page=" + page + "&pageSize=" + abilityData.count;

		getAjaxData(url, function(res) {

			if(typeof callback == "function") {
				callback(res.State, res.Data)
			}
		});
	},
	resource: {
		isSaveing: false,
		have: function() {
			if(user.CompID == vm.compId && user.CompID > 0) {
				return;
			}

			if(abilityData.resource.isSaveing) {
				return;
			}
			abilityData.resource.isSaveing = true;
			var url = MdAppUrl.Api + "/res/ResIsExistsComp?userid=" + user.UserID;

			var data = {
				CompID: vm.compId,
				CreateCompID: user.CompID
			};

			postAjaxData(url, data, function(res) {
				abilityData.resource.isSaveing = false;
				if(res && res.State > 0) {
					vm.isResource = false;

				} else {
					vm.isResource = true;
				}
			});
		},
		add: function(groupId) {
			if(abilityData.resource.isSaveing) {
				return;
			}
			showWaiting();
			abilityData.resource.isSaveing = true;
			var url = MdAppUrl.Api + "/res/AddResComp?userid=" + user.UserID;
			var data = {
				GroupID: groupId,
				CompID: vm.compId,
				ItemType: 0,
				CreateCompID: user.UserID
			};

			postAjaxData(url, data, function(res) {
				hideWaiting();
				abilityData.resource.isSaveing = false;
				if(res && res.State > 0) {
					vm.isResource = true;
					//刷新资源
					RpcClient.invoke("my-res.html", "RPC_Ref");

					mui.toast("加为资源成功！");
				} else {
					mui.toast("加为资源失败！");
				}
			});
		},
		remove: function() {
			if(abilityData.resource.isSaveing) {
				return;
			}
			showWaiting();
			abilityData.resource.isSaveing = true;
			var url = MdAppUrl.Api + "/res/DeleteResCompByUserID";
			var data = {
				CompID: vm.compId,
				CreateUser: user.UserID
			};

			postAjaxData(url, data, function(res) {
				hideWaiting();
				abilityData.resource.isSaveing = false;
				if(res && res.State > 0) {
					vm.isResource = false;
					//刷新资源
					RpcClient.invoke("my-res.html", "RPC_Ref");
					mui.toast("移除资源成功！")
				} else {
					mui.toast("移除资源失败！")
				}
			});
		},
		dirBack: function(data) {
			this.add(data.id);
		}
	}

};

//avalon事件
var vm = avalon.define({
	$id: "myCtl",
	compId: query("id"),
	compData: {},
	isResource: false,
	getCompLogo: function() {
		return 'http://pic.maidiyun.com/Y29tcC9sb2dv_' + vm.compId + '_60x60.png';
	},
	getAbilityLogo: function(id, ex) {
		return MdAppUrl.Api45 + "/api/v1/Equipment/" + id + ex + ".png";
	},
	abilityData: []

});
mui.plusReady(function() {
	muiObj.init();
	dom.init();
})