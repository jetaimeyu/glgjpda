var app = avalon.define({
	$id: "demandVm",
	PageIndex: 1,
	JoinState: parseInt(query("state") || "0"),
	DemandList: [],
	imgUrl:MdAppUrl.Info,
	ShowMore:1,
	noDemand:'',
	getDemandImages: function(info, ex) {
		if(info && info.PictureInfo!=null) {
			return MdAppUrl.Api45 + "/api/v1.0/epdemand/" + info.PictureInfo.ID + "_" + ex + info.PictureInfo.Ext;
		} else {
			return "../../images/mdempty1.png";
		}
	},
	paddingLeft:mui.os.ios&&(["10.3.3"].indexOf(mui.os.version)>-1)?'20px':''
});
mui.init({
	pullRefresh: {
		container: '#pullrefresh',
		down: {
			callback: pulldownRefresh
		},
		up: {
			contentrefresh: '正在加载...',
			callback: pullupRefresh,
			contentnomore: " "
		}
	}
});



//下拉刷新
mui.plusReady(function() {
	app.PageIndex = 1;
	app.DemandList = [];
	user.ready(function() {
		showWaiting();
		setTimeout(function() {
			getDemandList("down", function() {
				hideWaiting();
			});
		}, 300);
	});
});

window.addEventListener("refreshpage", function(){
	app.PageIndex = 1;
	app.DemandList = [];
	user.ready(function() {
		showWaiting();
		setTimeout(function() {
			getDemandList("down", function() {
				hideWaiting();
			});
		}, 300);
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
function getDemandList(type, callback){
	var url = MdAppUrl.Api45 + "/api/v1.0/EpDemand/GetJoinDemandList?page=" + app.PageIndex + "&pageSize=10" + "&joinState=" + app.JoinState;
	getAjaxData(url, function(reData) {
		if(reData.State == 1) {
			if(reData.Data.DataRows.length > 0){
				reData.Data.DataRows.map(function(item){
					switch(item.State)
					{
						case "选标中":
  							item.className="zhongbiaozhong";
  							break;
						case "未中标":
						 	item.className="weizhongbiao";
						  	break;
						case "已中标":  
							item.className="yizhongbiao";
							break;
						default:
						  item.className="weizhongbiao"
					}
					
				});
			}else{
				app.noDemand="暂无报价";
			}
			if(type == "down") {
				app.DemandList = reData.Data.DataRows;
			} else {
				app.DemandList.pushArray(reData.Data.DataRows);
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
		}
		if(reData.State == 1 && app.DemandList.length >= reData.Data.TotalCount) {
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		} else {
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(false);
			if(type == "down") {
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
				mui("#pullrefresh").pullRefresh().refresh(true);
			}
		}
		if(typeof callback == "function") {
			callback();
		}
	}, true);
}
function imgOnerror(url) {
	//var img = event.srcElement;
	var thisEvent =  window.event || arguments.callee.caller.arguments[0];
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
	var state = this.getAttribute('data-state');
	if(state=='已中标'){
		openWindow("demand_details.html?demandId=" + id, {}, 'demand_details.html');
	}else{
		openWindow("demand.html?demandId=" + id, {}, 'demand.html');
	}
	
});

//定义一个 过滤器  价格显示 lxm
avalon.filters.showPrice=function(price){
	//如果有.00则不显示.00
	//删除       || price.toString().indexOf('.0')>-1
	if(price.toString().indexOf('.00')>-1 ){
		price = parseInt(price);
	}
	return "¥"+price+"元";
}