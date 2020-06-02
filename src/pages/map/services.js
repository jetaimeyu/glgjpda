mui.init();
var _scope;
var _curDate = new Date();
var curDate = {
    quarter: {
        "1": "一季度",
        "2": "二季度",
        "3": "三季度",
        "4": "四季度"
    },
    curYear: _curDate.getFullYear(),
    curValue: _curDate.getMonth(),
    curType: "month",
    view: _curDate.getFullYear() + "年" + (_curDate.getMonth() + 1) + "月"
};

$("#a_date_view").text(curDate.view);

app.controller("scanProdsCtl", ["$scope", "ApiService", "DataService", "Loading", "DatePickerService", "$Modal", "UtilsService", function($scope, ApiService, DataService, Loading, DatePickerService, modal, UtilsService) {

    $scope.domData = {
        isModal: false,
        curDate: curDate,
        prodInfo: "",
        province: "全国",
        city: "",
        active: [],
        data: "",
        isLoadData: false
    };
    _scope = $scope;

    var _oldBack = mui.back;

    mui.back = function() {
        if ($scope.domData.isModal) {
            modal.close();
        } else {
            bMap.overlay.autoCreate && (bMap.overlay.autoCreate = false);
            _oldBack();
        }
    };

    $scope.$on("modal_close", function() {
        $scope.domData.isModal = false;
    });

    $scope.event = {
        chooseDate: function() {
            var _date = $scope.domData.curDate;
            $scope.domData.isModal = true;
            DatePickerService.getTime(_date.curYear, _date.curValue, _date.curType).then(function(data) {

                _date.curYear = data.year;
                _date.curType = data.type;
                _date.curValue = data.value;
                _date.startDate = data.startDate;
                _date.endDate = data.endDate;
                _date.view = data.view;

                curData.getData();
            });
        },
        datePlus: function() {
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
            $scope.event.getDateRange(function() {
                curData.getData();
            });
        },
        getDateRange: function(callback) {
            var _date = $scope.domData.curDate;

            DatePickerService.getDateRange(parseInt(_date.curYear), parseInt(_date.curValue), _date.curType, function(startDate, endDate, view) {
                _date.startDate = startDate;
                _date.endDate = endDate;
                _date.view = view;

                typeof callback == "function" && (callback());
            });
        },
        dateAdd: function() {
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
            $scope.event.getDateRange(function() {
                curData.getData();
            });
            //$scope.event.getViewDate();
        },
        getViewDate: function() {
            var _date = $scope.domData.curDate;
            switch (_date.curType) {
                case 'year':
                    _date.view = _date.curYear + "年";
                    break;
                case 'quarter':
                    _date.view = _date.curYear + "年" + curDate.quarter[_date.curValue];
                    break;
                case 'month':
                    _date.view = _date.curYear + "年" + _date.curValue + "月";
                    break;
            }

            curData.getData();
        },
        selectProd: function() {
            UtilsService.openWindow({
                id: "problib-index.html",
                url: "../problib/index.html?state=selsku&isall=true",
                extras: {
                    selectObj: $scope.domData.prodInfo,
                    callback: 'faultEquCallback'
                }
            })
        },
        delProd: function(event) {
            event.stopPropagation();
            $scope.domData.prodInfo = "";

            curData.getData();
        },
        chooseType: function(type) {
            var _active = $scope.domData.active;
            if (_active.indexOf(type) >= 0) {
                _active.splice(_active.indexOf(type), 1)
            } else {
                _active.push(type);
            }

            mui.showLoading("", "div");

            bMap.overlay.render();
        }
    };

    //选择产品回调事件
    window.faultEquCallback = function(res) {
        $scope.domData.prodInfo = res;
        $scope.$apply();
        //重新加载高度
        var tools_height = document.querySelector(".map_tools").offsetHeight;
        document.querySelector(".map_types").style.top = tools_height + 47 + "px";
        curData.getData();
    };

    //区域二级联动 选择
    $('#showCityPicker').mPicker({
        level: 2,
        dataJson: cityData,
        Linkage: true,
        rows: 5,
        idDefault: true,
        splitStr: '-',
        shadow: 1,
        confirm: function(json) {
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
        cancel: function(json) {}
    });
    


    var curData = {
        getData: function() {
            mui.showLoading("", "div");
            bMap.overlay.autoCreate = false;
            var _prodInfo = $scope.domData.prodInfo;
            var _date = $scope.domData.curDate;
            var _province = $scope.domData.province;
            var _city = $scope.domData.city;
            var url = ApiService.Api50 + "/api/v1/Customer/GetCustomerCoordinate?beginDate=" + _date.startDate.Format("yyyy-MM-dd 00:00:00") + "&endDate=" + _date.endDate.Format("yyyy-MM-dd 00:00:00");
            if (_prodInfo) {
                url += "&prodId=" + _prodInfo.ProdID;
                _prodInfo.SkuID && (url += "&skuId=" + _prodInfo.SkuID);
            }

            _province != "全国" && (url += "&province=" + _province);
            _city && (url += "&city=" + _city);
            DataService.get(url).then(function(res) {
                $scope.domData.isLoadData = true;
                $scope.domData.data = res;
                bMap.overlay.render();
            }, function() {
                mui.hideLoading();
                mui.toast("加载数据失败!");
            });
        }
    };

    var bMap = {
        container: "map",
        map: "",
        zoom: 4,
        center: new BMap.Point(103.94863, 36.775374),
        init: function() {
            this.map = new BMap.Map(this.container, {
                enableDragging: true,
                enableDblclickZoom: true,
                enablePinchToZoom: true,
                enableInertialDragging: true,
                enableMapClick: false
            });
            this.map.centerAndZoom(this.center, this.zoom);


            this.controler.add();

            //增加一个测试点 然后清除掉
            bMap.overlay.render(true);

            bMap.overlay.clear();

            $scope.event.getDateRange(function() {
                curData.getData();
            });

        },
        controler: {
            zoom: "",
            add: function() {
                var top_right_navigation = new BMap.NavigationControl({
                    anchor: BMAP_ANCHOR_TOP_RIGHT,
                    type: BMAP_NAVIGATION_CONTROL_SMALL
                }); //右
                bMap.map.addControl(top_right_navigation);
            }
        },
        markerData: [],
        mapData: [],
        overlay: {
            clear: function() {
                bMap.map.clearOverlays();
                bMap.markerData = [];
                bMap.mapData = [];
            },
            render: function(_testData) {
                this.clear();
                bMap.overlay.autoCreate = true;

                var _P = _scope.domData.data["P"];
                var _C = _scope.domData.data["C"];
                var _M = _scope.domData.data["M"];

                if (_testData) {
                    _P = [{
                        Lng: 116.404,
                        Lat: 39.915
                    }];
                    _M = [{
                        Lng: 116.404,
                        Lat: 39.915
                    }];
                    _C = [{
                        Lng: 116.404,
                        Lat: 39.915
                    }];
                }

                //安装调试
                if (_scope.domData.active.indexOf("P") < 0 && bMap.overlay.autoCreate) {
                    for (var i = 0; i < _P.length; i++) {
                        var _p = _P[i];
                        bMap.map.addOverlay(bMap.overlay.getMarker(_p, "orange"));
                    }
                }
                //产品故障
                if (_scope.domData.active.indexOf("M") < 0 && bMap.overlay.autoCreate) {
                    for (var i = 0; i < _M.length; i++) {
                        var _m = _M[i];
                        bMap.map.addOverlay(bMap.overlay.getMarker(_m, "red"));
                    }
                }
                //其他服务
                if (_scope.domData.active.indexOf("C") < 0 && bMap.overlay.autoCreate) {
                    for (var i = 0; i < _C.length; i++) {
                        var _c = _C[i];
                        bMap.map.addOverlay(bMap.overlay.getMarker(_c, "green"));
                    }
                }

                mui.hideLoading();
            },
            getMarker: function(_data, type) {
                var _this = this;
                var point = new BMap.Point(_data.MapLng, _data.MapLat);
                var marker = new BMap.Marker(point, {
                    icon: _this.getIcon(type)
                });
                marker.setZIndex(1 + bMap.mapData.length);
                marker.setTop(true);
                marker.addEventListener("click", function(e) {
                    //var _marker = e.target;
                    //var _index = bMap.markerData.indexOf(_marker);

                    //curData.getScanInfo(bMap.mapData[_index].ID);
                });
                bMap.markerData.push(marker);
                bMap.mapData.push(_data);
                return marker;

            },
            getIcon: function(type) {
                var myIcon = new BMap.Icon("../../images/map/point_" + type + ".png", new BMap.Size(16, 16));
                myIcon.imageSize = new BMap.Size(16, 16);
                return myIcon;
            }
        }

    };

    bMap.init();

}]);

mui.plusReady(function() {
    angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});