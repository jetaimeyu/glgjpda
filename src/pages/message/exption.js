var muiObj = {
	init: function() {
		mui.init();
		dom.init();
		mui.plusReady(function() {
			muiObj.plusReady();
		})
	},
	plusReady: function() {
		dom.webView.init();
	}
};

var dom = {
	properties: {},
	init: function() {
		this.event.init();
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
		ToCallback: function(event, data) {

			if(typeof(data) == "string") {
				data = {
					src: data
				}
			}
			
			data = JSON.stringify(data);
			this.parent.evalJS(this.callback + "('" + event + "','" +data + "')");
		}
	},
	event: {
		init: function() {
			this.itemTap();
		},
		itemTap: function() {
			mui(".mui-content").on("tap", "li.mui-media", function() {
				var type = this.getAttribute("data-type");

				switch(type) {
					case "photo":
						dom.event.openPhoto();
						break;
					default:
						mui.toast("敬请期待呦~~~");
						break;
				}

			});
		},
		openPhoto: function() {
			plus.nativeUI.actionSheet({
				title: "图片",
				cancel: "取消",
				buttons: [{
					title: "拍照"
				}, {
					title: "从相册选择照片"
				}]
			}, function(e) {
				if(e.index == 1) { //拍摄照片
					dom.picker.photo.takePictrue();
				} else if(e.index == 2) { //相册选取
					dom.picker.photo.show();
				}
			});
		}
	},
	picker: {
		photo: {
			show: function() {
				pickImage(function(res) {
					if(res) {
						dom.webView.ToCallback("photo", res);
					}

				}, false);
			},
			takePictrue: function() {
				captureImage(function(res) {
					if(res) {
						dom.webView.ToCallback("photo", res);
					}
				});
			}
		}
	}
};

muiObj.init();