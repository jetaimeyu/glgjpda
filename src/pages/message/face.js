/**
 * mui初始化
 * **/
var muiObj = {
	init: function() {
		mui.init();
		dom.init();
	},
	plusReady: function() {
		dom.webView.init();
	}
};

/**
 * 界面初始化
 * **/
var dom = {
	properties: {
		faces: "",
		scope: "",
		UtilsService: ""

	},
	webView: {
		cur: "",
		parent: "",
		callback: "",
		init: function() {
			this.cur = plus.webview.currentWebview();
			this.parent = this.cur.opener();
			this.callback = this.cur.callback;
		},
		chooseUser: {
			callback: function(data) {
				var backData = {
					event: "card",
					value: data[0]
				};

				dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(backData) + "')");
			},
			open: function() {
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "contact-select.html",
					url: "../common/contact-select.html?action=select&multiselect=false&must=true",
					extras: {
						selectObj: [],
						callback: "dom.webView.chooseUser.callback"
					}
				});
			}
		},
		fault: {
			callback: function(data) {
				var backData = {
					event: "fault",
					value: data
				};

				dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(backData) + "')");
			},
			open: function() {
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "mat-fault-list.html",
					url: "../aftersale/mat-fault-list.html?action=select&must=true&prodid=0&title=客户工单",
					extras: {
						selectObj: {},
						callback: "dom.webView.fault.callback"
					}
				});
			}
		},
		equFault: {
			callback: function(data) {
				var backData = {
					event: "equ-fault",
					value: data
				};

				dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(backData).replace(/\\/g, "\\\\") + "')");
			},
			open: function() {
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "fault-list.html",
					url: "../eqmentlib/fault-list.html?action=select&must=true&equid=0&title=设备工单",
					extras: {
						selectObj: {},
						callback: "dom.webView.equFault.callback"
					}
				});
			}
		},
		custom: {
			callback: function(data) {
				var backData = {
					event: "custom",
					value: data
				};

				dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(backData).replace(/\\/g, "\\\\") + "')");
			},
			open: function() {
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "select-cusContact.html",
					url: "../aftersale/select-cusContact.html?must=true",
					extras: {
						selectObj: {},
						callback: "dom.webView.custom.callback"
					}
				});
			}
		},
		supplier: {
			callback: function(data) {
				var backData = {
					event: "supplier",
					value: data
				};

				dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(backData).replace(/\\/g, "\\\\") + "')");
			},
			open: function() {
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "comp-select.html",
					url: "../eqmentlib/comp-select.html?must=true",
					extras: {
						selectObj: {},
						callback: "dom.webView.supplier.callback"
					}
				});
			}
		}
	},

	init: function() {
		this.face.init();
		this.exption.init();
	},
	event: {
		setShowType: function(type) {
			dom.properties.scope.domData.ShowType = type;
			dom.properties.scope.$apply();
		}
	},
	face: {
		data: emotionData,
		lineNum: 7,
		screenNum: 5,
		init: function() {
			var names = Object.getOwnPropertyNames(dom.face.data);
			var counts = Math.ceil(names.length / (dom.face.lineNum * dom.face.screenNum));

			var faceData = emotionData;

			var slide_Indicators = [];
			var slide_Items = [];

			for(var i = 1; i <= counts; i++) {
				var activeClass = "";
				if(i == 1) {
					activeClass = "mui-active";
				}
				slide_Indicators.push('<div class="mui-indicator ' + activeClass + '"></div>')
			}

			mui(".mui-slider-indicator")[0].innerHTML = slide_Indicators.join("");

			var i = 0;
			for(var name in dom.face.data) {
				if(i == 0 || i == 35 || i == 70) {
					slide_Items.push('<div class="mui-slider-item">');
				}

				if((i == 0 || i % 7 == 0) && (i - 1) != 0) {
					slide_Items.push("<div class='face-row'>")
				}

				var imgBack = "../../images/Emotion/Thumb/" + dom.face.data[name] + ".png";
				slide_Items.push("<div class='face-item' data-name='" + name + "' data-value='" + dom.face.data[name] + "'><div style='background-image:url(" + imgBack + ")'>&nbsp;</div></div>");

				if(i == names.length - 1) {

					slide_Items.push("<div class='face-item'><div>&nbsp;</div></div>");
					slide_Items.push("<div class='face-item'><div>&nbsp;</div></div>");
					slide_Items.push("<div class='face-item'><div>&nbsp;</div></div>");
					slide_Items.push("<div class='face-item'><div>&nbsp;</div></div>");
				}

				if(i != 0 && (i + 1) % 7 == 0) {
					slide_Items.push("</div>")
				}

				if(i == 34 || i == 69 || i == names.length - 1) {
					slide_Items.push('</div>')
				}
				i++;
			}

			mui(".mui-slider-group")[0].innerHTML = slide_Items.join("");

			this.tap();

			this.slier();
		},
		tap: function() {

			mui(".mui-content").on("tap", ".face-item", function() {
				var name = this.getAttribute("data-name");
				var value = this.getAttribute("data-value");

				if(name && value) {
					var data = {
						name: name,
						value: value
					};
					dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(data) + "')");
				}
			});
		},
		slier: function() {
			document.querySelector('.mui-slider').addEventListener('slide', function(event) {
				//console.log(event.detail.slideNumber + 1);
			});
		}

	},
	exption: {
		init: function() {
			this.tap();
		},
		tap: function() {
			mui(".mui-content").on("tap", "li.mui-media", function() {
				var type = this.getAttribute("data-type");

				if(!isNetWorkCanUse()) {
					mui.toast("当前无可用网络！");
					return;
				}

				switch(type) {
					case "photo":
						dom.properties.UtilsService.chooseImage(false).then(function(file) {
							var data = {
								event: "photo",
								file: file[0].FilePath
							};
							dom.webView.parent.evalJS(dom.webView.callback + "(" + dom.properties.scope.domData.ShowType + ",'" + JSON.stringify(data) + "')");
						}, function() {});
						//dom.exption.openPhoto();
						break;
					case "card":
						dom.webView.chooseUser.open();
						break;
					case "fault":
						dom.webView.fault.open();
						break;
					case "equ-fault":
						dom.webView.equFault.open();
						break;
					case "custom":
						dom.webView.custom.open();
						break;
					case "supplier":
						dom.webView.supplier.open();
						break;
					default:
						mui.toast("敬请期待呦~~~");
						break;
				}

			});
		}
	}
};

app.controller("faceController", ["$scope", "$sce", "ApiService", "DataService", "CacheService", "UtilsService", "Loading", function($scope, $sce, ApiService, DataService, CacheService, UtilsService, Loading) {

	$scope.domData = {
		ShowType: 0,
		CompID:0
	};

	dom.properties.scope = $scope;
	dom.properties.UtilsService = UtilsService;


    var user = CacheService.get("user");
    user && ($scope.domData.CompID = user.CompID);
}]);

/**
 * 初始化
 * **/

muiObj.init();
mui.plusReady(function() {
	muiObj.plusReady();
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});