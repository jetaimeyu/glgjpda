var app = avalon.define({
	$id: 'appController',
	ImgSrc: MdAppUrl.pic + "/" + imgPath.cmpLogo,
	PageIndex: 1,
	Viewpermission: true, //是否有查看权限
	OrderList: "", //出库单列表
	TotalCount: 0
});

/**
 * 初始化下拉刷新
 */
mui.plusReady(function() {
	showWaiting();

	user.ready(function() {
		setTimeout(function() {
			if(user.Token) {
				setTimeout(function() {
					getOrderList();

				}, 500);
			} else {
				mui.toast("您尚未登录，无法查看此信息！");
			}
		}, 300);
	});
});

//获取出库单列表
function getOrderList() {

	//localSave('test', [{ id: 1, code: '5170117000055000117062901000048', name: "张三" }, { id: 1, code: '5170117000055000117062901000048', name: "张三" }]);
	var localhistory = localGet("Scan_History" + user.UserID) || [];
	console.log(JSON.stringify(localhistory))
	localhistory.forEach(function(item) {
		item.Name = decodeURIComponent(item.Name);
		item.SkuName = decodeURIComponent(item.SkuName);
		if(item.type == 1) {
			if(user.CompID == item.CompID) {
				item.parameters = "../problib/scanDetails.html?MDCode=" + item.mdCode + "&ProdID=" + item.ID + "&ProdName=" + item.Name + "&SkuID=" + item.SkuID + "&SkuName=" + item.SkuName + "&ProdInnerCode=" + item.InnerCode + "&LogoIsExist=" + item.LogoIsExist + "&CompID=" + item.CompID + "&CompName=" + item.CompName + "&CodeCreateUserName=" + item.CodeCreateUserName
			} else {
				item.parameters = "../problib/prod-info.html?mdcode=" + item.mdCode + "&prodid=" + item.ID + "&skuid=" + item.SkuID + "&CodeCreateUserName=" + item.CodeCreateUserName;
			}
		} else {
			item.parameters = "../eqmentlib/equ-details.html?equid=" + item.ID;
		}
	})
	app.OrderList = localhistory;

	hideWaiting();
	app.totalCount = app.OrderList.length;

};

//查询接口中返回指定mdcode的基本信息
function getProData(arr, key) {
	for(var i = 0; i < arr.length; i++) {

		if(arr[i].MdCode == key) {
			return arr[i];
		}
	}
	return '';
}

//刷新列表
function loadPage() {
	location.reload();
};

//处理不同类型的记录跳转到不同地址{type:1,scanTime:'',mdCode:'',parameters:''}   type 1 产品扫码2,设备扫码 3 关注企业  4 加好友····
avalon.filters.jumpUrl = function(obj, b, c) {
	obj.href = obj.href.parameters;
	return obj;
}