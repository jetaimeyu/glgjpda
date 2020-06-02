var muiObj = {
	init: function() {
		mui.init();

		mui.plusReady(this.readyCallback);
	},
	readyCallback: function() {
		
		var view = plus.webview.currentWebview();
		
		if(view.data)
		{
			vm.parentData = view.data;
		}
		
		user.ready(function() {
			dom.plugin.mescroll.init();
		});
	}
};

var dom = {
	init: function() {
		this.event.init();
		this.event.initEditAddr();
		this.event.initSelected();
	},
	event: {
		init: function() {
			this.initAddAddr();
		},
		initAddAddr: function() {
			document.querySelector("#add-addr").addEventListener("tap", function() {
				openWindow("add-addr.html", {
					callback: "dom.refresh"
				}, "add-addr.html");
			});
		},
		initEditAddr: function() {
			mui(".data-group").on("tap", ".opt_right", function(_event) {
				_event.stopPropagation();

				var idx = this.parentElement.getAttribute("data-idx");

				openWindow("add-addr.html", {
					data: vm.address[idx].$model,
					callback: "dom.refresh"
				}, "edit-addr.html");
			})
		},
		initSelected: function() {
			mui(".data-group").on("tap", ".data-row", function(_event) {
				_event.stopPropagation();

				var idx = this.getAttribute("data-idx");

				var view = plus.webview.currentWebview();
				if(view.callback) {
					view.opener().evalJS(view.callback + "(" + JSON.stringify(vm.address[idx].$model) + ")");
				}
				mui.back();
			})
		}
	},
	plugin: {
		mescroll: {
			obj: "",
			init: function() {

				this.obj = new MeScroll("mescroll", {
					down: {
						use: true,
						auto: true,
					},
					up: {
						use: true,
						auto: false,
						noMoreSize: 15,
						offset: 100,
						page: {
							num: 0,
							size: 10000,
							time: null
						},
						htmlLoading: '<p class="upwarp-progress mescroll-rotate"></p><p class="upwarp-tip">正在加载地址..</p>',
						htmlNodata: '<p class="upwarp-nodata">-- 我是有底线的 --</p>',
						empty: {
							warpId: "mescroll-empty",
							icon: null,
							tip: "暂无收货地址~",
							btntext: "",
							btnClick: null
						},
						callback: dom.plugin.mescroll.upCallback
					}
				});
			},
			upCallback: function(page) {
				curData.load(page.num, function(res) {
					if(res && res.State > 0) {
						dom.plugin.mescroll.obj.endSuccess(res.Data.length);
						if(page.num == 1) {
							vm.address = [];
						}
						vm.address.pushArray(res.Data)
					} else {
						mui.toast(res.ErrorMessage);
						dom.plugin.mescroll.obj.endErr();
					}
				});
			}

		}
	},
	refresh: function(type,id) {

		if((type == "edit" || type == "del") && vm.parentData.ID==id) {
			var view = plus.webview.currentWebview();
			if(view.callback) {
				view.opener().evalJS(view.callback + "('','"+type+"')");
			}
		}

		dom.plugin.mescroll.obj.triggerDownScroll();
	}
};

var curData = {
	load: function(page, callback) {

		var url = MdAppUrl.Api42 + "/api/PostAddr/GetList";

		getAjaxData(url, function(res) {
			if(typeof callback == "function") {
				callback(res);
			}
		}, true);
	}
};

var vm = avalon.define({
	$id: "myCtl",
	address: [],
	parentData:{},
	userId: query("id"),
	contractAddress: contractAddress,
});

muiObj.init();
dom.init();