var isTitle = query("isTitle");
if (isTitle == "false") {
	document.querySelector(".mui-bar-nav").style.display = "none";
} else {
	document.querySelector(".mui-bar-nav").style.display = "block";
}

var muiObj = {
	init: function() {
		mui.init();

		mui('.mui-scroll-wrapper').scroll({
			indicators: true //是否显示滚动条
		});
		muiObj.plusreadyInit()
	},
	plusreadyInit: function() {
		mui.plusReady(muiObj.plusReadyCallback)
	},
	plusReadyCallback: function() {
		user.ready(function() {
			dom.plugin.mescroll.init();
		});
	}
};
mui('.mui-slider').slider().stopped = true;
mui()
var dom = {
	init: function() {
		dom.event.init();
	},
	event: {
		init: function() {
			dom.event.slider.init();

			dom.event.initDemandItem();
		},
		slider: {
			dom: document.getElementById('slider'),
			init: function() {
				dom.event.slider.dom.addEventListener('slide', function(e) {
					dom.event.slider.change(e.detail.slideNumber);
				});
				mui("#slider").on('tap','.mui-control-item', function(e) {
					var slideNumber=this.getAttribute("sid")
					dom.event.slider.change(slideNumber);
				})
			},
			change: function(num) {
				vm.curTab = parseInt(num);
				switch(vm.curTab) {
					case 0:
						vm.state = -1;
						break;
					case 1:
						vm.state = 1;
						break;
					case 2:
						vm.state = 2;
						break;
					case 3:
						vm.state = 0;
						break;
					case 4:
						vm.state = 9;
						break;
				}
				dom.plugin.mescroll.init();
			}
		},
		initDemandItem: function() {

			mui(".mui-slider-group").on("tap", ".item_box", function() {
				var id = this.getAttribute("data-id");
				var state = this.getAttribute("data-state");
				if(state == "2") {
					openWindow("demand_details.html?demandId=" + id)
				} else if(state != "0") {
					openWindow("demand.html?demandId=" + id)
				} else {
					openWindow("demand-edit.html?id=" + id)
				}
			});
			mui("body").on("tap",".menu-add",function(e){
				openWindow("demand-edit.html")
			})
		}
	},
	plugin: {
		mescroll: {
			scrollData: ["", "", "", "", ""],
			init: function() {

				if(dom.plugin.mescroll.scrollData[vm.curTab]) {
					if(vm.isTriggerDown[vm.curTab]) {
						dom.plugin.mescroll.scrollData[vm.curTab].triggerDownScroll();
					}
					return;
				}

				dom.plugin.mescroll.scrollData[vm.curTab] = new MeScroll("tabBody_" + vm.curTab, {
					down: {
						use: true,
						auto: true,
					},
					up: {
						use: true,
						auto: false,
						noMoreSize: 6,
						offset: 100,
						page: {
							num: 0,
							size: 20,
							time: null
						},
						htmlLoading: '<p class="upwarp-progress mescroll-rotate"></p><p class="upwarp-tip">正在加载需求..</p>',
						htmlNodata: '<p class="upwarp-nodata">-- 我是有底线的 --</p>',
						empty: {
							warpId: "mescroll-empty" + vm.curTab,
							icon: null,
							tip: "暂无需求~",
							btntext: "",
							btnClick: null
						},
						callback: dom.plugin.mescroll.upCallback
					}
				});
			},
			upCallback: function(page) {
				curData.load(page.num, function(res) {
					if(res.State > 0) {
						dom.plugin.mescroll.scrollData[vm.curTab].endSuccess(res.Data.DataRows.length);
						if(page.num == 1) {
							vm["dataTab" + vm.curTab] = [];
						}
						vm["dataTab" + vm.curTab].pushArray(res.Data.DataRows)
					} else {
						mui.toast(res.ErrorMessage);
						dom.plugin.mescroll.scrollData[vm.curTab].endErr();
					}
				});
			}
		}
	},
	Refresh: function() {
		var scroll = dom.plugin.mescroll.scrollData[vm.curTab];

		if(scroll) {
			scroll.triggerDownScroll();
		}

		for(var i = 0; i < vm.isTriggerDown.length; i++) {
			if(i != vm.curTab) {
				vm.isTriggerDown[i] = true;
			}
		}
	}
};

var curData = {
	load: function(page, callback) {
//		var url = MdAppUrl.Api45 + "/api/v1/EpDemand/GetDemandListForUser?state=" + vm.state + "&page=" + page + "&pageSize=20";
//获取企业需求信息列表
	   var url = MdAppUrl.Api45 + "/api/v1/EpDemand/GetDemandList?state=" + vm.state + "&page=" + page + "&pageSize=20";

		getAjaxData(url, function(res) {
			if(typeof callback == "function") {
				callback(res);
			}
		}, true);

	}
};
var vm = avalon.define({
	$id: "myCtl",
	state: -1,
	curTab: 0,
	isTitle:isTitle,
	isTriggerDown: [false, false, false, false, false],
	dataTab0: [],
	dataTab1: [],
	dataTab2: [],
	dataTab3: [],
	dataTab4: [],
	getLogo: function(id, ext) {
		if(id) {
			return MdAppUrl.Api45 + "/api/v1.0/epdemand/" + id + "_100x0" + ext;
		} else {
			return "../../images/mdempty1.png";
		}
	}
});

muiObj.init();
dom.init();
RpcServer.expose("RPC_Refresh_demand_list",function(){
	muiObj.init();
dom.init();
})