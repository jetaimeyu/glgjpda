var app = avalon.define({
	$id: "demandVm",
	PageIndex: 1,
	DemandList: [],
	imgUrl: MdAppUrl.Info,
	noDemand:'',
	getDemandImages: function(info, ex) {
		if(info && info.PictureInfo!=null) {
			return MdAppUrl.Api45 + "/api/v1.0/epdemand/" + info.PictureInfo.ID + "_" + ex + info.PictureInfo.Ext;
		} else {
			return "../../images/mdempty1.png";
		}
	}
});
mui.init(
	{
	pullRefresh: {
		container: '#pullrefresh',
		down: {
			height:40,
			callback: pulldownRefresh
		},
		up: {
			contentrefresh: '正在加载...',
			callback: pullupRefresh,
			contentnomore: " "
		}
	}
	}
);

//var scroller = mui(".mui-scroll").pullToRefresh({
//	down: {
//		height: 40,
//		callback: pulldownRefresh
//	},
//	up: {
//		callback: pullupRefresh,
//		show:false,
//		contentnomore: "无更多外协需求信息"
//	}
//});

//下拉刷新
mui.plusReady(function() {
	user.ready(function() {
		setTimeout(function(){
			app.PageIndex = 1;
			getDemandList("down",function() {
				hideWaiting();
			});
		}, 300)
	});
});

/**
 * 下拉刷新具体业务实现
 */
function pulldownRefresh() {
	setTimeout(function() {
		app.PageIndex = 1;
		getDemandList("down");
	}, 500);
}
/**
 * 上拉加载具体业务实现
 */
function pullupRefresh() {
	setTimeout(function() {
		//加载更多页数+1
		app.PageIndex += 1;
		getDemandList("up");
	}, 500);
}

function getDemandList(type, callback) {
	var url = MdAppUrl.Api45 + "/api/v1.0/EpDemand/GetEqDemands?page=" + app.PageIndex + "&pageSize=10&SortType=1&isDescending=true";
	getAjaxData(url, function(reData) {
		if(reData.State == 1) {
			if(type == "down") {
				app.DemandList = reData.Data.DataRows;
			} else {
				app.DemandList.pushArray(reData.Data.DataRows);
			}
			if(app.DemandList.length == 0) {
				app.noDemand="暂无需求";
			}
		} else {
			mui.toast(reData.ErrorMessage);

			if(!app.DemandList) {
				app.DemandList = [];
			}
		}
		if(type == "down") {
			mui("#pullrefresh").pullRefresh().endPulldownToRefresh(true);
			mui('#pullrefresh').pullRefresh().refresh(true);
//			scroller.endPullDownToRefresh();
//			scroller.refresh(true);
		}
		if(reData.State == 1 && app.DemandList.length >= reData.Data.TotalCount) {
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
			//scroller.endPullUpToRefresh(true);
		} else {
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(false);
			//scroller.endPullUpToRefresh(false);

			if(type == "down") {
				mui("#pullrefresh").pullRefresh().endPulldownToRefresh(true);
				mui('#pullrefresh').pullRefresh().refresh(true);
				//scroller.refresh(true);
			}
		}
		if(typeof callback == "function") {
			callback();
		}
	}, true);
}

avalon.filters.day = function(a) {
	a = parseInt(a);
	return a;
}

function imgOnerror(url) {
	//var img = event.srcElement;
	var thisEvent = window.event || arguments.callee.caller.arguments[0];
	var img = thisEvent.srcElement ? thisEvent.srcElement : thisEvent.target;
	if(url == undefined || url == '' || url == null) {
		img.src = img.getAttribute('z-src');
	} else {
		img.src = url;
	}
}

//打开需求详情
mui("body").on("tap", ".demand-detail", function() {
	var id = this.getAttribute('data-did');
	openWindow("demand.html?demandId=" + id, {}, 'demand.html');
});