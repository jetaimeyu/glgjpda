mui.init();

var _curDate = new Date();
var curDate = {
    quarter: {
        "1": "一季度",
        "2": "二季度",
        "3": "三季度",
        "4": "四季度"
    },
    days: [],
    curYear: _curDate.getFullYear(),
    curValue: _curDate.getMonth(),
    curType: "month",
    curDay: _curDate.getDate(),
    view: _curDate.getFullYear() + "年" + (_curDate.getMonth() + 1) + "月"
};

$("#a_date_view").text(curDate.view);

app.controller("scanProdsCtl", ["$scope", "ApiService", "DataService", "Loading", "DatePickerService", "$Modal", "UtilsService", "$filter", "AuthService", "CacheService", "LocationService", function ($scope, ApiService, DataService, Loading, DatePickerService, modal, UtilsService, $filter, AuthService, CacheService, LocationService) {

    $scope.domData = {
        isModal: false,
        curDate: curDate,
        prodInfo: "",
        province: "全国",
        city: "",
        scanInfo: "",
        isOpenSys: false,
        InnerCodeName: ""
    };

    var curLocation = {};
    UtilsService.getLocation().then(function (obj) {
        curLocation = obj
    });

    var user = CacheService.get("user");

    $scope.userId = query("userId");
    if (!$scope.userId) {
        $scope.userId = user.UserID;
    }


    AuthService.getAuth().then(function (res) {
        $scope.domData.InnerCodeName = res.InnerCodeName || '出厂编号';
    });

    var _oldBack = mui.back;

    var oldBack = mui.back;
    mui.back = function () {
        if ($scope.domData.isModal) {
            modal.close();
        } else {
            bMap.overlay.autoCreate && (bMap.overlay.autoCreate = false);
            _oldBack();
        }
    };

    $scope.$on("modal_close", function () {
        $scope.domData.isModal = false;
    });

    $scope.event = {
        chooseDate: function () {
            var _date = $scope.domData.curDate;
            $scope.domData.isModal = true;
            DatePickerService.getTime(_date.curYear, _date.curValue, _date.curType).then(function (data) {

                _date.curYear = data.year;
                _date.curType = data.type;
                _date.curValue = data.value;
                _date.startDate = data.startDate;
                _date.endDate = data.endDate;
                _date.view = data.view;
                $scope.event.getDays();
                curData.getData();
            });
        },
        datePlus: function () {
            var _date = $scope.domData.curDate;
            switch (_date.curType) {
                case 'year':
                    _date.curYear = parseInt(_date.curYear) - 1;
                    break;
                case 'quarter':
                    _date.curValue = parseInt(_date.curValue) - 1;
                    if (_date.curValue == 0) {
                        _date.curValue = 4;
                        _date.curYear -= 1;
                    }
                    break;
                case 'month':
                    _date.curValue = parseInt(_date.curValue) - 1;
                    if (_date.curValue == -1) {
                        _date.curValue = 11;
                        _date.curYear -= 1;
                    }
                    break;
            }
            $scope.event.getDateRange(function () {
                curData.getData();
            });

        },
        getDateRange: function (callback) {
            var _date = $scope.domData.curDate;

            DatePickerService.getDateRange(parseInt(_date.curYear), parseInt(_date.curValue), _date.curType, function (startDate, endDate, view) {
                _date.startDate = startDate;
                _date.endDate = endDate;
                _date.view = view;
                $scope.event.getDays();
                typeof callback == "function" && (callback());
            });
        },
        dateAdd: function () {
            var _date = $scope.domData.curDate;
            switch (_date.curType) {
                case 'year':
                    _date.curYear = parseInt(_date.curYear) + 1;
                    break;
                case 'quarter':
                    _date.curValue = parseInt(_date.curValue) + 1;
                    if (_date.curValue == 5) {
                        _date.curValue = 1;
                        _date.curYear += 1;
                    }
                    break;
                case 'month':
                    _date.curValue = parseInt(_date.curValue) + 1;
                    if (_date.curValue == 12) {
                        _date.curValue = 0;
                        _date.curYear += 1;
                    }
                    break;
            }
            $scope.event.getDateRange(function () {
                curData.getData();
            });
        },
        selectProd: function () {
            UtilsService.openWindow({
                id: "problib-index.html",
                url: "../problib/index.html?state=selsku&isall=true",
                extras: {
                    selectObj: $scope.domData.prodInfo,
                    callback: 'faultEquCallback'
                }
            })
        },
        delProd: function (event) {
            event.stopPropagation();
            $scope.domData.prodInfo = "";
            curData.getData();
        },
        getDays: function () {

            var _date = $scope.domData.curDate;

            if (_date.curType == 'month') {
                var _curDate = angular.copy(_date.startDate).addMonths(1);

                _curDate.setDate(0);
                var _days = _curDate.getDate();
                _date.days = [];
                for (var i = 1; i <= _days; i++) {
                    _date.days.push(i);
                }
            }
        },
        dayPlus: function () {
            var _date = $scope.domData.curDate;

            if (_date.curDay == '整月') {
                _date.curDay = _date.days[_date.days.length - 1];
            } else if (_date.curDay == 1) {
                _date.curDay = '整月';
            } else {
                _date.curDay = _date.days[_date.curDay - 2];
            }

            curData.getData();
        },
        dayAdd: function () {
            var _date = $scope.domData.curDate;

            if (_date.curDay == '整月') {
                _date.curDay = _date.days[0];
            } else if (_date.curDay == _date.days[_date.days.length - 1]) {
                _date.curDay = '整月';
            } else {
                _date.curDay = _date.days[_date.curDay];
            }

            curData.getData();

        },
        hideDayPick: function () {
            document.querySelector(".day-pick").style.display = "none";
        },
        dayChoose: function (value) {
            $scope.domData.curDate.curDay = value;
            curData.getData();
            document.querySelector(".day-pick").style.display = "none";
        },
        showDayChoose: function () {
            document.querySelector(".day-pick").style.display = "block";
        },
        showScanInfo: function () {
            document.querySelector(".scan-info").style.display = "block";
        },
        hideScanInfo: function () {
            document.querySelector(".scan-info").style.display = "none";
            $scope.domData.scanInfo = "";
        },
        openComp: function (event, compId) {
            event.stopPropagation();
            UtilsService.openWindow({
                needLogin: true,
                id: 'complib-index.html',
                url: '../complib/index.html?compid=' + compId
            });
        },
        openUser: function (event, userId) {
            event.stopPropagation();

            if (userId > 0) {
                UtilsService.openWindow({
                    needLogin: true,
                    id: 'personal-info.html',
                    url: '../contact/personal-info.html?userid=' + userId
                });
            }

        },
        openLog: function (event, mdCode, prodId, skuId) {
            event.stopPropagation();

            UtilsService.openWindow({
                needLogin: true,
                id: "prodScanInfos.html",
                url: "prodScanInfos.html?mdcode=" + mdCode + "&prodid=" + prodId + "&skuid=" + skuId
            });

        },
        openTrack: function (event, mdCode, prodId, skuId) {
            event.stopPropagation();

            UtilsService.openWindow({
                needLogin: true,
                id: "template.html",
                url: "template.html?key=prodTrack&mdcode=" + mdCode + "&prodid=" + prodId + "&skuid=" + skuId
            });
        },
        openSysMap: function () {
            var data = bMap.mapData[bMap.mapData.length - 1];
            LocationService.bdDecrypt({
                lng: data.MapLng,
                lat: data.MapLat
            }).then(function (res) {
                var dst = new plus.maps.Point(res.lng, res.lat);
                var src = new plus.maps.Point(curLocation.lng, curLocation.lat);
                // 调用系统地图显示 
                plus.maps.openSysMap(dst, "目的地", src);
            });
        }
    };

    //选择产品回调事件
    window.faultEquCallback = function (res) {
        $scope.domData.prodInfo = res;
        $scope.$apply();

        curData.getData();
    };

    //区域二级联动 选择
    $('#showCityPicker').mPicker({
        level: 2,
        dataJson: cityData,
        Linkage: true,
        rows: 6,
        idDefault: true,
        splitStr: '-',
        shadow: 1,
        confirm: function (json) {
            var items = json.values.split('-');
            var _zoom = 4;
            if (items[1] == '全省' || items[1] == '全自治区' || items[0] == '全国') {
                $scope.domData.province = items[0];
                $scope.domData.city = '';

                if (items[0] != '全国') {
                    bMap.map.centerAndZoom($scope.domData.province, 6);
                } else {
                    bMap.map.centerAndZoom(bMap.center, 4);
                }

            } else {
                $scope.domData.city = items[1];
                $scope.domData.province = items[0];

                bMap.map.centerAndZoom($scope.domData.city, 9)
            }
            curData.getData();
        },
        cancel: function (json) {}
    });



    var curData = {
        getData: function () {
            mui.showLoading("", "div");

            var _prodInfo = $scope.domData.prodInfo;
            var _date = $scope.domData.curDate;
            var _province = $scope.domData.province;
            var _city = $scope.domData.city;

            var startDate = angular.copy(_date.startDate);
            var endDate = angular.copy(_date.endDate);

            if (_date.curType == 'month' && _date.curDay != '整月') {
                startDate = new Date(startDate.setDate(_date.curDay));
                endDate = new Date(angular.copy(startDate).addDays(1));
            }

            var url = ApiService.Api50 + "/api/v1/Customer/GetUserTrip?startDate=" + startDate.Format("yyyy-MM-dd 00:00:00") + "&endDate=" + endDate.Format("yyyy-MM-dd 00:00:00") + "&userId=" + $scope.userId;

            if (_prodInfo) {
                url += "&productId=" + _prodInfo.ProdID;
                _prodInfo.SkuID && (url += "&skuId=" + _prodInfo.SkuID);
            }

            _province != "全国" && (url += "&province=" + _province);
            _city && (url += "&city=" + _city);
            DataService.get(url).then(function (res) {

                bMap.overlay.render(res);

            }, function () {
                mui.hideLoading();
                mui.toast("加载数据失败!");
            });
        },
        getScanInfo: function (id) {
            UtilsService.openWindow({
                id: "checklist/checkDetail",
                url: "../crm/index.html#/checklist/checkDetail?cid=" + id + "&backIndex=1"
            });
            return;
            var url = ApiService.Api50 + "/api/v1/Prod/GetMdScanCodeById/" + id;

            DataService.get(url).then(function (res) {
                res.Address = res.Address.replace(res.Province, "");
                res.Address = res.Address.replace(res.District, "");
                res.Address = res.Address.replace(res.City, "");
                $scope.domData.scanInfo = res;
                $scope.event.showScanInfo();
                mui.hideLoading();
            }, function () {
                mui.hideLoading();
                plus.nativeUI.toast("加载信息失败！");
            });
        }
    };


    var bMap = {
        container: "map",
        map: "",
        zoom: 4,
        center: new BMap.Point(103.94863, 36.775374),
        init: function () {

           

            this.map = new BMap.Map(this.container, {
                enableDragging: true,
                enableDblclickZoom: true,
                enablePinchToZoom: true,
                enableInertialDragging: true,
                enableMapClick: false
            });
            this.map.centerAndZoom(this.center, this.zoom);

            this.controler.add();

            bMap.getLocation(function(){
                $scope.event.getDateRange(function () {
                    $scope.event.getDays();
                    curData.getData();
                });
            });
        },
        getLocation:function(callback){
            UtilsService.getLocation(true).then(function (location) {
                var point = new BMap.Point(location.lng, location.lat);
              
                var marker = new BMap.Marker(point, {
                    icon:  new BMap.Icon('http://api0.map.bdimg.com/images/geolocation-control/point/position-icon-14x14.png', new BMap.Size(16, 16))
                });
                bMap.curLocation.point = point;
                bMap.curLocation.marker = marker;

                callback();
               
            });
        },
        curLocation:{
            marker:null,
            point:null,
        },
        controler: {
            zoom: "",
            add: function () {
                var top_right_navigation = new BMap.NavigationControl({
                    anchor: BMAP_ANCHOR_TOP_RIGHT,
                    type: BMAP_NAVIGATION_CONTROL_SMALL
                }); //右
                bMap.map.addControl(top_right_navigation);
            }
        },
        markerData: [],
        mapData: [],
        linePoints: [],
        mapPoints: [],
        overlay: {
            autoCreate: true,
            clear: function () {
                bMap.map.clearOverlays();
                bMap.markerData = [];
                bMap.mapData = [];
                bMap.linePoints = [];
                bMap.mapPoints = [];
                bMap.map.addOverlay(bMap.curLocation.marker);
            },
            renderMarker: function (_index) {
                var _type = "orange";
                var data = bMap.mapData;
                data.length == 1 && (_type = "red");
                (data.length > 1 && _index == 0) && (_type = "green");
                (data.length > 1 && _index == data.length - 1) && (_type = "red");
                var marker = bMap.overlay.getMarker(_index, _type);
                bMap.map.addOverlay(marker);

                bMap.map.setViewport(bMap.map.getViewport(bMap.mapPoints));
                if( bMap.map.getZoom()>17)
                {
                    bMap.map.setZoom(17);
                }
            },
            render: function (data) {
                this.clear();

                bMap.mapData = data;

                if (bMap.mapData.length > 0) {
                    this.renderMarker(0);
                    $scope.domData.isOpenSys = true;
                }

                mui.hideLoading();
            },
            getMarker: function (_index, type) {
                var _this = this;
                var data = bMap.mapData;
                var point = new BMap.Point(data[_index].MapLng, data[_index].MapLat);
                bMap.linePoints.push(point);
                var marker = new BMap.Marker(point, {
                    icon: _this.getIcon(type)
                });

                var _zIndex = _index + 1;
                if (_index == data.length - 1) {
                    _zIndex = data.length + 100;
                } else if (_index == 0) {
                    _zIndex = data.length + 50;
                }
                marker.setZIndex(_zIndex);
                marker.addEventListener("click", function (e) {
                    var _marker = e.target;
                    var _index = bMap.markerData.indexOf(_marker);

                    curData.getScanInfo(bMap.mapData[_index].ID);
                });


                if (_index > 0) {
                    var points = [];
                    points.push(new BMap.Point(data[_index - 1].MapLng, data[_index - 1].MapLat));
                    points.push(point);

                    var polyline = new BMap.Polyline(points, {
                        strokeColor: "blue",
                        strokeWeight: 2,
                        strokeOpacity: 0.5
                    }); //创建折线
                    bMap.map.addOverlay(polyline); //增加折线	
                }

                bMap.mapPoints.push(point);




                bMap.markerData.push(marker);

                if (_index < bMap.mapData.length - 1 && bMap.overlay.autoCreate) {
                    setTimeout(function () {
                        bMap.overlay.renderMarker(_index + 1);
                    }, 500);
                }

                return marker;

            },
            getIcon: function (type) {
                var myIcon = new BMap.Icon("../../images/map/point_" + type + ".png", new BMap.Size(16, 16));
                myIcon.imageSize = new BMap.Size(16, 16);
                return myIcon;
            }
        }

    };


    bMap.init();



}]);

mui.plusReady(function () {

    angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});