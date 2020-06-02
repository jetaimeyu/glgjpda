var app = avalon.define({
	$id: "appCtl",
	selectIndex: 0,
	userComp: 0,
	delAddressDispaly: function(addr, demand) {
		var fulladdress = '';
		if(addr.Province == undefined) {

		} else {
			if(addr.Province == addr.City) {
				fulladdress = addr.Province + " " + addr.District + addr.Address;
			} else {
				fulladdress = addr.Province + " " + addr.City + " " + addr.District + addr.Address;
			}
		}
		var phone = addr.LinkPhone;
		/*if(user.CompID != demand.CompID) {
			phone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
		}*/
		return fulladdress + " " + " (" + addr.RecvUserName + ") " + phone;
	},
	//处理材料
	delMetarial: function(mid, mname) {
		var meta = metarial.getTextByID(mid);
		if(meta == '') {
			return mname;
		} else {
			return meta;
		}
	},
	//展示图片
	getDemandLogo: function(info, ex) {
		//删除&&(info.Ext=="jpg"||info.Ext=="png"||info.Ext=="bmp"||info.Ext=="gif"||info.Ext=="tiff"||info.Ext=="jpeg")
		if(info && info.Ext != 'pdf') {
			return MdAppUrl.Api45 + "/api/v1.0/epdemand/" + info.ID + "_" + ex + info.Ext;
		} else if(info && info.Ext == "pdf") {
			//return "../../images/defImg70.png";
		} else {
			return "../../images/defImg70.png";
		}
	},
	workShops: "", //加工车间
	offerComp: [],
	offerCompNum: 0,
	pageIndex: 1, //分页
	Demand: {
		DemandName: '',
		LeftTime: '',
		JoinCount: '',
		Amount: '',
		Budget: '',
		BidEndDate: '',
		PreDeliveryDate: '',
		DemandTypeList: [],
		DemandType: '',
		fullAddr: ''
	},
	picUrl: MdAppUrl.pic,
	imageUrl: MdAppUrl.Img,
	ifCreateCompany: 0, //是否是创建企业浏览
	//选标
	chooseOffer: function(state, joinId) {
		if(app.Demand.State == 2) {
			mui.alert("此需求已设置中标企业,请先取消中标企业!")
			return false;
		}
		mui.confirm("确认设置中标企业吗？", "继续退出？", ["确认", "取消"], function(e) {
			if(e.index == 0) {
				var url = url = MdAppUrl.Api45 + "/api/v1/EpDemand/SetSelected?joinId=" + joinId + "&state=" + state;
				getAjaxData(url, function(ret) {
					if(ret.State == 1) {
						//如果是设置中标   成功后设置 需求状态等于 已选标
						app.Demand.State = 2;
						app.offerComp = [];
						app.init();
					} else {
						mui.alert(ret.ErrorMessage);
					}
				}, true);
			}
		})
	},
	// 取消需求
	cancelDemand: function() {
		if(app.Demand.State < 2) {
			var idsArray = [demandId];
			var url = MdAppUrl.Api45 + "/api/v1.0/EpDemand/CancelDemand";
			postAjaxData(url, idsArray, function(reData) {
				if(reData && reData.State == 1) {
					openWindow("../tab/index.html");
				} else {
					mui.alert("取消失败！");
				}
			}, true, true);
		} else {
			mui.alert("已选标的需求不可取消");
			return false;
		}
	},
	getPrice: function(price) {
		//如果有.00则不显示.00
		if(price.toString().indexOf('.00') > -1 || price.toString().indexOf('.0') > -1) {
			price = parseInt(price);
		}
		return "¥" + price + "元";
	}
});
var demandId = query("demandId");

var muiObj = {
	init: function() {
		mui.init({
			gestureConfig: {
				drag: true
			}
		});
		this.plusReadyInit();
	},
	plusReadyInit: function() {
		mui.plusReady(this.plusReadyCallback)
	},
	plusReadyCallback: function() {
		plus.webview.currentWebview().setStyle({
			scrollIndicator: 'none',
			softinputMode: "adjustResize"
		});
	}
}

var demandObj = {
	init: function() {
		mui(".md-tab").on("tap", ".md-tab-item", function() {
			var obj = this;
			var index = obj.getAttribute("index");
			var arr = document.getElementsByClassName("md-tab-item");
			for(var i = 0; i < arr.length; i++) {
				arr[i].classList.remove("md-active");
			}
			obj.classList.add("md-active");
			app.selectIndex = index;
		});

		//绑定报价按钮
		mui("body").on('tap', '#offerBtn', function() {
			app.OfferDemand();
		});

		//取消报价按钮
		mui("body").on('tap', '#cancelBtn', function() {
			app.cancelOffer();
		});

		//绑定跳转按钮
		mui("body").on('tap', '.contactBtn', function(e) {
			var id = this.getAttribute('data-cid');
			openWindow("../company/compconsulting.html?id=" + id);
		});

		//跳转到企业 todo
		mui("body").on('tap', '.companyInfo', function() {
			var id = this.getAttribute('data-cid');
			var index = this.getAttribute('data-index');
			var raw_data = app.offerComp[index];
			var data = {
				Mdt: raw_data.CompMdt,
				CompName: raw_data.JoinCompName,
				MainProduct: raw_data.MainProduct,
				ID: raw_data.ID
			}
			openWindow("../industry/comp-info.html?id=" + id, {
				data: data
			});
		});

		//绑定选标按钮
		mui("body").on('tap', '.chooseBtn', function() {
			var id = this.getAttribute('data-jid');
			var state = this.getAttribute('data-state');
			app.chooseOffer(state, id);
		});

		//绑定取消按钮 todo
		mui("body").on('tap', '.cancelDemand', function() {
			mui('.mui-popover').popover("hide");
			mui.confirm("确定取消需求吗？", "继续操作？", ["确定", "取消"], function(e) {
				if(e.index == 0) {
					app.cancelDemand();
				}
			});
		});

		//播放录音
		mui("body").on('tap', ".voice", function(e) {
			e.stopPropagation();

			//判断本地有没有录音文件
			var img = this.querySelector("img");
			//判断当前点击的是否正在播放
			if(img.classList.contains("isplay")) {
				stopAudio(img);
			} else {
				//寻找，有无其他语音正在播放
				var imgOld = document.body.querySelector(".voice img.isplay");
				if(imgOld) {
					stopAudio(imgOld);
				}
				//播放当前点击语音
				play(this, img);
			}
		});
		var audioDir = "_doc/audio/";

		var player = null;
		//播放当前
		function play(This, img) {
			var id = This.getAttribute("data-id");
			//标记为播放
			img.src = "../../images/voice-play.gif";
			img.classList.add("isplay");

			var audioFile = audioDir + "demand/" + id + ".amr";

			//文件是否存在，存在则直接播放
			plus.io.resolveLocalFileSystemURL(audioFile, function(e) {
				playAudio(img, audioFile);
			}, function(e) {
				//从网上下载到本地，并播放
				var audioUrl = MdAppUrl.Api45 + "/api/v1.0/ProcessProgress/" + id + ".amr";
				downloadFile(audioUrl, audioFile, function(d, status) {
					//下载成功后，也要判断，是否在下载的时候用户播放了其他的语音
					if(status == 200 && img.classList.contains("isplay")) {
						playAudio(img, audioFile);
					} else {
						stopAudio(img);
					}
				});
			});
		}
		//播放本地语音文件
		function playAudio(img, localFile) {
			player = plus.audio.createPlayer(localFile);
			player.play(function() {
				stopAudio(img, true);
			}, function(e) {
				stopAudio(img, true);
			})
		}
		//停止播放指定语音
		function stopAudio(img, isautostop) {
			if(player && !isautostop) {
				player.stop();
			}
			img.src = "../../images/voice.png";
			img.classList.remove("isplay");
		}

		user.ready(function() {
			demandObj.getDemandInfo();
			demandObj.getOfferComp();

			if(user.CompID != 0) {
				app.userComp = user.CompID;
			}
			demandObj.plugin.mescroll.init();
		});
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
						noMoreSize: 5,
						offset: 100,
						page: {
							num: 0,
							size: 10,
							time: null
						},
						htmlLoading: '<p class="upwarp-progress mescroll-rotate"></p><p class="upwarp-tip">正在加载加工进度...</p>',
						htmlNodata: '<p class="upwarp-nodata">-- 我是有底线的 --</p>',
						empty: {
							warpId: "mescroll-empty",
							icon: "../../images/myoffer/icon_data.png",
							tip: "暂无加工进度",
							btntext: "",
							btnClick: null
						},
						callback: demandObj.plugin.mescroll.upCallback
					}
				});
			},
			upCallback: function(page) {
				demandObj.getSchedules(page.num, function(res) {
					if(res && res.State > 0) {
						res.Data.list && demandObj.plugin.mescroll.obj.endSuccess(res.Data.list.length);
						if(page.num == 1) {
							app.workShops = [];
						}
						app.workShops.pushArray(res.Data.list);
					} else {
						mui.toast(res.ErrorMessage);
						demandObj.plugin.mescroll.obj.endErr();
					}
				});
			}

		}
	},
	getDemandInfo: function() {
		var url = MdAppUrl.Api45 + "/api/v1.0/EpDemand/GetDemandInfo?demandId=" + demandId;
		getAjaxData(url, function(reData) {
			if(reData && reData.State == 1 && reData.Data) {
				reData.Data.fullAddr = app.delAddressDispaly(reData.Data.PostAddrModel, reData.Data);
				reData.Data.MaterialName = app.delMetarial(reData.Data.MaterialID, reData.Data.MaterialName);
				app.Demand = reData.Data;
				//如果有.00这种格式则不显示
				if(reData.Data.Budget.toString().indexOf('.00') > -1 || reData.Data.Budget.toString().indexOf('.0') > -1) {
					app.Demand.Budget = parseInt(reData.Data.Budget) + "元";
				}
				if(reData.Data.Budget == 0) {
					app.Demand.Budget = "无";
				}

				var userData = localGet("user");
				if(userData != null) {
					if(reData.Data.CompID == userData.CompID) {
						app.ifCreateCompany = 1;
					}
				}

				//剩余天数逻辑判断
				var leftTime = reData.Data.LeftTime;
				if(leftTime > 0) {
					app.Demand.LeftTime = "剩余天数：" + leftTime + "天";
				} else if(leftTime <= 0) {
					app.Demand.LeftTime = "剩余天数：已过期";
				}
				mui.previewImage();
			}
		}, 'get', true);
	},
	//获得加工进度
	getSchedules: function(page, callback) {
		var sc_url = MdAppUrl.Api45 + '/api/v1.0/EpDemand/GetEPProcessByWorkShop?WorkShopID=0&DemandId=' + demandId + '&isUser=0&page=' + page + '&pageSize=10';
		getAjaxData(sc_url, function(reData) {
			callback(reData);
		}, 'get', true);
	},
	//获取报价企业
	getOfferComp: function() {
		var compUrl = MdAppUrl.Api45 + '/api/v1.0/EpDemand/GetJoinCompanyList?pageSize=10000000&page=' + app.pageIndex + '&demandId=' + demandId;
		getAjaxData(compUrl, function(reData) {
			if(reData.State == 1) {
				app.offerCompNum = reData.Data.TotalCount;
				app.offerComp.pushArray(reData.Data.DataRows);
			}
		}, true)
	}
}

mui.plusReady(function() {
	muiObj.init();
	demandObj.init();
});