var app = avalon.define({
	$id: 'appCtrl',
	Type: "", //类型 1.外协业务，2外协企业，3外协设备
	Callback: "", //父页面回调方法
	Opener: "", //父页面对象
	CollectData: '', //搜藏的列表
	TypeData: '', //分类列表
	//导航分类
	NavData: [{
		CName: "全部",
		ID: 3383
	}],
	CurLevel: 0, //导航当前选择
	List: {}, //各级数组对象缓存
	//是否已经收藏
	IsCollect: function(id) {
		var temp = app.CollectData.filter(function(obj) {
			return id == obj.ClassID;
		});
		return temp.length > 0 ? "icon-star color-yellow" : "icon-star-empty color-gray-dark";
	},
	//是否收藏已经选中
	IsCollChecked: function(id) {
		var temp = app.SelectClass.filter(function(obj) {
			return id == obj.id;
		});
		return temp.length > 0;
	},
	//是否列表已经选中
	IsChecked: function(id) {
		return app.SelectedClass.id == id ? "icon-select color-blue-dark" : "icon-range color-gray-deep";
		var temp = app.SelectClass.filter(function(obj) {
			return id == obj.id;
		});
		return temp.length > 0 ? "icon-select color-blue-dark" : "icon-range color-gray-deep";
	},
	QueryData: [],
	SearchTitle: "", //传过来的查询条件
	SelectClass: [], //选中的分类
	SelectedClass: {},
	IsOpen: false,
});

mui(".mui-scroll-wrapper").scroll({
	deceleration: 0.0006,
	bounce: true
});

mui.init({
	gestureConfig: {
		tap: true, //默认为true
		doubletap: false, //默认为false
		longtap: false
	}
});
//重写mui.back 事件
var old_back = mui.back;
mui.back = function() {
	//判断是否有输入框
	if(document.getElementById("search-history").classList.contains("show")) {
		document.getElementById("txtSearch").blur();
	} else {
		if(app.NavData.length > 1) {
			mui.trigger(document.querySelector("#backNav"), 'tap');
		} else {
			old_back();
		}
	}
};
mui.plusReady(function() {

	//设置键盘弹出方式
	plus.webview.currentWebview().setStyle({
		softinputMode: "adjustResize"
	});

	mui('.mui-scroll-wrapper').scroll();

	//获取传入的参数
	var view = plus.webview.currentWebview();
	app.Opener = view.opener();
	app.Callback = view.callback;
	app.SearchTitle = view.search_title || "";
	app.SelectClass = view.search_classList || [];
	app.SelectedClass = view.search_classList;

	if(app.SearchTitle)
		document.getElementById("txtSearch").value = app.SearchTitle;

	user.ready(function() {

		showWaiting();

		//获取加工分类
		setTimeout(loadTypeData, 300);

		//加载本地搜索数据
		setTimeout(loadLocalSearh, 100);
	});
});

//获取加工分类
function loadTypeData() {
	if(!app.List[app.NavData[app.CurLevel].ID]) {
		var url = MdAppUrl.Api45 + "/api/v1/PkgClass/GetSubClass?pid=" + app.NavData[app.CurLevel].ID;

		getAjaxData(url, function(res) {
			if(res && res.State > 0 && res.Data) {
				app.TypeData = res.Data;
				app.List[app.NavData[app.CurLevel].ID] = res.Data;
			} else {
				app.TypeData = '-1';
				mui.toast("加载分类失败!");
			}

			setTimeout(function() {
				document.getElementById("divBody").style.display = "block";
				document.getElementById("footer").style.display = "block";

				hideWaiting();
			}, 100);
		}, true);
	} else {
		app.TypeData = app.List[app.NavData[app.CurLevel].ID];
	}
};

//获取本地搜索记录
function loadLocalSearh() {
	var data = localGet("comp-search-" + user.UserID);
	if(data) {
		app.QueryData = data;
	}
};

//保存搜索记录到本地
function saveLoalSearch(data) {
	if(app.QueryData.length == 20) {
		app.QueryData.splice(19, 1);
	}

	if(app.QueryData.indexOf(data) >= 0) {
		app.QueryData.splice(app.QueryData.indexOf(data), 1);
	}

	app.QueryData.splice(0, 0, data);

	localSave("comp-search-" + user.UserID, app.QueryData.$model);
};

//搜索按钮点击事件
mui("header").on("tap", ".mui-icon-search", function() {
	app.SearchTitle = document.getElementById("txtSearch").value.trim();
	callBack(2, {
		search_title: app.SearchTitle,
		search_classList: ""
	});
});

//搜索历史行点击事件
mui(".data-group").on("tap", ".serach-item", function() {
	var value = this.getAttribute("data-value");
	callBack(2, {
		search_title: value,
		search_classList: ""
	});
});

mui("header").on("tap", ".clear-input", function() {
		app.SearchTitle = "";
	})
	.on("tap", ".search", function() {
		if(app.SearchTitle.trim() == "") {
			mui.toast("请输入关键字！");
			return false;
		}

		app.SearchTitle = app.SearchTitle.replace(/ /g, '');

		callBack(2, {
			search_title: app.SearchTitle,
			search_classList: ""
		})

	});

//输入框焦点事件
document.getElementById("txtSearch").addEventListener("focus", function() {
	document.getElementById("search-history").classList.add("show");
	//document.getElementById("cancel").style.display = "block";
	document.getElementById("footer").style.display = "none";
});

//输入框失去焦点
document.getElementById("txtSearch").addEventListener("blur", function() {
	document.getElementById("search-history").classList.remove("show");
	//document.getElementById("cancel").style.display = "none";
	document.getElementById("footer").style.display = "block";
});

//输入框取消
//document.getElementById("cancel").addEventListener("tap", function() {
//	app.SearchTitle = "";
//	document.getElementById("txtSearch").value = "";
//});

//点击整行选择分类
mui(".data-group").on("tap", ".li-item", function() {
	var name = this.getAttribute("data-name");
	var id = this.getAttribute("data-id");
	var path = this.getAttribute("data-path");

	var selectDom = this.childNodes[0];
	//如果是当前未选中，则选中，否则取消选中
	if(selectDom.classList.contains('icon-range')) {
		//移除未选中样式，添加选中样式
		selectDom.classList.remove('icon-range');
		selectDom.classList.remove('color-gray-deep');
		selectDom.classList.add('icon-select');
		selectDom.classList.add('color-blue-dark');

		//添加到选中数组中
		var temp = {
			id: id,
			name: name,
			path: path
		}
		//app.SelectClass.push(temp);
		app.SelectedClass = temp;
	} else if(selectDom.classList.contains('icon-select')) {
		//移除选中样式，添加未选中样式
		selectDom.classList.remove('icon-select');
		selectDom.classList.remove('color-blue-dark');
		selectDom.classList.add('icon-range');
		selectDom.classList.add('color-gray-deep');

		app.SelectedClass = {};
		hideSelect();

		//从已选中的数组中移除
		//		app.SelectClass = app.SelectClass.filter(function(obj) {
		//			return id !== obj.id;
		//		});
		//		if(app.SelectClass.length == 0) {
		//			hideSelect();
		//		}
	}
});

//选择下级
mui(".data-group").on("tap", ".nextClass", function(e) {
	if(this.classList.contains("color-gray")) {
		mui.toast("暂无下级分类！");
		e.stopPropagation();
		return;
	}

	mui('.mui-scroll-wrapper').scroll()[0].scrollTo(0, 0, 100);

	var name = this.parentElement.getAttribute("data-name");
	var id = this.parentElement.getAttribute("data-id");

	app.NavData.push({
		ID: id,
		CName: name
	});

	app.CurLevel = app.NavData.length - 1;

	app.TypeData = "";
	loadTypeData();

	setTimeout(function() {
		var dom = document.querySelector("#res-slide");
		if(dom) {
			var scrollWidth = dom.clientWidth - dom.scrollWidth;
			mui("#res-slide").scroll().scrollTo(scrollWidth, 0, 0);
		}

	}, 100);

	e.stopPropagation();
});

//导航栏点击事件
mui(".data-group").on("tap", ".mui-control-item", function() {
	if(this.classList.contains("mui-active")) {
		return;
	}

	var idx = this.getAttribute("idx");

	var pushData = [];
	for(var i = 0; i <= parseInt(idx); i++) {
		var data = app.NavData[i];

		pushData.push(data);
	}

	app.NavData = pushData;
	app.CurLevel = app.NavData.length - 1;

	setTimeout(function() {
		var scrollWidth = document.querySelector("#res-slide").clientWidth - document.querySelector("#res-slide").scrollWidth;
		mui("#res-slide").scroll().scrollTo(scrollWidth, 0, 0);
	}, 100);

	loadTypeData();

});

//返回上一级
document.getElementById("backNav").addEventListener("tap", function() {
	app.NavData.splice(app.NavData.length - 1, 1);
	app.CurLevel = app.NavData.length - 1;

	setTimeout(function() {
		var scrollWidth = document.querySelector("#res-slide").clientWidth - document.querySelector("#res-slide").scrollWidth;
		mui("#res-slide").scroll().scrollTo(scrollWidth, 0, 0);
	}, 100);

	loadTypeData();
});

//筛选提交
document.getElementById("submit_btn").addEventListener("tap", function() {
	callBack(1, {
		search_title: "",
		search_classList: app.SelectedClass
	});
});

//执行返回数据方法
function callBack(type, data) {
	if(app.Callback) {
		//type==1按照分类查询，2按照搜索条件模糊查询
		if(type == 1) {
			//返回上一个页面，执行方法
			app.Opener.evalJS(app.Callback + "('" + JSON.stringify(data) + "')");
		} else if(type == 2) {
			//含有搜索数据时，保存到本地搜索历史中
			if(data.search_title)
				saveLoalSearch(data.search_title);

			//返回上一个页面，执行方法
			app.Opener.evalJS(app.Callback + "('" + JSON.stringify(data) + "')");
		}

		document.getElementById("txtSearch").blur();
		old_back();
	}
};

//全部清除
document.getElementById("clearClass").addEventListener("tap", function() {
	app.SelectClass = [];
	hideSelect();
});

//底部选择类目行点击事件
mui("footer").on("tap", "#selNum", function(e) {
	var dom = document.querySelector("footer .choosed-body");
	if(dom.style.display == "none" && app.SelectClass.length > 0) {
		document.querySelector("#divBody").style.marginBottom = "150px";
		dom.style.display = "block";
		app.IsOpen = true;
	} else {
		hideSelect();
	}
	e.stopPropagation();
});

function hideSelect() {
	document.querySelector("#divBody").style.marginBottom = "44px";
	document.querySelector("footer .choosed-body").style.display = "none";
	app.IsOpen = false;
};

//底部选择类目删除事件
mui("footer").on("tap", ".icon-close", function(e) {
	var idx = this.parentElement.getAttribute("idx");
	app.SelectClass.splice(idx, 1);
	if(app.SelectClass.length == 0) {
		hideSelect();
	}
	e.stopPropagation();
});