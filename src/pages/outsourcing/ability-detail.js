//mui事件
var muiObj = {
	init: function() {
		mui.init();
		muiObj.ready();

		curData.load();
	},
	readyEvent: function() {

	},
	ready: function() {
		mui.plusReady(muiObj.readyEvent);
	}
};

var dom = {
	init: function() {
		dom.event.init();
	},
	event: {
		init: function() {

		}
	},
	plugin: {
		swiper: {
			obj: "",
			load: function() {
				dom.plugin.swiper.obj = new Swiper('.swiper-container', {
					pagination: '.swiper-pagination',
					paginationClickable: true,
					spaceBetween: 30,
					autoplay: 3000
				});
			}
		}
	}
};

var curData = {
	load: function() {
		var url = MdAppUrl.Api45 + "/api/v1.0/Equipment/GetEqInfoForMobile?equipmentId=" + vm.id;
		getAjaxData(url, function(res) {
			if(res && res.State == 1) {
				vm.abilityData = res.Data;
			} else {

			}
		});
	}

};

//avalon事件
var vm = avalon.define({
	$id: "myCtl",
	id: query("id"),
	abilityData: {},
	getPic: function(id, ex) {
		return MdAppUrl.Api45 + "/api/v1/Equipment/" + id + "_" + ex + ".png"
	},
	picComplete: function() {

		if(vm.abilityData.EqPictureList && vm.abilityData.EqPictureList.length > 0) {
			var sliderDom = document.querySelector(".mui-slider");
			mui(sliderDom).slider({
				interval: 1500
			});
			dom.plugin.swiper.load();
		}

	},
	getIntro: function() {
		return vm.abilityData.Intro.replace("/plugins/ueditor/net/upload/image", MdAppUrl.Info + "/plugins/ueditor/net/upload/image");
	}

});

mui.plusReady(function() {
	muiObj.init();
	dom.init();
})