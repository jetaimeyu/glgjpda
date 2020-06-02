var muiObj = {
	init: function() {
		mui.init();

		mui('#chat_body').scroll({
			deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
		});

		dom.init();
	}
};

var dom = {
	properties: {
		scope: "",
		ApiService: "",
		CacheService: "",
		UtilsService: "",
		DataService: "",
		Loading: "",
		BillService: "",
		apiHost:""
	},
	init: function() {
		this.webView.init();
		this.search.init();
		this.content.init();
	},
	webView: {
		cur: "",
		init: function() {
			this.cur = plus.webview.currentWebview();

			this.initParams();

			//显示键盘
			showInput();
		},
		initParams: function() {
			dom.properties.scope.search.GroupCode =this.cur.GroupCode;
			dom.properties.scope.search.GroupName =this.cur.GroupName;
		}
	},
	search: {
		init: function() {
			//TODO 需要做点击列表的事件
		}
	},
	content: {
		init: function() {
			this.tap();
			this.drag();
		},
		tap: function() {
			mui(".mui-scroll-wrapper").on("tap", ".item_body", function() {
				var msgId = this.getAttribute("data-value");

				dom.webView.cur.opener().evalJS("curData.chatData.loadByMsgId(" + msgId + ")");

				mui.back();
			});
		},
		scrollToBottom: function() {
			mui("#chat_body").scroll().reLayout();
			setTimeout(function() {
				mui("#chat_body").scroll().scrollToBottom(1);
			}, 100);
		},
		drag: function() {
			document.querySelector("#chat_body").addEventListener("drag", function() {

				if(mui("#chat_body").scroll().y < mui("#chat_body").scroll().maxScrollY && event.detail.deltaY < -30 && !curData.search.isLoaddingBT && curData.search.canDragLoadBT) {
					curData.search.isLoaddingBT = true;
				}
			});

			document.querySelector("#chat_body").addEventListener("dragend", function(event) {
				if(curData.search.isLoaddingBT) {
					curData.search.loaddingBT.style.display = "block";
					dom.content.scrollToBottom();
					setTimeout(function() {
						curData.search.loadNextPage();
					}, 300);
				}
			});
		}
	}
}

var curData = {
	search: {
		page: 1,
		count: 20,
		isMore: false,
		canDragLoadBT: false,
		isLoaddingBT: false,
		loaddingBT: document.querySelector("#content-loadding-bt"),
		init: function() {
			//初始化 search 将页数变为1，清空已经存在的数据，显示Loading 等操作
			this.page = 1;
			dom.properties.scope.search.msgList = [];
			curData.search.loaddingBT.style.display = "block";
			//dom.properties.Loading.show();
			this.doSearch();
		},
		//执行查询
		doSearch: function() {

			// mui("#chat_body").scroll().reLayout();
			// mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
			// mui('#chat_body').scroll().scrollTo(0, 0, 0);

			dom.properties.scope.search.isShowNoContent = false;


			var url = dom.properties.apiHost + "/api/v1/Message/MsgGroupRecord_Search?groupCode=" + dom.properties.scope.search.GroupCode + "&pageSize=" + this.count + "&pageIndex=" + this.page + "&sort=2&q=" + encodeURIComponent(dom.properties.scope.search.text);

			dom.properties.DataService.get(url).then(function(data) {
				//加载数据成功
				//dom.properties.Loading.hide();
				var _users = dom.properties.scope.search.GroupUsers;
				data.Data.forEach(function(_item){
					_item.UserName = _users[_item.SendID].MemberName || _users[_item.SendID].ViewName;
					_item.UserLogo = _users[_item.SendID].ULogoIsExist;
				});

				//渲染页面数据
				dom.properties.scope.search.msgList = dom.properties.scope.search.msgList.concat(data.Data);

				curData.search.canDragLoadBT = data.TotolCount > dom.properties.scope.search.msgList.length;

				if(dom.properties.scope.search.msgList.length == 0) {
					dom.properties.scope.search.isShowNoContent = true;
					document.querySelector("#no-key").innerText = dom.properties.scope.search.text;
				}

				//mui("#chat_body").scroll().destroy();
				setTimeout(function() {
					document.querySelector("input").blur();
				}, 200);

				curData.search.loaddingBT.style.display = "none";

				curData.search.isLoaddingBT = false;


				//mui("#chat_body").scroll().reLayout();
			}, function() {
				curData.search.loaddingBT.style.display = "none";
				//mui("#chat_body").scroll().reLayout();

				//加载数据失败
				//dom.properties.Loading.hide();
			});
		},
		//加载下一页的数据
		loadNextPage: function() {
			//页面+1 显示Loading
			this.page += 1;
			//dom.properties.Loading.show();
			this.doSearch();
		},
		//获取群详情
		getGroupInfo: function () {
			var url = dom.properties.apiHost + "/api/v1/Message/GroupInfo?groupCode=" + dom.properties.scope.search.GroupCode;

			dom.properties.DataService.get(url).then(function (data) {
				var chatData = dom.properties.scope.search;
				chatData.GroupInfo = data;
				curData.search.getGroupUsrs();
			});
		},
		getGroupUsrs: function () {
			var url = dom.properties.apiHost + "/api/v1/Message/GroupMemberList_His?groupId=" + dom.properties.scope.search.GroupInfo.ID;
			dom.properties.DataService.get(url).then(function (data) {

				var chatData = dom.properties.scope.search;

				data.forEach(function (_item) {
					chatData.GroupUsers[_item.UserID] = _item;
				});
			});
		}
	}
};

app.controller("chatRecordSearchController", ["$scope", "$sce", "ApiService", "DataService", "CacheService", "UtilsService", "Loading", "BillService", function($scope, $sce, ApiService, DataService, CacheService, UtilsService, Loading, BillService) {
	//聊天对象
	$scope.search = {
		UserID: "",
		UserName: "",
		GroupCode:"",
		GroupName:"",
		GroupUsers:{},
		GroupInfo:"",
		msgList: [],
		UserLogo: false,
		isNetWork: true,
		text: "",
		chatRemarkName: "",
		isShowNoContent: false
	};

	dom.properties.scope = $scope;
	dom.properties.ApiService = ApiService;
	dom.properties.CacheService = CacheService;
	dom.properties.UtilsService = UtilsService;
	dom.properties.DataService = DataService;
	dom.properties.Loading = Loading;
	dom.properties.BillService = BillService;
	dom.properties.apiHost = ApiService.Api50;
	
	$scope.event = {
		getDate: function(date) {
			return GetDate(date, true, true, "yyyy-MM-dd")
		},
		//将发送的内容转换为显示的内容
		transContent: function(content, isSend) {
			var text = transMessage.trans(content, 3);
			return $sce.trustAsHtml(text);
		},
		reload: function() {
			$scope.search.isNetWork = isNetWorkCanUse();
		},
		doSearch: function() {
			this.reload();

			if(!$scope.search.isNetWork) {
				plus.nativeUI.toast("没有可用网络！");
				return;
			}
			if(!trim($scope.search.text)) {
				mui.toast("请输入关键字！");
				plus.nativeUI.toast("请输入关键字！");
				return;
			}

			curData.search.init();
		},
		deleteSearch: function() {
			$scope.search.text = "";
			$scope.search.msgList = [];
			$scope.search.isShowNoContent = false;
		}
	};

	muiObj.init();

	var user = dom.properties.CacheService.get("user");
	user && ($scope.search.UserID = user.UserID) && ($scope.search.UserName = (user.UserName || user.RealName || user.Mdt)) && ($scope.search.UserLogo = user.ULogoIsExist);

	if(!isNetWorkCanUse()) {
		$scope.search.isNetWork = false;
	}
	curData.search.getGroupInfo();
}]);

/**
 * 初始化
 * **/
mui.plusReady(function() {
	setTimeout(function() {
		angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	}, 50)
});